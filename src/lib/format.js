const TIME_ZONE = 'Europe/Madrid'

const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TIME_ZONE })
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE })
const keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }) // YYYY-MM-DD

// "Today · 19:00", "Tomorrow · 10:30", "Sat 17 Oct · 17:00" (Barcelona time).
export function formatEventDate(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const key = keyFmt.format(date)
  const day = key === keyFmt.format(now) ? 'Today' : key === keyFmt.format(tomorrow) ? 'Tomorrow' : dayFmt.format(date)
  return `${day} · ${timeFmt.format(date)}`
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
