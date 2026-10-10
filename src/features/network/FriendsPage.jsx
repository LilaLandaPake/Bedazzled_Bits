import { MessageSquare, SearchX, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Button from '../../components/ui/Button.jsx'
import PageTitle from '../../components/ui/PageTitle.jsx'
import { EmptyState, ErrorState, Loading } from '../../components/ui/States.jsx'
import { createInvite, getFriendsOverview } from '../../lib/db.js'
import { clearSession, getCurrentUser } from '../../lib/session.js'
import InviteSheet from './InviteSheet.jsx'

// Accent-insensitive, so "ines" finds Inés.
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function FriendsPage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [newCode, setNewCode] = useState(null)

  useEffect(() => {
    let cancelled = false
    getFriendsOverview(getCurrentUser())
      .then((data) => {
        if (cancelled) return
        if (!data.me) {
          clearSession()
          navigate('/', { replace: true })
          return
        }
        setState({ status: 'ready', ...data })
      })
      .catch((err) => !cancelled && setState({ status: 'error', error: err.message }))
    return () => {
      cancelled = true
    }
  }, [attempt, navigate])

  async function invite() {
    setInviting(true)
    setInviteError('')
    try {
      const code = await createInvite(state.me)
      setNewCode(code)
      setState((s) => ({ ...s, invitesLeft: Math.max(0, s.invitesLeft - 1) }))
    } catch (err) {
      setInviteError(err.message)
    } finally {
      setInviting(false)
    }
  }

  const title = <PageTitle eyebrow="People you met or vouched for" title="Friends" />

  if (state.status === 'loading') {
    return (
      <>
        {title}
        <Loading label="Loading your friends…" />
      </>
    )
  }

  if (state.status === 'error') {
    return (
      <>
        {title}
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

  const { friends, invitesLeft } = state
  const q = fold(query.trim())
  const visible = q ? friends.filter((f) => fold(f.name).includes(q)) : friends

  return (
    <>
      {title}

      <div className="flex flex-col gap-4">
        {friends.length > 0 && (
          <input
            type="search"
            aria-label="Search friends"
            placeholder="Search friends"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-14 w-full rounded-3xl border-2 border-line bg-surface px-6 text-lg text-ink outline-none placeholder:text-muted/70 focus:border-primary"
          />
        )}

        {friends.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No friends yet"
            message="Vouch for a friend below, or add women you meet from their profile."
          />
        ) : visible.length === 0 ? (
          <EmptyState icon={SearchX} title="No one with that name" message="Check the spelling, or clear the search." />
        ) : (
          <ul className="flex flex-col gap-3">
            {visible.map((f) => (
              <li key={f.id} className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-3 pr-4">
                <Link to={`/u/${f.id}`} className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl p-1 transition active:opacity-70">
                  <Avatar name={f.name} size="md" />
                  <span className="min-w-0">
                    <span className="block font-display text-xl font-bold">{f.name}</span>
                    <span className="line-clamp-2 text-muted">{f.line}</span>
                  </span>
                </Link>
                <Link
                  to={`/messages/${f.id}`}
                  aria-label={`Message ${f.name}`}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-line text-ink transition active:scale-90"
                >
                  <MessageSquare size={24} />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2 flex items-center gap-4 rounded-3xl bg-soft p-6 text-soft-ink">
          <div className="flex-1">
            <p className="font-display text-xl font-bold">Vouch for a friend</p>
            <p>
              {invitesLeft > 0
                ? `You have ${invitesLeft} ${invitesLeft === 1 ? 'invite' : 'invites'} left.`
                : "You've used all your invites."}
            </p>
            {inviteError && (
              <p role="alert" className="mt-1 font-bold text-primary">
                {inviteError}
              </p>
            )}
          </div>
          <Button size="lg" loading={inviting} disabled={invitesLeft === 0} onClick={invite}>
            Invite
          </Button>
        </div>
      </div>

      {newCode && <InviteSheet code={newCode} onClose={() => setNewCode(null)} />}
    </>
  )
}
