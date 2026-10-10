import { ChevronUp, MessageCircle, MessageSquare, Plus, User, UserPlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Button from '../../components/ui/Button.jsx'
import { Eyebrow } from '../../components/ui/PageTitle.jsx'
import ThemeToggle from '../../components/ui/ThemeToggle.jsx'
import { EmptyState, ErrorState, Loading } from '../../components/ui/States.jsx'
import { shortTag } from '../../lib/constants.js'
import { getNetworkActivity, joinEvent } from '../../lib/db.js'
import { eventFormat, formatEventDate, splitVenue, timeAgo } from '../../lib/format.js'
import { clearSession, getCurrentUser } from '../../lib/session.js'

const SWIPE_PX = 50

// "Lila is going to the React study session" / "Marta joined — you invited her".
function summary(item) {
  if (item.type === 'going') return `${item.friend.name} is going to ${item.event.title}`
  const how = item.relation === 'Vouched by you' ? 'you invited her' : item.relation.toLowerCase()
  return `${item.friend.name} joined — ${how}`
}

const withThe = (title) => (/^the\s/i.test(title) ? title : `the ${title}`)

export default function ForYouPage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [index, setIndex] = useState(0)
  const [joining, setJoining] = useState(false)
  const [actionError, setActionError] = useState('')
  const touchY = useRef(null)

  useEffect(() => {
    let cancelled = false
    getNetworkActivity(getCurrentUser())
      .then((data) => {
        if (cancelled) return
        if (!data.me) {
          clearSession()
          navigate('/', { replace: true })
          return
        }
        setState({ status: 'ready', items: data.items })
      })
      .catch((err) => !cancelled && setState({ status: 'error', error: err.message }))
    return () => {
      cancelled = true
    }
  }, [attempt, navigate])

  const items = state.items ?? []
  const item = items[index]
  const next = items[index + 1]

  function go(to) {
    setActionError('')
    setIndex(Math.max(0, Math.min(items.length - 1, to)))
  }

  async function joinHer() {
    setJoining(true)
    setActionError('')
    try {
      await joinEvent(item.event.id, getCurrentUser())
      const eventId = item.event.id
      setState((s) => ({
        ...s,
        items: s.items.map((i) => (i.type === 'going' && i.event.id === eventId ? { ...i, iAmGoing: true } : i)),
      }))
    } catch (err) {
      setActionError(err.message)
    } finally {
      setJoining(false)
    }
  }

  return (
    <>
      <header className="pt-[calc(env(safe-area-inset-top)+2rem)] pb-4">
        <div className="mb-1 flex items-center justify-between gap-3">
          {items.length > 0 ? (
            <Eyebrow>
              Your network · {index + 1} of {items.length}
            </Eyebrow>
          ) : (
            <span />
          )}
          <ThemeToggle small />
        </div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">For you</h1>
      </header>

      {state.status === 'loading' && <Loading label="Catching up with your network…" />}

      {state.status === 'error' && (
        <ErrorState
          message={state.error}
          onRetry={() => {
            setState({ status: 'loading' })
            setAttempt((n) => n + 1)
          }}
        />
      )}

      {state.status === 'ready' && !item && (
        <EmptyState
          icon={UserPlus}
          title="Your network is quiet"
          message="When friends join events or new members arrive, you'll see it here. Invite a friend to get started."
          action={<Button to="/friends">Vouch for a friend</Button>}
        />
      )}

      {item && (
        <div className="flex flex-col">
          <article
            key={item.id}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${items.length}: ${summary(item)}`}
            onTouchStart={(e) => (touchY.current = e.touches[0].clientY)}
            onTouchEnd={(e) => {
              if (touchY.current == null) return
              const dy = e.changedTouches[0].clientY - touchY.current
              touchY.current = null
              if (dy < -SWIPE_PX) go(index + 1)
              else if (dy > SWIPE_PX) go(index - 1)
            }}
            className="-mx-2 flex min-h-[calc(100dvh-17rem)] flex-col gap-5 rounded-[2.5rem] bg-feature p-6 text-feature-ink"
          >
            <div className="flex items-center gap-4">
              <Avatar name={item.friend.name} size="lg" color="bg-gold text-on-gold" />
              <div className="min-w-0">
                <p className="font-display text-xl font-bold">{item.friend.name}</p>
                <p className="text-feature-muted">
                  {item.relation} · {timeAgo(item.at)}
                </p>
              </div>
            </div>

            {item.type === 'going' ? (
              <div className="flex flex-col gap-4">
                <h2 className="font-display text-[2.4rem] leading-[1.05] font-extrabold tracking-tight">
                  {item.friend.name} is going to <span className="text-gold">{withThe(item.event.title)}.</span>
                </h2>
                <p className="text-lg text-feature-muted">
                  {item.iAmGoing
                    ? "You're going too. Say hi in the group chat."
                    : item.otherFriends > 0
                      ? `${item.otherFriends} more ${item.otherFriends === 1 ? 'friend is' : 'friends are'} going. Go together?`
                      : 'Go together?'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <h2 className="font-display text-[2.4rem] leading-[1.05] font-extrabold tracking-tight">
                  {item.friend.name} <span className="text-gold">joined the community.</span>
                </h2>
                <p className="text-lg text-feature-muted">
                  {item.relation === 'Vouched by you' ? 'You vouched for her. ' : ''}Say hi and find something to go to
                  together.
                </p>
              </div>
            )}

            <div className="mt-auto flex items-end gap-4">
              <div className="min-w-0 flex-1">
                {item.type === 'going' ? (
                  <Link
                    to={`/events/${item.event.id}`}
                    className="block rounded-3xl border-2 border-feature-line p-5 transition active:scale-[0.98]"
                  >
                    <p className="font-display text-sm font-bold tracking-[0.12em] text-feature-muted uppercase">
                      {[item.event.tags[0] && shortTag(item.event.tags[0]), eventFormat(item.event)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <p className="mt-1 font-display text-lg leading-snug font-bold">{item.event.title}</p>
                    <p className="mt-1 text-feature-muted">
                      {formatEventDate(item.event.starts_at)} · {splitVenue(item.event.venue).name}
                    </p>
                  </Link>
                ) : (
                  item.friend.interests.length > 0 && (
                    <div className="rounded-3xl border-2 border-feature-line p-5">
                      <p className="font-display text-sm font-bold tracking-[0.12em] text-feature-muted uppercase">
                        Interested in
                      </p>
                      <p className="mt-1 font-display text-lg leading-snug font-bold">
                        {item.friend.interests.slice(0, 3).map(shortTag).join(' · ')}
                      </p>
                    </div>
                  )
                )}
              </div>

              <div className="flex shrink-0 flex-col items-center gap-3">
                {item.type === 'going' &&
                  (item.iAmGoing ? (
                    <Action to={`/events/${item.event.id}/chat`} icon={MessageCircle} label="Group chat" gold />
                  ) : (
                    <Action onClick={joinHer} icon={Plus} label="Join her" gold busy={joining} />
                  ))}
                <Action to={`/messages/${item.friend.id}`} icon={MessageSquare} label="Message" />
                <Action to={`/u/${item.friend.id}`} icon={User} label="Profile" />
              </div>
            </div>

            {actionError && (
              <p role="alert" className="font-bold text-gold">
                {actionError}
              </p>
            )}
          </article>

          <button
            type="button"
            onClick={() => go(next ? index + 1 : 0)}
            className="-mx-2 mt-3 flex items-center gap-3 rounded-[2.5rem] bg-accent px-6 py-5 text-left font-display text-lg font-bold text-on-accent transition active:scale-[0.99]"
          >
            <ChevronUp size={22} className="shrink-0" />
            <span className="truncate">{next ? `Next: ${summary(next)}` : "You're all caught up · start again"}</span>
          </button>
        </div>
      )}
    </>
  )
}

// Round action on the right of the card, with its label underneath.
function Action({ to, onClick, icon: Icon, label, gold = false, busy = false }) {
  const circle = `flex h-14 w-14 items-center justify-center rounded-full transition active:scale-90 ${
    gold ? 'bg-gold text-on-gold' : 'border-2 border-feature-line text-feature-ink'
  } ${busy ? 'opacity-60' : ''}`
  const content = (
    <>
      <span className={circle}>
        <Icon size={gold ? 28 : 24} />
      </span>
      <span className="font-display text-sm font-bold">{label}</span>
    </>
  )
  const classes = 'flex flex-col items-center gap-1'
  return to ? (
    <Link to={to} className={classes}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={busy} className={classes}>
      {content}
    </button>
  )
}
