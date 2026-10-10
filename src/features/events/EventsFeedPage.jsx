import { CalendarPlus, SearchX, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Chip from '../../components/ui/Chip.jsx'
import Header from '../../components/ui/Header.jsx'
import { EmptyState, ErrorState, Loading } from '../../components/ui/States.jsx'
import { INTERESTS } from '../../lib/constants.js'
import { getFeed } from '../../lib/db.js'
import { recommendEvents } from '../../lib/recommend.js'
import { clearSession, getCurrentUser } from '../../lib/session.js'
import EventCard from './EventCard.jsx'

export default function EventsFeedPage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', me: null, events: [], source: null, error: '' })
  const [attempt, setAttempt] = useState(0)
  const [tag, setTag] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { me, events } = await getFeed(getCurrentUser())
        if (cancelled) return
        if (!me) {
          // Stored id no longer exists (e.g. data was reset): start over.
          clearSession()
          navigate('/', { replace: true })
          return
        }
        const ranked = await recommendEvents(me, events)
        if (!cancelled) setState({ status: 'ready', me, events: ranked.events, source: ranked.source, error: '' })
      } catch (err) {
        if (!cancelled) setState({ status: 'error', me: null, events: [], source: null, error: err.message })
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [attempt, navigate])

  function retry() {
    setState((s) => ({ ...s, status: 'loading' }))
    setAttempt((n) => n + 1)
  }

  // The user's own interests first, then the rest.
  const tags = state.me
    ? [...state.me.interests, ...INTERESTS.filter((t) => !state.me.interests.includes(t))]
    : INTERESTS
  const visible = tag ? state.events.filter((e) => e.tags.includes(tag)) : state.events

  return (
    <>
      <Header title={state.me ? `Hi ${state.me.name}!` : 'Events for you'} />

      {state.status === 'loading' && <Loading label="Picking events for you…" />}

      {state.status === 'error' && <ErrorState message={state.error} onRetry={retry} />}

      {state.status === 'ready' && (
        <div className="flex flex-col gap-4">
          <p className="text-text-main/75">Learning events in Barcelona. Join one and you won't be going alone.</p>

          {state.events.length > 0 && (
            <div
              role="group"
              aria-label="Filter by topic"
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
            >
              <Chip selected={!tag} onClick={() => setTag(null)}>
                All
              </Chip>
              {tags.map((t) => (
                <Chip key={t} selected={tag === t} onClick={() => setTag(tag === t ? null : t)}>
                  {t}
                </Chip>
              ))}
            </div>
          )}

          {state.source === 'ai' && visible.length > 0 && !tag && (
            <p className="flex items-center gap-1.5 text-sm text-accent-gold">
              <Sparkles size={15} />
              Ordered for you by AI, based on your interests and area
            </p>
          )}

          {state.events.length === 0 ? (
            <EmptyState
              icon={CalendarPlus}
              title="No upcoming events yet"
              message="Be the first: publish a talk or workshop you'd like company for."
              action={<Button to="/events/new">Publish an event</Button>}
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={`No ${tag} events right now`}
              message="Try another topic, or publish one yourself."
              action={
                <Button variant="secondary" onClick={() => setTag(null)}>
                  Show all events
                </Button>
              }
            />
          ) : (
            visible.map((event) => <EventCard key={event.id} event={event} />)
          )}
        </div>
      )}
    </>
  )
}
