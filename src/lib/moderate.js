import { MODERATION_CATEGORIES } from './constants.js'

const TIMEOUT_MS = 6000

// Asks /api/moderate about a message that has already been sent.
// Returns { category, reason } when it should be flagged, otherwise null
// (including when the AI fails or is slow — sending is never blocked by the AI).
export async function checkMessage(text, recent) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch('/api/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ text, recent }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data?.flagged !== true || !MODERATION_CATEGORIES.includes(data.category)) return null
    return { category: data.category, reason: typeof data.reason === 'string' ? data.reason : '' }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
