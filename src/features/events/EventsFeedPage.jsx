import { CalendarPlus, ListFilter, SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Button from '../../components/ui/Button.jsx'
import Chip from '../../components/ui/Chip.jsx'
import PageTitle from '../../components/ui/PageTitle.jsx'
import { EmptyState, ErrorState, Loading } from '../../components/ui/States.jsx'
import { getFeed } from '../../lib/db.js'
import { recommendEvents } from '../../lib/recommend.js'
import { clearSession, getCurrentUser } from '../../lib/session.js'
import EventCard from './EventCard.jsx'
import InterestSheet from './InterestSheet.jsx'

// The chosen filter survives going into an event and back. null = "my interests".
const FILTER_KEY = 'idwtga_feed_interests'

function loadFilter() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(FILTER_KEY))
    return Array.isArray(saved) ? saved : null
  } catch {
    return null
  }
}

function saveFilter(list) {
  try {
    sessionStorage.setItem(FILTER_KEY, JSON.stringify(list))
  } catch {
    // Filter just resets on the next visit.
  }
}

export default function EventsFeedPage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', me: null, events: [], error: '' })
  const [attempt, setAttempt] = useState(0)
  const [filter, setFilter] = useState(loadFilter)
  const [sheetOpen, setSheetOpen] = useState(false)

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
        if (!cancelled) setState({ status: 'ready', me, events: ranked.events, error: '' })
      } catch (err) {
        if (!cancelled) setState({ status: 'error', me: null, events: [], error: err.message })
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

  function applyFilter(list) {
    setFilter(list)
    saveFilter(list)
    setSheetOpen(false)
  }

  const selected = filter ?? state.me?.interests ?? []
  const visible = selected.length ? state.events.filter((e) => e.tags.some((t) => selected.includes(t))) : state.events

  return (
    <>
      <PageTitle
        eyebrow="Barcelona · Coming up"
        title="Explore events"
        right={
          state.me && (
            <Link to="/profile" aria-label="My profile" className="transition active:scale-95">
              <Avatar name={state.me.name} size="lg" color="bg-soft text-soft-ink" />
            </Link>
          )
        }
      />

      {state.status === 'loading' && <Loading label="Picking events for you…" />}

      {state.status === 'error' && <ErrorState message={state.error} onRetry={retry} />}

      {state.status === 'ready' && (
        <div className="flex flex-col gap-5">
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border-2 border-ink px-5 py-2.5 font-display font-bold transition active:scale-95"
            >
              <ListFilter size={20} />
              Interests{selected.length > 0 && ` · ${selected.length}`}
            </button>
            {selected.map((tag) => (
              <Chip
                key={tag}
                selected
                check={false}
                onClick={() => applyFilter(selected.filter((t) => t !== tag))}
                className="shrink-0 whitespace-nowrap"
              >
                {tag}
              </Chip>
            ))}
          </div>

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
              title="Nothing for these interests yet"
              message="Try other interests, or publish an event yourself."
              action={
                <Button variant="secondary" onClick={() => applyFilter([])}>
                  Show all events
                </Button>
              }
            />
          ) : (
            visible.map((event) => <EventCard key={event.id} event={event} />)
          )}

          {visible.length > 0 && (
            <div className="flex items-center gap-4 rounded-3xl bg-soft p-5 text-soft-ink">
              <p className="flex-1">
                <span className="block font-display text-lg font-bold">Know an event?</span>
                Publish it and find women to go with.
              </p>
              <Button to="/events/new" icon={CalendarPlus}>
                Publish
              </Button>
            </div>
          )}
        </div>
      )}

      {sheetOpen && <InterestSheet selected={selected} onApply={applyFilter} onClose={() => setSheetOpen(false)} />}
    </>
  )
}
