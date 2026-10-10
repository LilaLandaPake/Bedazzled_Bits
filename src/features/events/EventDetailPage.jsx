import {
  CalendarDays,
  ExternalLink,
  FlaskConical,
  Lock,
  MapPin,
  MessageCircle,
  SearchX,
  Star,
  UserCheck,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Chip from '../../components/ui/Chip.jsx'
import Header from '../../components/ui/Header.jsx'
import { EmptyState, ErrorState, Loading } from '../../components/ui/States.jsx'
import { getEvent, joinEvent, leaveEvent } from '../../lib/db.js'
import { formatDistance } from '../../lib/distance.js'
import { attendeesText, formatEventDate, friendsGoingText } from '../../lib/format.js'
import { clearSession, getCurrentUser } from '../../lib/session.js'

// Only link out to real web pages.
const safeUrl = (url) => (/^https?:\/\//i.test(url ?? '') ? url : null)

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', event: null, error: '' })
  const [attempt, setAttempt] = useState(0)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    let cancelled = false
    getEvent(id, getCurrentUser())
      .then(({ me, event }) => {
        if (cancelled) return
        if (!me) {
          clearSession()
          navigate('/', { replace: true })
          return
        }
        setState({ status: event ? 'ready' : 'missing', event, error: '' })
      })
      .catch((err) => !cancelled && setState({ status: 'error', event: null, error: err.message }))
    return () => {
      cancelled = true
    }
  }, [id, attempt, navigate])

  function reload() {
    setAttempt((n) => n + 1)
  }

  async function toggleGoing() {
    setSaving(true)
    setActionError('')
    try {
      if (state.event.isGoing) await leaveEvent(id, getCurrentUser())
      else await joinEvent(id, getCurrentUser())
      reload()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (state.status === 'loading') {
    return (
      <>
        <Header title="Event" back="/events" />
        <Loading label="Loading event…" />
      </>
    )
  }

  if (state.status === 'error') {
    return (
      <>
        <Header title="Event" back="/events" />
        <ErrorState
          message={state.error}
          onRetry={() => {
            setState((s) => ({ ...s, status: 'loading' }))
            reload()
          }}
        />
      </>
    )
  }

  if (state.status === 'missing') {
    return (
      <>
        <Header title="Event" back="/events" />
        <EmptyState
          icon={SearchX}
          title="Event not found"
          message="It may have been removed, or the link is incomplete."
          action={<Button to="/events">See all events</Button>}
        />
      </>
    )
  }

  const { event } = state
  const link = safeUrl(event.url)

  return (
    <>
      <Header title="Event" back="/events" />

      <div className="flex flex-col gap-5">
        {event.friendsGoing.length > 0 && (
          <Chip tone="gold" icon={Users} className="self-start">
            {friendsGoingText(event.friendsGoing)}
          </Chip>
        )}

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl leading-tight font-extrabold">{event.title}</h1>
          <p className="flex items-center gap-2 text-text-main/80">
            <CalendarDays size={18} className="shrink-0 text-accent-purple" />
            {formatEventDate(event.starts_at)}
          </p>
          {event.venue && (
            <p className="flex items-center gap-2 text-text-main/80">
              <MapPin size={18} className="shrink-0 text-accent-purple" />
              <span>
                {event.venue}
                {event.distance_km != null && (
                  <span className="text-text-main/60"> · {formatDistance(event.distance_km)}</span>
                )}
              </span>
            </p>
          )}
          <div className="mt-1 flex flex-wrap gap-1.5">
            {event.tags.map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </div>
        </div>

        {event.description && <p className="leading-relaxed whitespace-pre-line text-text-main/90">{event.description}</p>}

        {(event.creator || link) && (
          <div className="flex flex-col gap-3">
            {event.creator && (
              <p className="text-sm text-text-main/70">
                {event.is_user_created ? 'Idea shared by ' : 'Added by '}
                {event.creator.id === getCurrentUser() ? (
                  <span className="font-semibold">you</span>
                ) : (
                  <Link to={`/u/${event.creator.id}`} className="font-semibold text-accent-purple underline-offset-2 hover:underline">
                    {event.creator.name}
                  </Link>
                )}
              </p>
            )}
            {link && (
              <Button variant="secondary" icon={ExternalLink} href={link}>
                Event website
              </Button>
            )}
          </div>
        )}

        <Card className="flex flex-col gap-3">
          <p className="flex items-center gap-2 font-bold">
            <Users size={18} className="text-accent-purple" />
            {attendeesText(event.attendeeCount)}
          </p>

          {event.isGoing ? (
            <ul className="flex flex-col gap-2">
              {event.attendees.map((a) => (
                <li key={a.id}>
                  <Link
                    to={a.isMe ? '/profile' : `/u/${a.id}`}
                    className="flex items-center gap-3 rounded-xl p-1 transition active:bg-white/5"
                  >
                    <Avatar name={a.name} size="sm" />
                    <span className="flex-1">
                      <span className="font-semibold">{a.isMe ? 'You' : a.name}</span>
                      {a.role && <span className="block text-xs text-text-main/60">{a.role}</span>}
                    </span>
                    {a.isFriend && <Chip tone="gold">Friend</Chip>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 text-sm text-text-main/70">
              <Lock size={15} className="shrink-0" />
              Join to see who's going and chat with them.
            </p>
          )}
        </Card>

        <div className="flex flex-col gap-3">
          {actionError && (
            <p role="alert" className="text-center text-sm text-primary">
              {actionError}
            </p>
          )}
          {event.isGoing ? (
            <>
              <p className="flex items-center justify-center gap-2 font-semibold text-primary">
                <UserCheck size={18} /> You're going
              </p>
              <Button full icon={MessageCircle} to={`/events/${id}/chat`}>
                Open event chat
              </Button>
              <Button full variant="ghost" loading={saving} onClick={toggleGoing}>
                I can't go anymore
              </Button>
            </>
          ) : (
            <Button full icon={UserCheck} loading={saving} onClick={toggleGoing}>
              I want to go
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-accent-purple/40 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-accent-purple">
            <FlaskConical size={16} /> Demo
          </p>
          <p className="text-sm text-text-main/70">
            Skip ahead to after the event and privately rate the women you went with.
          </p>
          <Button variant="secondary" size="sm" icon={Star} to={`/events/${id}/rate`} className="self-start">
            Simulate event finished
          </Button>
        </div>
      </div>
    </>
  )
}
