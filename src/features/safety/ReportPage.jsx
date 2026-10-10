import { CheckCircle2, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Header from '../../components/ui/Header.jsx'
import Input from '../../components/ui/Input.jsx'
import { Eyebrow } from '../../components/ui/PageTitle.jsx'
import { EmptyState, ErrorState, Loading } from '../../components/ui/States.jsx'
import { REPORT_CATEGORIES } from '../../lib/constants.js'
import { getMember, reportUser } from '../../lib/db.js'
import { clearSession, getCurrentUser } from '../../lib/session.js'

// Reason from the fixed list (required) plus optional details (required for "other").
// Saved as pending; a person reviews it, nothing happens automatically.
export default function ReportPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const me = getCurrentUser()
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [touched, setTouched] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

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
        setState(data.member ? { status: 'ready', member: data.member } : { status: 'missing' })
      })
      .catch((err) => !cancelled && setState({ status: 'error', error: err.message }))
    return () => {
      cancelled = true
    }
  }, [id, me, attempt, navigate])

  if (id === me) return <Navigate to="/profile" replace />

  const header = <Header back={`/u/${id}`} />

  if (state.status === 'loading') {
    return (
      <>
        {header}
        <Loading />
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

  const { member } = state

  if (sent) {
    return (
      <>
        {header}
        <EmptyState
          icon={CheckCircle2}
          title="Thanks, your report was sent"
          message={`A person will review it. ${member.name} won't know it was you. If you're in danger, call 112.`}
          action={
            <Button onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/events'))}>Done</Button>
          }
        />
      </>
    )
  }

  const reasonError = touched && !reason ? 'Choose what happened.' : ''
  const detailsError = touched && reason === 'other' && !details.trim() ? 'Please tell us what happened.' : ''

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched(true)
    if (!reason || (reason === 'other' && !details.trim())) return
    setSending(true)
    setError('')
    try {
      await reportUser({ reporterId: me, reportedId: member.id, reason, details })
      setSent(true)
    } catch (err) {
      setError(err.message)
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {header}

      <div className="-mt-2 flex flex-col gap-3">
        <h1 className="font-display text-4xl leading-tight font-extrabold tracking-tight">Report {member.name}</h1>
        <p className="text-lg leading-relaxed">
          Your report is private — {member.name} won't know it was you. Every report is reviewed by a person. Nothing
          happens automatically.
        </p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <Eyebrow as="legend" className="mb-3">
          What happened?
        </Eyebrow>
        {REPORT_CATEGORIES.map((c) => (
          <label
            key={c.id}
            className={`flex cursor-pointer gap-4 rounded-3xl border-2 p-4 transition ${
              reason === c.id ? 'border-primary bg-soft' : 'border-line bg-surface'
            }`}
          >
            <input
              type="radio"
              name="reason"
              value={c.id}
              checked={reason === c.id}
              onChange={() => setReason(c.id)}
              className="mt-1 h-5 w-5 shrink-0 accent-[var(--primary)]"
            />
            <span>
              <span className="block font-display text-lg leading-snug font-bold">{c.label}</span>
              <span className="block text-muted">
                {c.id === 'other' ? 'Any other case — tell us what happened below' : c.description}
              </span>
            </span>
          </label>
        ))}
        {reasonError && <p className="font-bold text-primary">{reasonError}</p>}
      </fieldset>

      <Input
        label={reason === 'other' ? 'Details' : 'Details (optional)'}
        multiline
        placeholder="What did she say or do? When?"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        error={detailsError}
        maxLength={1000}
      />

      <div className="flex flex-col gap-3">
        {error && (
          <p role="alert" className="text-center font-bold text-primary">
            {error}
          </p>
        )}
        <Button full size="lg" type="submit" loading={sending}>
          {sending ? 'Sending…' : 'Send report'}
        </Button>
        <p className="text-center text-muted">If you're in danger, call 112.</p>
      </div>
    </form>
  )
}
