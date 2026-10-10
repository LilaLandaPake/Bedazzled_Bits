import { CalendarDays, ExternalLink, Lock, MapPin, MessageCircle, SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Header from '../../components/ui/Header.jsx'
import { Eyebrow } from '../../components/ui/PageTitle.jsx'
import { EmptyState, ErrorState, Loading } from '../../components/ui/States.jsx'
import { getEvent, joinEvent, leaveEvent } from '../../lib/db.js'
import {
  attendeesText,
  formatLongDay,
  formatTimeRange,
  friendsGoingText,
  shortDistance,
  splitVenue,
} from '../../lib/format.js'
import { clearSession, getCurrentUser } from '../../lib/session.js'
import { EventTags, GoingAvatars } from './EventCard.jsx'

// Only link out to real web pages.
const safeUrl = (url) => (/^https?:\/\//i.test(url ?? '') ? url : null)

// Descriptions longer than this are clamped to 4 lines with "Read more".
const LONG_DESCRIPTION = 220

function InfoRow({ icon: Icon, title, detail }) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-primary">
        <Icon size={28} />
      </span>
      <div className="min-w-0">
        <p className="font-display text-xl font-bold">{title}</p>
        {detail && <p className="text-muted">{detail}</p>}
      </div>
    </div>
  )
}

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', event: null, error: '' })
  const [attempt, setAttempt] = useState(0)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [expanded, setExpanded] = useState(false)

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
        <Header back="/events" />
        <Loading label="Loading event…" />
      </>
    )
  }

  if (state.status === 'error') {
    return (
      <>
        <Header back="/events" />
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
        <Header back="/events" />
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
  const venue = splitVenue(event.venue)
  const distance = shortDistance(event.distance_km)
  const long = (event.description?.length ?? 0) > LONG_DESCRIPTION

  return (
    <div className="flex flex-1 flex-col">
      <Header back="/events" />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <EventTags event={event} />
          <h1 className="font-display text-4xl leading-tight font-extrabold tracking-tight">{event.title}</h1>
        </div>

        <div className="flex flex-col gap-4">
          <InfoRow
            icon={CalendarDays}
            title={formatLongDay(event.starts_at)}
            detail={formatTimeRange(event.starts_at, event.ends_at)}
          />
          {event.venue && (
            <InfoRow
              icon={MapPin}
              title={venue.name}
              detail={[venue.place, distance === 'nearby' ? 'In your area' : distance && `${distance} from your area`]
                .filter(Boolean)
                .join(' · ')}
            />
          )}
        </div>

        <Card className="flex flex-col gap-3">
          <Eyebrow as="h2">Who's going</Eyebrow>
          <p className="font-display text-2xl font-bold">{attendeesText(event.attendeeCount)}</p>

          {event.friendsGoing.length > 0 && (
            <p className="flex items-center gap-3 font-bold">
              <GoingAvatars friends={event.friendsGoing} total={event.friendsGoing.length} />
              {friendsGoingText(event.friendsGoing)}
            </p>
          )}

          {event.isGoing ? (
            <ul className="mt-1 flex flex-col gap-1">
              {event.attendees.map((a) => (
                <li key={a.id}>
                  <Link
                    to={a.isMe ? '/profile' : `/u/${a.id}`}
                    className="-mx-2 flex items-center gap-3 rounded-2xl p-2 transition active:bg-soft"
                  >
                    <Avatar name={a.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{a.isMe ? 'You' : a.name}</span>
                      {a.role && <span className="block truncate text-sm text-muted">{a.role}</span>}
                    </span>
                    {a.isFriend && (
                      <span className="rounded-lg bg-soft px-2.5 py-1 text-sm font-bold text-soft-ink">Friend</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex gap-3 text-muted">
              <Lock size={20} className="mt-0.5 shrink-0" />
              Join to see who they are. All are vouched members.
            </p>
          )}
        </Card>

        {(event.description || event.creator || link) && (
          <section className="flex flex-col gap-3">
            <Eyebrow as="h2">About</Eyebrow>
            {event.description && (
              <>
                <p className={`text-lg leading-relaxed whitespace-pre-line ${long && !expanded ? 'line-clamp-4' : ''}`}>
                  {event.description}
                </p>
                {long && (
                  <Button variant="link" className="self-start" onClick={() => setExpanded((v) => !v)}>
                    {expanded ? 'Show less' : 'Read more'}
                  </Button>
                )}
              </>
            )}
            {event.creator && (
              <p className="text-muted">
                {event.is_user_created ? 'Idea shared by ' : 'Added by '}
                {event.creator.id === getCurrentUser() ? (
                  <span className="font-bold text-ink">you</span>
                ) : (
                  <Link to={`/u/${event.creator.id}`} className="font-bold text-ink underline underline-offset-2">
                    {event.creator.name}
                  </Link>
                )}
              </p>
            )}
            {link && (
              <Button variant="secondary" icon={ExternalLink} href={link} className="self-start">
                Event website
              </Button>
            )}
          </section>
        )}
      </div>

      <div className="min-h-8 flex-1" />
      <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-line bg-bg/95 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur">
        {actionError && (
          <p role="alert" className="text-center font-bold text-primary">
            {actionError}
          </p>
        )}
        {event.isGoing ? (
          <>
            <Button full size="lg" icon={MessageCircle} to={`/events/${id}/chat`}>
              Open group chat
            </Button>
            <Button variant="link" className="self-center" loading={saving} onClick={toggleGoing}>
              I can't go anymore
            </Button>
          </>
        ) : (
          <Button full size="lg" loading={saving} onClick={toggleGoing}>
            I'll go — join
          </Button>
        )}
        <p className="flex items-center justify-center gap-3">
          <span className="rounded-md border-2 border-muted px-2 py-0.5 font-display text-sm font-bold tracking-[0.12em] text-muted">
            DEMO
          </span>
          <Link
            to={`/events/${id}/rate?demo=1`}
            className="font-display font-bold text-muted underline decoration-2 underline-offset-4"
          >
            Simulate event finished
          </Link>
        </p>
      </div>
    </div>
  )
}
