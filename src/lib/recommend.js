// Orders feed events for a user. Tries the AI (/api/recommend) first; if it fails, is
// slow (> 6 s) or returns nothing usable, sorts locally by shared tags, then distance.
// The feed is never empty because of the AI.

const TIMEOUT_MS = 6000

// Remembers AI results per user + event set, so returning to the feed is instant.
const cache = new Map()

function sharedTags(user, event) {
  return event.tags.filter((t) => user.interests?.includes(t)).length
}

export function fallbackOrder(user, events) {
  return [...events].sort(
    (a, b) =>
      sharedTags(user, b) - sharedTags(user, a) ||
      (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity) ||
      new Date(a.starts_at) - new Date(b.starts_at),
  )
}

async function askAi(user, events) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        user: { interests: user.interests, lat: user.lat, lng: user.lng },
        events: events.map((e) => ({
          id: e.id,
          title: e.title,
          tags: e.tags,
          starts_at: e.starts_at,
          distance_km: e.distance_km == null ? null : Math.round(e.distance_km * 10) / 10,
        })),
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data?.recommendations) ? data.recommendations : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// Returns { events, source } where each event has `reason` (string or null)
// and source is 'ai' or 'fallback'.
export async function recommendEvents(user, events) {
  if (!events.length) return { events: [], source: 'fallback' }

  const key = `${user.id}|${user.interests?.join(',')}|${events.map((e) => e.id).join(',')}`
  let recs = cache.get(key)
  if (!recs) {
    recs = await askAi(user, events)
    if (recs?.length) cache.set(key, recs)
  }

  if (!recs?.length) {
    return { events: fallbackOrder(user, events).map((e) => ({ ...e, reason: null })), source: 'fallback' }
  }

  // Trust only ids we sent; anything the AI skipped goes after, in fallback order.
  const byId = new Map(events.map((e) => [e.id, e]))
  const ordered = []
  for (const rec of recs) {
    const event = byId.get(rec?.event_id)
    if (!event) continue
    byId.delete(rec.event_id)
    ordered.push({ ...event, reason: typeof rec.reason === 'string' && rec.reason.trim() ? rec.reason.trim() : null })
  }
  const rest = fallbackOrder(user, [...byId.values()]).map((e) => ({ ...e, reason: null }))
  return { events: [...ordered, ...rest], source: 'ai' }
}
