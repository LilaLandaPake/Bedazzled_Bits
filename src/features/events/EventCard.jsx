import { CalendarDays, Check, MapPin, Sparkles, Users } from 'lucide-react'
import Card from '../../components/ui/Card.jsx'
import Chip from '../../components/ui/Chip.jsx'
import { formatDistance } from '../../lib/distance.js'
import { attendeesText, formatEventDate, friendsGoingText } from '../../lib/format.js'

export default function EventCard({ event }) {
  return (
    <Card to={`/events/${event.id}`} className="flex flex-col gap-3">
      {event.friendsGoing.length > 0 && (
        <Chip tone="gold" icon={Users} className="self-start">
          {friendsGoingText(event.friendsGoing)}
        </Chip>
      )}

      <div className="flex flex-col gap-1">
        <h2 className="text-lg leading-snug font-bold">{event.title}</h2>
        <p className="flex items-center gap-1.5 text-sm text-text-main/75">
          <CalendarDays size={15} className="shrink-0" />
          {formatEventDate(event.starts_at)}
        </p>
        {event.venue && (
          <p className="flex items-center gap-1.5 text-sm text-text-main/75">
            <MapPin size={15} className="shrink-0" />
            <span className="truncate">
              {event.venue}
              {event.distance_km != null && ` · ${formatDistance(event.distance_km)}`}
            </span>
          </p>
        )}
      </div>

      {event.reason && (
        <p className="flex gap-2 rounded-xl bg-accent-gold/10 px-3 py-2 text-sm text-accent-gold">
          <Sparkles size={16} className="mt-0.5 shrink-0" />
          <span>{event.reason}</span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {event.tags.map((tag) => (
          <Chip key={tag}>{tag}</Chip>
        ))}
      </div>

      <p className="flex items-center gap-1.5 text-sm text-text-main/60">
        {event.isGoing ? (
          <>
            <Check size={15} className="text-primary" />
            <span className="font-semibold text-primary">You're going</span>
            <span>· {attendeesText(event.attendeeCount)}</span>
          </>
        ) : (
          attendeesText(event.attendeeCount)
        )}
      </p>
    </Card>
  )
}
