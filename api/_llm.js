// Shared AI call for the /api functions (the leading underscore keeps Vercel from
// publishing this file as an endpoint). Returns parsed JSON matching `schema`.
//
// Provider is picked from the environment:
//   GEMINI_API_KEY    -> Google Gemini (free tier available)   model: GEMINI_MODEL
//   ANTHROPIC_API_KEY -> Anthropic Claude                      model: ANTHROPIC_MODEL
// If both are set, AI_PROVIDER=gemini|anthropic chooses; otherwise Gemini wins.

export class NotConfiguredError extends Error {}

export function provider() {
  const forced = process.env.AI_PROVIDER?.toLowerCase()
  if (forced === 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (forced === 'gemini' && process.env.GEMINI_API_KEY) return 'gemini'
  if (process.env.GEMINI_API_KEY) return 'gemini'
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  return null
}

// Gemini's schema support is narrower: drop `additionalProperties`.
function withoutAdditionalProperties(schema) {
  if (Array.isArray(schema)) return schema.map(withoutAdditionalProperties)
  if (!schema || typeof schema !== 'object') return schema
  return Object.fromEntries(
    Object.entries(schema)
      .filter(([key]) => key !== 'additionalProperties')
      .map(([key, value]) => [key, withoutAdditionalProperties(value)]),
  )
}

// Some models wrap JSON in ```json fences even when asked not to.
function parseJson(text) {
  if (typeof text !== 'string') throw new Error('No text in AI response')
  return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''))
}

async function callGemini({ system, user, schema, maxTokens, signal }) {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
      system_instruction: system,
      input: user,
      generation_config: { max_output_tokens: maxTokens, thinking_level: 'minimal' },
      response_format: { type: 'text', mime_type: 'application/json', schema: withoutAdditionalProperties(schema) },
    }),
  })
  if (!res.ok) throw new Error(`Gemini API error ${res.status}: ${await res.text()}`)

  const data = await res.json()
  if (data.status && data.status !== 'completed') throw new Error(`Gemini status ${data.status}`)
  const text = (data.steps ?? [])
    .filter((s) => s.type === 'model_output')
    .flatMap((s) => s.content ?? [])
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('')
  return parseJson(text)
}

async function callAnthropic({ system, user, schema, maxTokens, signal }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
      max_tokens: maxTokens,
      system,
      output_config: { format: { type: 'json_schema', schema } },
      messages: [{ role: 'user', content: user }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`)

  const message = await res.json()
  if (message.stop_reason !== 'end_turn') throw new Error(`Anthropic stop_reason ${message.stop_reason}`)
  return parseJson(message.content?.find((b) => b.type === 'text')?.text)
}

// Throws NotConfiguredError when no key is set, or Error on any API/timeout/parse failure.
export async function generateJson({ system, user, schema, maxTokens, timeoutMs }) {
  const which = provider()
  if (!which) throw new NotConfiguredError('No AI key configured')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const args = { system, user, schema, maxTokens, signal: controller.signal }
    return which === 'gemini' ? await callGemini(args) : await callAnthropic(args)
  } finally {
    clearTimeout(timer)
  }
}
