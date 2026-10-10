import { CalendarDays, Sparkle } from 'lucide-react'
import Avatar from '../../components/ui/Avatar.jsx'
import Card from '../../components/ui/Card.jsx'
import { Tag } from '../../components/ui/Chip.jsx'
import { shortTag } from '../../lib/constants.js'
import { attendeesText, eventFormat, formatEventDate, friendsGoingText, shortDistance, splitVenue } from '../../lib/format.js'

// "AI", "HACKATHON": the first topic plus the format.
export function EventTags({ event }) {
  const format = eventFormat(event)
  const tags = [event.tags[0] && shortTag(event.tags[0]), format].filter(Boolean)
  if (!tags.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <Tag key={t}>{t}</Tag>
      ))}
    </div>
  )
}

// Friend initials, then "+N" for everyone else going.
export function GoingAvatars({ friends, total }) {
  const shown = friends.slice(0, 2)
  const rest = total - shown.length
  if (!shown.length) return null
  return (
    <span className="flex -space-x-2" role="img" aria-label={friendsGoingText(friends)}>
      {shown.map((f) => (
        <Avatar key={f.id} name={f.name} size="xs" className="ring-3 ring-surface" />
      ))}
      {rest > 0 && (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-soft font-display text-sm font-bold text-soft-ink ring-3 ring-surface">
          +{rest}
        </span>
      )}
    </span>
  )
}

function goingText(event) {
  if (!event.isGoing) return attendeesText(event.attendeeCount)
  const others = event.attendeeCount - 1
  return others > 0 ? `You and ${others} more are going` : "You're going"
}

export default function EventCard({ event }) {
  const venue = splitVenue(event.venue)
  const meta = [formatEventDate(event.starts_at), venue.name, shortDistance(event.distance_km)].filter(Boolean)

  return (
    <Card to={`/events/${event.id}`} className="flex flex-col gap-4">
      <EventTags event={event} />

      <div className="flex flex-col gap-2">
        <h2 className="font-display text-2xl leading-snug font-bold">{event.title}</h2>
        <p className="flex gap-2 text-muted">
          <CalendarDays size={20} className="mt-0.5 shrink-0" />
          <span>{meta.join(' · ')}</span>
        </p>
      </div>

      <p className="flex items-center gap-3 font-display font-bold">
        <GoingAvatars friends={event.friendsGoing} total={event.attendeeCount} />
        {goingText(event)}
      </p>

      {event.reason && (
        <p className="flex gap-3 border-t border-line pt-4 text-ai">
          <Sparkle size={18} className="mt-1 shrink-0" />
          <span>{event.reason}</span>
        </p>
      )}
    </Card>
  )
}
