import { CalendarDays, CalendarPlus, ChevronRight, LogOut, RotateCcw, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import { Tag } from '../../components/ui/Chip.jsx'
import PageTitle, { Eyebrow } from '../../components/ui/PageTitle.jsx'
import { EmptyState, ErrorState, Loading } from '../../components/ui/States.jsx'
import { shortTag } from '../../lib/constants.js'
import { createInvite, getMyProfile } from '../../lib/db.js'
import { formatEventDate } from '../../lib/format.js'
import { resetMockDb } from '../../lib/mockDb.js'
import { clearSession, getCurrentUser } from '../../lib/session.js'
import { hasSupabase } from '../../lib/supabase.js'
import InviteSheet from '../network/InviteSheet.jsx'

function Stat({ value, label, to }) {
  return (
    <Link to={to} className="flex flex-col items-center rounded-3xl border border-line bg-surface py-4 transition active:scale-95">
      <span className="font-display text-3xl font-extrabold text-primary">{value}</span>
      <span className="text-sm text-muted">{label}</span>
    </Link>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [creating, setCreating] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [newCode, setNewCode] = useState(null)

  useEffect(() => {
    let cancelled = false
    getMyProfile(getCurrentUser())
      .then((data) => {
        if (cancelled) return
        if (!data.me) {
          // Stored id no longer exists (e.g. data was reset): start over.
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

  async function newInvite() {
    setCreating(true)
    setInviteError('')
    try {
      setNewCode(await createInvite(state.me))
      setAttempt((n) => n + 1)
    } catch (err) {
      setInviteError(err.message)
    } finally {
      setCreating(false)
    }
  }

  function signOut() {
    clearSession()
    navigate('/', { replace: true })
  }

  function resetDemo() {
    resetMockDb()
    clearSession()
    window.location.assign('/')
  }

  if (state.status === 'loading') {
    return (
      <>
        <PageTitle eyebrow="Your profile" title="Profile" />
        <Loading label="Loading your profile…" />
      </>
    )
  }

  if (state.status === 'error') {
    return (
      <>
        <PageTitle eyebrow="Your profile" title="Profile" />
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

  const { me, friends, invites, invitedCount, invitesLeft, going } = state

  return (
    <>
      <PageTitle
        eyebrow={me.area ? `Your profile · ${me.area}` : 'Your profile'}
        title={me.name}
        right={<Avatar name={me.name} size="lg" />}
      />

      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          {me.role && <p className="text-lg">{me.role}</p>}
          <div className="flex flex-wrap gap-2">
            {me.interests.map((t) => (
              <Tag key={t}>{shortTag(t)}</Tag>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat value={going.length} label="Going to" to="/events" />
          <Stat value={friends.length} label="Friends" to="/friends" />
          <Stat value={invitedCount} label="Vouched" to="/friends" />
        </div>

        <section className="flex flex-col gap-3">
          <Eyebrow as="h2">My upcoming events</Eyebrow>
          {going.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No plans yet"
              message="Join an event and you won't be going alone."
              action={<Button to="/events">Explore events</Button>}
            />
          ) : (
            going.map((e) => (
              <Card key={e.id} to={`/events/${e.id}`} className="flex items-center gap-3 p-4!">
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-bold">{e.title}</span>
                  <span className="block text-muted">{formatEventDate(e.starts_at)}</span>
                </span>
                <ChevronRight size={22} className="shrink-0 text-muted" />
              </Card>
            ))
          )}
          <Button variant="secondary" icon={CalendarPlus} to="/events/new" className="self-start">
            Publish an event
          </Button>
        </section>

        <section className="flex flex-col gap-3 rounded-3xl bg-soft p-6 text-soft-ink">
          <h2 className="font-display text-xl font-bold">Your invite codes</h2>
          <p>
            Every member is vouched for by someone. Each code works once.{' '}
            {invitesLeft > 0
              ? `You have ${invitesLeft} ${invitesLeft === 1 ? 'invite' : 'invites'} left.`
              : "You've used all your invites."}
          </p>
          {invites.length > 0 && (
            <ul className="flex flex-col divide-y divide-line">
              {invites.map((invite) => (
                <li key={invite.code} className="flex items-center gap-3 py-2.5">
                  <span className="flex-1 font-mono font-bold tracking-wider select-all">{invite.code}</span>
                  {invite.usedBy ? (
                    <Link to={`/u/${invite.usedBy.id}`} className="font-bold underline underline-offset-2">
                      Used by {invite.usedBy.name}
                    </Link>
                  ) : (
                    <Button variant="link" onClick={() => setNewCode(invite.code)}>
                      Share
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {inviteError && <p className="font-bold text-primary">{inviteError}</p>}
          <Button loading={creating} disabled={invitesLeft === 0} onClick={newInvite} className="self-start">
            Create invite code
          </Button>
        </section>

        <Button variant="secondary" icon={Users} to="/friends">
          See your friends
        </Button>

        <div className="flex flex-col items-center gap-2 border-t border-line pt-6">
          <Button variant="link" icon={LogOut} onClick={signOut}>
            Sign out
          </Button>
          {!hasSupabase && (
            <Button variant="link" icon={RotateCcw} onClick={resetDemo}>
              Reset demo data
            </Button>
          )}
        </div>
      </div>

      {newCode && <InviteSheet code={newCode} onClose={() => setNewCode(null)} />}
    </>
  )
}
