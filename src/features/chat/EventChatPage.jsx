import { AlertTriangle, Lock, MessageCircle, RotateCcw, SearchX, SendHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Button from '../../components/ui/Button.jsx'
import Header from '../../components/ui/Header.jsx'
import Input from '../../components/ui/Input.jsx'
import { EmptyState, ErrorState, Loading } from '../../components/ui/States.jsx'
import { categoryLabel } from '../../lib/constants.js'
import { flagMessage, getChat, getUser, sendMessage, subscribeToChat } from '../../lib/db.js'
import { formatMessageTime } from '../../lib/format.js'
import { checkMessage } from '../../lib/moderate.js'
import { clearSession, getCurrentUser } from '../../lib/session.js'
import { uuid } from '../../lib/uuid.js'

const byTime = (a, b) => new Date(a.created_at) - new Date(b.created_at)

// Insert or replace by id, keeping chronological order.
function upsert(list, message) {
  const i = list.findIndex((m) => m.id === message.id)
  if (i === -1) return [...list, message].sort(byTime)
  const next = [...list]
  next[i] = { ...next[i], ...message }
  return next
}

export default function EventChatPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const me = getCurrentUser()
  const [state, setState] = useState({ status: 'loading', error: '' })
  const [messages, setMessages] = useState([])
  const [people, setPeople] = useState({})
  const [attempt, setAttempt] = useState(0)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef(null)
  const blockedRef = useRef(new Set())
  const lookedUpRef = useRef(new Set())

  // Load the chat, then listen for new and updated messages.
  useEffect(() => {
    let cancelled = false
    let unsubscribe = () => {}
    getChat(id, me)
      .then((chat) => {
        if (cancelled) return
        if (!chat.me) {
          clearSession()
          navigate('/', { replace: true })
          return
        }
        if (!chat.event) return setState({ status: 'missing' })
        if (!chat.isGoing) return setState({ status: 'locked', event: chat.event })

        blockedRef.current = chat.blocked
        setPeople(chat.people)
        setMessages(chat.messages)
        setState({ status: 'ready', event: chat.event })
        unsubscribe = subscribeToChat(id, (message) => {
          if (blockedRef.current.has(message.user_id)) return
          setMessages((list) => upsert(list, message))
        })
      })
      .catch((err) => !cancelled && setState({ status: 'error', error: err.message }))
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [id, me, attempt, navigate])

  // Someone who joined after the chat loaded: look up her name.
  useEffect(() => {
    const unknown = [...new Set(messages.map((m) => m.user_id))].filter(
      (uid) => !people[uid] && !lookedUpRef.current.has(uid),
    )
    unknown.forEach((uid) => lookedUpRef.current.add(uid))
    unknown.forEach((uid) =>
      getUser(uid)
        .then((u) => u && setPeople((p) => ({ ...p, [uid]: { name: u.name } })))
        .catch(() => {}),
    )
  }, [messages, people])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  async function send(text, retryOf) {
    const tempId = `local-${uuid()}`
    const recent = messages.filter((m) => !m._local).slice(-5).map((m) => m.text)
    setMessages((list) => [
      ...list.filter((m) => m.id !== retryOf),
      { id: tempId, user_id: me, text, created_at: new Date().toISOString(), _local: 'sending' },
    ])

    let saved
    try {
      saved = await sendMessage(id, me, text)
      setMessages((list) => upsert(list.filter((m) => m.id !== tempId), saved))
    } catch {
      setMessages((list) => list.map((m) => (m.id === tempId ? { ...m, _local: 'failed' } : m)))
      return
    }

    // Saved first, moderated after: a failed or slow check leaves the message as it is.
    const flag = await checkMessage(text, recent)
    if (!flag) return
    try {
      const updated = await flagMessage(saved, flag)
      setMessages((list) => upsert(list, updated))
    } catch {
      // Not flagged this time; nothing else to do.
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setDraft('')
    send(text)
  }

  const header = <Header title={state.event?.title ?? 'Event chat'} back={`/events/${id}`} />

  if (state.status === 'loading') {
    return (
      <>
        {header}
        <Loading label="Loading chat…" />
      </>
    )
  }

  if (state.status === 'error') {
    return (
      <>
        {header}
        <ErrorState
          message={state.error}
          onRetry={() => {
            setState({ status: 'loading' })
            setAttempt((n) => n + 1)
          }}
        />
      </>
    )
  }

  if (state.status === 'missing') {
    return (
      <>
        {header}
        <EmptyState
          icon={SearchX}
          title="Event not found"
          message="This chat doesn't exist."
          action={<Button to="/events">See all events</Button>}
        />
      </>
    )
  }

  if (state.status === 'locked') {
    return (
      <>
        {header}
        <EmptyState
          icon={Lock}
          title="Join the event to chat"
          message="The chat is only for the women who are going."
          action={<Button to={`/events/${id}`}>Go to the event</Button>}
        />
      </>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      {header}

      <p className="mb-4 rounded-2xl bg-card px-4 py-3 text-sm text-text-main/75">
        Only women going to this event can read this chat. Messages are checked by AI for risky requests, like
        meeting somewhere private.
      </p>

      <ol className="flex flex-1 flex-col gap-3" aria-live="polite">
        {messages.length === 0 && (
          <li>
            <EmptyState
              icon={MessageCircle}
              title="No messages yet"
              message="Say hi and agree where to meet, for example at the entrance."
            />
          </li>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            mine={m.user_id === me}
            name={people[m.user_id]?.name ?? 'Member'}
            onRetry={() => send(m.text, m.id)}
          />
        ))}
      </ol>
      <div ref={bottomRef} />

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 -mx-4 mt-4 flex items-end gap-2 bg-main/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur"
      >
        <Input
          aria-label="Message"
          placeholder="Write a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={1000}
          autoComplete="off"
          enterKeyHint="send"
          className="flex-1"
        />
        <Button type="submit" aria-label="Send" size="icon" icon={SendHorizontal} disabled={!draft.trim()} />
      </form>
    </div>
  )
}

function MessageBubble({ message: m, mine, name, onRetry }) {
  const showWarning = m.flagged && !mine

  return (
    <li className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
      {!mine && (
        <Link to={`/u/${m.user_id}`} aria-label={`${name}'s profile`} className="mt-5">
          <Avatar name={name} size="sm" />
        </Link>
      )}
      <div className={`flex max-w-[80%] flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
        <p className="px-1 text-xs text-text-main/50">
          {mine ? 'You' : name} · {m._local === 'sending' ? 'Sending…' : formatMessageTime(m.created_at)}
        </p>

        {showWarning && (
          <div role="note" className="flex gap-2 rounded-2xl bg-accent-gold/15 px-3 py-2 text-sm text-accent-gold">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Safety note: {categoryLabel(m.flag_category)}</p>
              {m.flag_reason && <p className="text-text-main/80">{m.flag_reason}</p>}
              <p className="mt-1 text-text-main/70">
                Keep plans in this chat and meet at the event.{' '}
                <Link to={`/u/${m.user_id}`} className="font-semibold text-accent-gold underline underline-offset-2">
                  Block or report {name}
                </Link>
              </p>
            </div>
          </div>
        )}

        <p
          className={`rounded-2xl px-4 py-2 break-words whitespace-pre-line ${
            mine ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md bg-card'
          } ${m._local ? 'opacity-70' : ''} ${showWarning ? 'ring-1 ring-accent-gold/50' : ''}`}
        >
          {m.text}
        </p>

        {m._local === 'failed' && (
          <button type="button" onClick={onRetry} className="flex items-center gap-1 px-1 text-xs font-semibold text-primary">
            <RotateCcw size={12} /> Not sent. Tap to retry
          </button>
        )}
        {mine && m.flagged && (
          <p className="px-1 text-xs text-accent-gold">Others see a safety note on this message.</p>
        )}
      </div>
    </li>
  )
}
