import { CalendarClock, CheckCircle2, EyeOff, Lock, SearchX, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Header from '../../components/ui/Header.jsx'
import { StarInput } from '../../components/ui/Stars.jsx'
import { EmptyState, ErrorState, Loading } from '../../components/ui/States.jsx'
import { getRatingSheet, saveRatings } from '../../lib/db.js'
import { formatEventDate } from '../../lib/format.js'
import { clearSession, getCurrentUser } from '../../lib/session.js'

export default function RatePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  // "Simulate event finished" on the event page opens rating before the event is over.
  const [params] = useSearchParams()
  const demo = params.get('demo') === '1'
  const me = getCurrentUser()
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [answers, setAnswers] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    getRatingSheet(id, me)
      .then((sheet) => {
        if (cancelled) return
        if (!sheet.me) {
          clearSession()
          navigate('/', { replace: true })
          return
        }
        if (!sheet.event) return setState({ status: 'missing' })
        setAnswers(sheet.answers)
        setState({ status: 'ready', ...sheet })
      })
      .catch((err) => !cancelled && setState({ status: 'error', error: err.message }))
    return () => {
      cancelled = true
    }
  }, [id, me, attempt, navigate])

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      await saveRatings(id, me, answers)
      setSaved(true)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const header = <Header title="How did it go?" back={`/events/${id}`} />

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
          icon={SearchX}
          title="Event not found"
          message="It may have been removed, or the link is incomplete."
          action={<Button to="/events">See all events</Button>}
        />
      </>
    )
  }

  const { event, people } = state

  if (!event.isGoing) {
    return (
      <>
        {header}
        <EmptyState
          icon={Lock}
          title="Join the event first"
          message="You can rate the women you went with after joining an event."
          action={<Button to={`/events/${id}`}>Go to the event</Button>}
        />
      </>
    )
  }

  if (!state.isOpen && !demo) {
    return (
      <>
        {header}
        <EmptyState
          icon={CalendarClock}
          title="Rating opens after the event"
          message={`Come back after ${formatEventDate(state.opensAt.toISOString())} to rate the women you went with.`}
          action={<Button to={`/events/${id}`}>Back to the event</Button>}
        />
      </>
    )
  }

  if (saved) {
    return (
      <>
        {header}
        <EmptyState
          icon={CheckCircle2}
          title="Thanks for rating"
          message="Your stars are anonymous. Members only see their average, once they have 3 or more ratings."
          action={<Button to="/events">Find your next event</Button>}
        />
      </>
    )
  }

  if (people.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={Users}
          title="Nobody else went yet"
          message="When other women join this event, you can rate them here afterwards."
          action={<Button to={`/events/${id}`}>Back to the event</Button>}
        />
      </>
    )
  }

  const answeredCount = people.filter((p) => answers[p.id] !== undefined).length

  return (
    <div className="flex flex-1 flex-col">
      {header}

      <h1 className="mb-2 font-display text-3xl leading-tight font-extrabold tracking-tight">{event.title}</h1>
      <p className="mb-5 flex items-center gap-2 text-sm text-muted">
        <EyeOff size={15} className="shrink-0" /> Anonymous: nobody sees who gave which stars.
      </p>

      <ul className="flex flex-col gap-3">
        {people.map((p) => (
          <li key={p.id}>
            <Card className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={p.name} />
                <div>
                  <p className="font-display text-lg font-bold">{p.name}</p>
                  {p.role && <p className="text-sm text-muted">{p.role}</p>}
                </div>
              </div>
              <p className="font-bold">How was going to this event with her?</p>
              <StarInput
                value={answers[p.id] ?? 0}
                onChange={(stars) => setAnswers((a) => ({ ...a, [p.id]: stars }))}
                label={`Rate going with ${p.name}`}
              />
            </Card>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-3 pt-8">
        {saveError && (
          <p role="alert" className="text-center text-sm font-bold text-primary">
            {saveError}
          </p>
        )}
        <Button full size="lg" loading={saving} disabled={answeredCount === 0} onClick={handleSave}>
          {answeredCount === 0 ? 'Rate at least one person' : `Save ${answeredCount} ${answeredCount === 1 ? 'rating' : 'ratings'}`}
        </Button>
        <p className="text-center text-xs text-muted">
          Had a problem with someone? Report her from her profile.
        </p>
      </div>
    </div>
  )
}
