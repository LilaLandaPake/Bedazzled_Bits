import { BadgeCheck, Ban, Flag, MapPin, MessageSquare, UserCheck, UserPlus, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Button from '../../components/ui/Button.jsx'
import { Tag } from '../../components/ui/Chip.jsx'
import Header from '../../components/ui/Header.jsx'
import { Eyebrow } from '../../components/ui/PageTitle.jsx'
import { EmptyState, ErrorState, Loading } from '../../components/ui/States.jsx'
import { shortTag } from '../../lib/constants.js'
import { blockUser, connectWith, getMember, unblockUser } from '../../lib/db.js'
import { clearSession, getCurrentUser } from '../../lib/session.js'

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

  const header = <Header back="/friends" />

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

  return (
    <>
      {header}

      {iBlocked ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Avatar name={member.name} size="xl" className="opacity-50" />
          <h1 className="font-display text-3xl font-extrabold">You blocked {member.name}</h1>
          <p className="text-muted">You won't see each other's profile or messages. She isn't notified.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-5">
            <Avatar name={member.name} size="xl" />
            <div className="min-w-0">
              <h1 className="font-display text-4xl leading-tight font-extrabold tracking-tight">{member.name}</h1>
              {member.role && <p className="text-lg">{member.role}</p>}
              {member.area && (
                <p className="flex items-center gap-1.5 text-muted">
                  <MapPin size={16} /> {member.area}
                </p>
              )}
            </div>
          </div>

          <p className="flex items-center gap-3 rounded-2xl bg-soft px-5 py-4 text-soft-ink">
            <BadgeCheck size={22} className="shrink-0" />
            <span>
              {voucher ? (
                <>
                  Vouched for by{' '}
                  {voucher.id === me ? (
                    <span className="font-bold">you</span>
                  ) : (
                    <Link to={`/u/${voucher.id}`} className="font-bold underline underline-offset-2">
                      {voucher.name}
                    </Link>
                  )}
                </>
              ) : (
                'Founding member of the community'
              )}
            </span>
          </p>

          {member.interests?.length > 0 && (
            <section className="flex flex-col gap-3">
              <Eyebrow as="h2">Interests</Eyebrow>
              <div className="flex flex-wrap gap-2">
                {member.interests.map((t) => (
                  <Tag key={t}>{shortTag(t)}</Tag>
                ))}
              </div>
            </section>
          )}

          {isConnected ? (
            <div className="flex flex-col gap-3">
              <Button full size="lg" icon={MessageSquare} to={`/messages/${member.id}`}>
                Message {member.name}
              </Button>
              <p className="flex items-center justify-center gap-2 font-bold text-muted">
                <UserCheck size={18} /> In your network
              </p>
            </div>
          ) : (
            <Button
              full
              size="lg"
              icon={UserPlus}
              loading={busy === 'connect'}
              onClick={() => run('connect', () => connectWith(me, member.id))}
            >
              Add to my network
            </Button>
          )}
        </div>
      )}

      <section className="mt-8 flex flex-col gap-3 border-t border-line pt-6">
        <Eyebrow as="h2">Safety</Eyebrow>
        {actionError && (
          <p role="alert" className="font-bold text-primary">
            {actionError}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {iBlocked ? (
            <Button variant="secondary" loading={busy === 'block'} onClick={() => run('block', () => unblockUser(me, member.id))}>
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
          <Button variant="danger" icon={Flag} to={`/u/${member.id}/report`}>
            Report
          </Button>
        </div>
        <p className="text-sm text-muted">
          Blocking is instant and private. Every report is reviewed by a person; nothing happens automatically.
        </p>
      </section>
    </>
  )
}
