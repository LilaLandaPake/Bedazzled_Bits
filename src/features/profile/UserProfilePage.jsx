import { BadgeCheck, Ban, CheckCircle2, Flag, MapPin, UserCheck, UserPlus, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Chip from '../../components/ui/Chip.jsx'
import Header from '../../components/ui/Header.jsx'
import { EmptyState, ErrorState, Loading } from '../../components/ui/States.jsx'
import { blockUser, connectWith, getMember, unblockUser } from '../../lib/db.js'
import { clearSession, getCurrentUser } from '../../lib/session.js'
import ReportForm from '../safety/ReportForm.jsx'

// Keyed by id so moving between profiles starts from a clean state.
export default function UserProfilePage() {
  const { id } = useParams()
  return <MemberProfile key={id} id={id} />
}

function MemberProfile({ id }) {
  const navigate = useNavigate()
  const me = getCurrentUser()
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState('')
  const [actionError, setActionError] = useState('')
  const [view, setView] = useState('profile') // 'profile' | 'report' | 'reported'

  useEffect(() => {
    if (id === me) return
    let cancelled = false
    getMember(me, id)
      .then((data) => {
        if (cancelled) return
        if (!data.me) {
          clearSession()
          navigate('/', { replace: true })
          return
        }
        setState(data.member ? { status: 'ready', ...data } : { status: 'missing' })
      })
      .catch((err) => !cancelled && setState({ status: 'error', error: err.message }))
    return () => {
      cancelled = true
    }
  }, [id, me, attempt, navigate])

  if (id === me) return <Navigate to="/profile" replace />

  async function run(kind, action) {
    setBusy(kind)
    setActionError('')
    try {
      await action()
      setAttempt((n) => n + 1)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy('')
    }
  }

  const header = <Header title={state.member?.name ?? 'Member'} back="/events" />

  if (state.status === 'loading') {
    return (
      <>
        {header}
        <Loading label="Loading profile…" />
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
          icon={UserX}
          title="Profile not available"
          message="This member doesn't exist or isn't available to you."
          action={<Button to="/events">Back to events</Button>}
        />
      </>
    )
  }

  const { member, voucher, isConnected, iBlocked } = state

  if (view === 'report') {
    return (
      <>
        <Header title={`Report ${member.name}`} onBack={() => setView('profile')} />
        <ReportForm reporterId={me} member={member} onDone={() => setView('reported')} />
      </>
    )
  }

  return (
    <>
      {header}

      {view === 'reported' && (
        <p role="status" className="mb-4 flex gap-2 rounded-2xl bg-accent-purple/15 px-4 py-3 text-sm text-accent-purple">
          <CheckCircle2 size={18} className="shrink-0" />
          Thanks. Your report was sent and will be reviewed. {member.name} won't be told who reported her.
        </p>
      )}

      {iBlocked ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Avatar name={member.name} size="lg" className="opacity-50" />
          <h2 className="text-xl font-bold">You blocked {member.name}</h2>
          <p className="text-sm text-text-main/70">
            You won't see each other's profile or messages. She isn't notified.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Avatar name={member.name} size="lg" />
            <h2 className="text-2xl font-extrabold">{member.name}</h2>
            {member.role && <p className="text-text-main/75">{member.role}</p>}
            {member.area && (
              <p className="flex items-center gap-1 text-sm text-text-main/60">
                <MapPin size={14} /> {member.area}
              </p>
            )}
          </div>

          <Card className="flex items-center gap-3">
            <BadgeCheck size={22} className="shrink-0 text-accent-gold" />
            <p className="text-sm">
              {voucher ? (
                <>
                  Vouched for by{' '}
                  {voucher.id === me ? (
                    <span className="font-semibold">you</span>
                  ) : (
                    <Link to={`/u/${voucher.id}`} className="font-semibold text-accent-gold underline-offset-2 hover:underline">
                      {voucher.name}
                    </Link>
                  )}
                </>
              ) : (
                'Founding member of the community'
              )}
            </p>
          </Card>

          {member.interests?.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-text-main/70">Interests</h3>
              <div className="flex flex-wrap gap-1.5">
                {member.interests.map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
              </div>
            </div>
          )}

          {isConnected ? (
            <p className="flex items-center justify-center gap-2 font-semibold text-accent-gold">
              <UserCheck size={18} /> In your network
            </p>
          ) : (
            <Button
              full
              icon={UserPlus}
              loading={busy === 'connect'}
              onClick={() => run('connect', () => connectWith(me, member.id))}
            >
              Add to my network
            </Button>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6">
        <h3 className="text-sm font-semibold text-text-main/70">Safety</h3>
        {actionError && (
          <p role="alert" className="text-sm text-primary">
            {actionError}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {iBlocked ? (
            <Button
              variant="secondary"
              loading={busy === 'block'}
              onClick={() => run('block', () => unblockUser(me, member.id))}
            >
              Unblock
            </Button>
          ) : (
            <Button
              variant="danger"
              icon={Ban}
              loading={busy === 'block'}
              onClick={() => run('block', () => blockUser(me, member.id))}
            >
              Block
            </Button>
          )}
          <Button variant="danger" icon={Flag} onClick={() => setView('report')} disabled={view === 'reported'}>
            Report
          </Button>
        </div>
        <p className="text-xs text-text-main/50">
          Blocking is instant and private. Reports are reviewed by the team; nothing happens automatically.
        </p>
      </div>
    </>
  )
}
