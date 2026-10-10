import { EVENT_FORMATS } from './constants.js'

const TIME_ZONE = 'Europe/Madrid'

const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TIME_ZONE })
const longDayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TIME_ZONE })
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE })
const keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }) // YYYY-MM-DD

const valid = (date) => !Number.isNaN(date.getTime())

function dayLabel(date, fmt) {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const key = keyFmt.format(date)
  if (key === keyFmt.format(now)) return 'Today'
  if (key === keyFmt.format(tomorrow)) return 'Tomorrow'
  return fmt.format(date).replace(',', '')
}

// "Today · 19:00", "Tomorrow · 10:30", "Sat 17 Oct · 17:00" (Barcelona time).
export function formatEventDate(iso) {
  const date = new Date(iso)
  if (!valid(date)) return ''
  return `${dayLabel(date, dayFmt)} · ${timeFmt.format(date)}`
}

// "Saturday 10 October" (or "Today" / "Tomorrow").
export function formatLongDay(iso) {
  const date = new Date(iso)
  return valid(date) ? dayLabel(date, longDayFmt) : ''
}

// "19:00 – 21:00", or "19:00" when there's no end time.
export function formatTimeRange(startIso, endIso) {
  const start = new Date(startIso)
  if (!valid(start)) return ''
  const end = endIso ? new Date(endIso) : null
  return end && valid(end) && end > start ? `${timeFmt.format(start)} – ${timeFmt.format(end)}` : timeFmt.format(start)
}

// "Lila is going", "Lila and 1 other friend are going", "Lila and 2 other friends are going".
export function friendsGoingText(friends) {
  if (!friends?.length) return ''
  const [first, ...rest] = friends
  if (!rest.length) return `${first.name} is going`
  return `${first.name} and ${rest.length} other ${rest.length === 1 ? 'friend' : 'friends'} are going`
}

export function attendeesText(count) {
  if (!count) return 'Be the first to go'
  return `${count} ${count === 1 ? 'woman is' : 'women are'} going`
}

// "18:04" for today, "Thu 8 Oct, 18:04" otherwise (Barcelona time).
export function formatMessageTime(iso) {
  const date = new Date(iso)
  if (!valid(date)) return ''
  const time = timeFmt.format(date)
  return keyFmt.format(date) === keyFmt.format(new Date()) ? time : `${dayFmt.format(date).replace(',', '')}, ${time}`
}

// "just now", "5m ago", "2h ago", "3d ago", "2w ago".
export function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms)) return ''
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return `${Math.floor(d / 7)}w ago`
}

// "Biblioteca Jaume Fuster, Gràcia" -> { name: 'Biblioteca Jaume Fuster', place: 'Gràcia' }.
// Without a comma the whole string is the name and the place is Barcelona.
export function splitVenue(venue) {
  const value = (venue ?? '').trim()
  const i = value.lastIndexOf(',')
  if (i === -1) return { name: value, place: 'Barcelona' }
  return { name: value.slice(0, i).trim(), place: value.slice(i + 1).trim() }
}

// "1.2 km", "800 m", "nearby" (same neighbourhood centre).
export function shortDistance(km) {
  if (km == null) return ''
  if (km < 0.15) return 'nearby'
  return km < 1 ? `${Math.round(km * 10) * 100} m` : `${km.toFixed(1)} km`
}

// The stored format, or one guessed from the title for events saved without it.
export function eventFormat(event) {
  if (EVENT_FORMATS.includes(event.format)) return event.format
  const title = event.title?.toLowerCase() ?? ''
  return EVENT_FORMATS.find((f) => title.includes(f.toLowerCase())) ?? null
}
