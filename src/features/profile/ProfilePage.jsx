import { CalendarDays, Check, Copy, KeyRound, LogOut, MapPin, RotateCcw, Share2, Ticket, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Chip from '../../components/ui/Chip.jsx'
import Header from '../../components/ui/Header.jsx'
import { EmptyState, ErrorState, Loading } from '../../components/ui/States.jsx'
import { createInvite, getMyProfile } from '../../lib/db.js'
import { formatEventDate } from '../../lib/format.js'
import { resetMockDb } from '../../lib/mockDb.js'
import { clearSession, getCurrentUser } from '../../lib/session.js'
import { hasSupabase } from '../../lib/supabase.js'

function Stat({ value, label }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-card py-3">
      <span className="text-2xl font-extrabold text-primary">{value}</span>
      <span className="text-xs text-text-main/70">{label}</span>
    </div>
  )
}

function InviteRow({ invite }) {
  const [copied, setCopied] = useState(false)
  const message = `Join me on I Don't Want to Go Alone, so we can go to talks and workshops together! My invite code: ${invite.code} ${window.location.origin}`

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ text: message })
        return
      }
      await navigator.clipboard.writeText(invite.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Share sheet dismissed or clipboard blocked: the code is on screen anyway.
    }
  }

  return (
    <li className="flex items-center gap-3 py-2">
      <span className="flex-1 font-mono font-bold tracking-wide select-all">{invite.code}</span>
      {invite.usedBy ? (
        <Link to={`/u/${invite.usedBy.id}`} className="text-sm text-accent-gold">
          Used by {invite.usedBy.name}
        </Link>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          icon={copied ? Check : typeof navigator.share === 'function' ? Share2 : Copy}
          onClick={share}
        >
          {copied ? 'Copied' : typeof navigator.share === 'function' ? 'Share' : 'Copy'}
        </Button>
      )}
    </li>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [creating, setCreating] = useState(false)
  const [inviteError, setInviteError] = useState('')

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
      await createInvite(state.me)
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
        <Header title="My profile" />
        <Loading label="Loading your profile…" />
      </>
    )
  }

  if (state.status === 'error') {
    return (
      <>
        <Header title="My profile" />
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

  const { me, friends, invites, invitedCount, going } = state

  return (
    <>
      <Header title="My profile" />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Avatar name={me.name} size="lg" />
          <h2 className="text-2xl font-extrabold">{me.name}</h2>
          {me.role && <p className="text-text-main/75">{me.role}</p>}
          {me.area && (
            <p className="flex items-center gap-1 text-sm text-text-main/60">
              <MapPin size={14} /> {me.area}
            </p>
          )}
          <div className="mt-1 flex flex-wrap justify-center gap-1.5">
            {me.interests.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat value={going.length} label="Going to" />
          <Stat value={friends.length} label="Network" />
          <Stat value={invitedCount} label="Invited" />
        </div>

        <Card className="flex flex-col gap-3">
          <h3 className="flex items-center gap-2 font-bold">
            <KeyRound size={18} className="text-accent-gold" /> Invite a friend
          </h3>
          <p className="text-sm text-text-main/70">
            Every member is vouched for by someone. Only invite women you know. Each code works once, and you'll be
            connected automatically.
          </p>
          {invites.length > 0 && (
            <ul className="divide-y divide-white/10">
              {invites.map((invite) => (
                <InviteRow key={invite.code} invite={invite} />
              ))}
            </ul>
          )}
          {inviteError && <p className="text-sm text-primary">{inviteError}</p>}
          <Button variant="secondary" icon={Ticket} loading={creating} onClick={newInvite}>
            Create invite code
          </Button>
        </Card>

        <section className="flex flex-col gap-3">
          <h3 className="font-bold">My upcoming events</h3>
          {going.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No plans yet"
              message="Join an event and you won't be going alone."
              action={<Button to="/events">Browse events</Button>}
            />
          ) : (
            going.map((e) => (
              <Card key={e.id} to={`/events/${e.id}`} className="flex flex-col gap-1">
                <p className="font-semibold">{e.title}</p>
                <p className="text-sm text-text-main/70">{formatEventDate(e.starts_at)}</p>
              </Card>
            ))
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="font-bold">My network</h3>
          {friends.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No connections yet"
              message="Invite a friend, or add women you meet from their profile."
            />
          ) : (
            friends.map((friend) => (
              <Card key={friend.id} to={`/u/${friend.id}`} className="flex items-center gap-3">
                <Avatar name={friend.name} />
                <div>
                  <p className="font-semibold">{friend.name}</p>
                  {friend.role && <p className="text-sm text-text-main/70">{friend.role}</p>}
                </div>
              </Card>
            ))
          )}
        </section>

        <div className="flex flex-col gap-2 border-t border-white/10 pt-6">
          <Button full variant="ghost" icon={LogOut} onClick={signOut}>
            Sign out
          </Button>
          {!hasSupabase && (
            <Button full variant="ghost" icon={RotateCcw} onClick={resetDemo}>
              Reset demo data
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
