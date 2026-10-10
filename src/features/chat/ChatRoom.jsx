import { AlertTriangle, Ban, MessageCircle, RotateCcw, Send, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Header from '../../components/ui/Header.jsx'
import { Eyebrow } from '../../components/ui/PageTitle.jsx'
import { EmptyState } from '../../components/ui/States.jsx'
import { blockUser, getUser, unblockUser } from '../../lib/db.js'
import { formatMessageTime } from '../../lib/format.js'
import { checkMessage } from '../../lib/moderate.js'
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

// The chat itself, shared by the event group chat and 1:1 messages. Mounted once the page
// has loaded the conversation. `subscribe(onMessage)` returns an unsubscribe function,
// `send(text)` saves and returns the message, `flag(message, { category, reason })` marks it.
export default function ChatRoom({
  me,
  title,
  subtitle,
  back,
  placeholder,
  emptyMessage,
  initialMessages,
  initialPeople,
  blocked,
  subscribe,
  send: save,
  flag,
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [people, setPeople] = useState(initialPeople)
  const [draft, setDraft] = useState('')
  const [justBlocked, setJustBlocked] = useState(null) // { id, name }
  const [blockError, setBlockError] = useState('')
  const bottomRef = useRef(null)
  const blockedRef = useRef(new Set(blocked))
  const lookedUpRef = useRef(new Set())
  // The page mounts the room once per conversation (keyed), so subscribe once.
  const subscribeRef = useRef(subscribe)

  // Listen for new and updated messages for as long as the room is open.
  useEffect(
    () =>
      subscribeRef.current((message) => {
        if (blockedRef.current.has(message.user_id)) return
        setMessages((list) => upsert(list, message))
      }),
    [],
  )

  // Someone who joined after the chat loaded: look up her name.
  useEffect(() => {
    const unknown = [...new Set(messages.map((m) => m.user_id))].filter(
      (uid) => uid !== me && !people[uid] && !lookedUpRef.current.has(uid),
    )
    unknown.forEach((uid) => lookedUpRef.current.add(uid))
    unknown.forEach((uid) =>
      getUser(uid)
        .then((u) => u && setPeople((p) => ({ ...p, [uid]: { name: u.name } })))
        .catch(() => {}),
    )
  }, [messages, people, me])

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
      saved = await save(text)
      setMessages((list) => upsert(list.filter((m) => m.id !== tempId), saved))
    } catch {
      setMessages((list) => list.map((m) => (m.id === tempId ? { ...m, _local: 'failed' } : m)))
      return
    }

    // Saved first, moderated after: a failed or slow check leaves the message as it is.
    const result = await checkMessage(text, recent)
    if (!result) return
    try {
      const updated = await flag(saved, result)
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

  // Instant, no reason asked. Her messages disappear from this chat.
  async function block(userId) {
    setBlockError('')
    try {
      await blockUser(me, userId)
      blockedRef.current.add(userId)
      setMessages((list) => list.filter((m) => m.user_id !== userId))
      setJustBlocked({ id: userId, name: people[userId]?.name ?? 'This member' })
    } catch (err) {
      setBlockError(err.message)
    }
  }

  async function undoBlock() {
    setBlockError('')
    try {
      await unblockUser(me, justBlocked.id)
      blockedRef.current.delete(justBlocked.id)
      setJustBlocked(null)
    } catch (err) {
      setBlockError(err.message)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={title} subtitle={subtitle} back={back} bordered />

      <p className="mx-auto mb-5 flex items-center gap-2 rounded-2xl bg-soft px-5 py-3 text-center text-soft-ink">
        <ShieldCheck size={20} className="shrink-0" />
        Everyone here is a vouched member.
      </p>

      {justBlocked && (
        <div role="status" className="mb-4 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
          <Ban size={20} className="shrink-0 text-primary" />
          <p className="flex-1">
            You blocked {justBlocked.name}. You won't see each other's messages.
          </p>
          <Button variant="link" onClick={undoBlock}>
            Undo
          </Button>
        </div>
      )}
      {blockError && (
        <p role="alert" className="mb-4 text-center font-bold text-primary">
          {blockError}
        </p>
      )}

      <ol className="-mx-1 flex flex-1 flex-col gap-5" aria-live="polite">
        {messages.length === 0 && (
          <li>
            <EmptyState icon={MessageCircle} title="No messages yet" message={emptyMessage} />
          </li>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            mine={m.user_id === me}
            name={people[m.user_id]?.name ?? 'Member'}
            onRetry={() => send(m.text, m.id)}
            onBlock={() => block(m.user_id)}
          />
        ))}
      </ol>
      <div ref={bottomRef} />

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 -mx-4 mt-4 flex items-center gap-3 border-t border-line bg-bg/95 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur"
      >
        <input
          aria-label="Message"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={1000}
          autoComplete="off"
          enterKeyHint="send"
          className="h-14 min-w-0 flex-1 rounded-full border-2 border-line bg-surface px-6 text-lg text-ink outline-none placeholder:text-muted/70 focus:border-primary"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!draft.trim()}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition active:scale-90 disabled:opacity-50"
        >
          <Send size={24} />
        </button>
      </form>
    </div>
  )
}

function MessageBubble({ message: m, mine, name, onRetry, onBlock }) {
  const time = m._local === 'sending' ? 'Sending…' : formatMessageTime(m.created_at)

  if (mine) {
    return (
      <li className="flex flex-col items-end gap-1">
        <p
          title={time}
          className={`max-w-[80%] rounded-2xl rounded-tr-md bg-primary px-5 py-3 text-lg break-words whitespace-pre-line text-on-primary ${
            m._local ? 'opacity-70' : ''
          }`}
        >
          {m.text}
        </p>
        {m._local === 'failed' ? (
          <button type="button" onClick={onRetry} className="flex items-center gap-1 px-1 text-sm font-bold text-primary">
            <RotateCcw size={14} /> Not sent. Tap to retry
          </button>
        ) : (
          <p className="px-1 text-xs text-muted">{time}</p>
        )}
        {m.flagged && <p className="px-1 text-sm text-muted">Others see a safety note on this message.</p>}
      </li>
    )
  }

  return (
    <li className="flex flex-col items-start gap-1.5">
      <Link to={`/u/${m.user_id}`} className="px-1">
        <Eyebrow as="span" className="text-xs">
          {name}
        </Eyebrow>
      </Link>

      {m.flagged ? (
        <div className="max-w-[85%] overflow-hidden rounded-3xl border-2 border-gold bg-surface">
          <p role="note" className="flex gap-3 bg-gold px-5 py-3 text-on-gold">
            <AlertTriangle size={22} className="mt-0.5 shrink-0" />
            <span>
              <span className="font-bold">Heads up.</span> {m.flag_reason || 'This message may not be safe.'}
            </span>
          </p>
          <p title={time} className="px-5 py-3 text-lg break-words whitespace-pre-line">
            {m.text}
          </p>
        </div>
      ) : (
        <p
          title={time}
          className="max-w-[80%] rounded-3xl rounded-tl-md border border-line bg-surface px-5 py-3 text-lg break-words whitespace-pre-line"
        >
          {m.text}
        </p>
      )}

      {m.flagged ? (
        <p className="flex gap-6 px-1">
          <Link
            to={`/u/${m.user_id}/report`}
            className="font-display text-lg font-bold underline decoration-2 underline-offset-4"
          >
            Report
          </Link>
          <button type="button" onClick={onBlock} className="font-display text-lg font-bold underline decoration-2 underline-offset-4">
            Block
          </button>
        </p>
      ) : (
        <p className="px-1 text-xs text-muted">{time}</p>
      )}
    </li>
  )
}
