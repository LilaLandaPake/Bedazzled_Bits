import { ArrowRight, BadgeCheck, Check, Home, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Chip from '../../components/ui/Chip.jsx'
import Header from '../../components/ui/Header.jsx'
import Input from '../../components/ui/Input.jsx'
import { ErrorState, Loading } from '../../components/ui/States.jsx'
import { AREAS, INTERESTS } from '../../lib/constants.js'
import { checkInvite, joinWithInvite } from '../../lib/db.js'
import { getCurrentUser, setCurrentUser } from '../../lib/session.js'

const STEPS = [
  { title: 'About you', intro: 'Tell the other women a little about yourself.' },
  { title: 'Your interests', intro: 'Pick at least one. We use them to recommend events.' },
  { title: 'Your area', intro: 'Where in Barcelona are you based? We use it to show events near you.' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const code = params.get('code') ?? ''

  const [invite, setInvite] = useState({ status: 'checking', owner: null, error: '' })
  const [attempt, setAttempt] = useState(0)

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [interests, setInterests] = useState([])
  const [area, setArea] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Re-check the code on arrival: the page may be opened directly or reloaded.
  useEffect(() => {
    let cancelled = false
    checkInvite(code)
      .then(({ owner }) => !cancelled && setInvite({ status: 'ready', owner, error: '' }))
      .catch((err) => !cancelled && setInvite({ status: 'error', owner: null, error: err.message }))
    return () => {
      cancelled = true
    }
  }, [code, attempt])

  if (getCurrentUser()) return <Navigate to="/events" replace />

  if (invite.status === 'checking') {
    return (
      <>
        <Header title="Join the community" back="/" />
        <Loading label="Checking your invite code…" />
      </>
    )
  }

  if (invite.status === 'error') {
    return (
      <>
        <Header title="Join the community" back="/" />
        <ErrorState
          message={code ? invite.error : 'Start by entering your invite code.'}
          onRetry={
            code
              ? () => {
                  setInvite({ status: 'checking', owner: null, error: '' })
                  setAttempt((n) => n + 1)
                }
              : undefined
          }
        />
        <Button variant="ghost" icon={Home} to="/" className="self-center">
          Back to the start
        </Button>
      </>
    )
  }

  const stepErrors = [
    name.trim() ? '' : 'Please enter your name.',
    interests.length ? '' : 'Pick at least one interest.',
    area ? '' : 'Choose your area.',
  ]
  const currentError = touched ? stepErrors[step] : ''

  function toggleInterest(tag) {
    setInterests((list) => (list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]))
  }

  function back() {
    setTouched(false)
    setSubmitError('')
    if (step === 0) navigate('/')
    else setStep(step - 1)
  }

  async function next(event) {
    event.preventDefault()
    setTouched(true)
    if (stepErrors[step]) return

    if (step < STEPS.length - 1) {
      setTouched(false)
      setStep(step + 1)
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const user = await joinWithInvite({ code, name, role, interests, area })
      setCurrentUser(user.id)
      navigate('/events', { replace: true })
    } catch (err) {
      setSubmitError(err.message)
      setSubmitting(false)
    }
  }

  const isLast = step === STEPS.length - 1

  return (
    <form onSubmit={next} noValidate className="flex flex-1 flex-col">
      <Header title="Join the community" onBack={back} />

      {invite.owner && (
        <p className="mb-4 flex items-center gap-2 rounded-2xl bg-accent-gold/15 px-4 py-3 text-sm text-accent-gold">
          <BadgeCheck size={18} className="shrink-0" />
          You were vouched for by {invite.owner.name}
        </p>
      )}

      <div className="mb-6 flex flex-col gap-2">
        <p className="text-sm text-text-main/60">
          Step {step + 1} of {STEPS.length}
        </p>
        <div className="flex gap-1.5" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span key={s.title} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-card'}`} />
          ))}
        </div>
        <h2 className="mt-2 text-2xl font-bold">{STEPS[step].title}</h2>
        <p className="text-text-main/70">{STEPS[step].intro}</p>
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <Input
            label="First name"
            placeholder="e.g. Laura"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={currentError}
            autoComplete="given-name"
            maxLength={40}
            autoFocus
          />
          <Input
            label="What do you do? (optional)"
            placeholder="e.g. UX designer, student, career changer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            maxLength={60}
          />
        </div>
      )}

      {step === 1 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Interests</legend>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((tag) => (
              <Chip
                key={tag}
                selected={interests.includes(tag)}
                icon={interests.includes(tag) ? Check : undefined}
                onClick={() => toggleInterest(tag)}
              >
                {tag}
              </Chip>
            ))}
          </div>
          {currentError && <p className="text-sm text-primary">{currentError}</p>}
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Area</legend>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <Chip
                key={a.name}
                tone="pink"
                selected={area === a.name}
                icon={MapPin}
                onClick={() => setArea(a.name)}
              >
                {a.name}
              </Chip>
            ))}
          </div>
          {currentError && <p className="text-sm text-primary">{currentError}</p>}
        </fieldset>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-8">
        {submitError && (
          <p role="alert" className="text-center text-sm text-primary">
            {submitError}
          </p>
        )}
        <Button full type="submit" loading={submitting} icon={isLast || submitting ? undefined : ArrowRight}>
          {isLast ? (submitting ? 'Creating your profile…' : 'Join and see events') : 'Next'}
        </Button>
      </div>
    </form>
  )
}
