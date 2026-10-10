import { ArrowRight, HeartHandshake, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import { DEMO_INVITE_CODE } from '../../lib/constants.js'
import { checkInvite, normalizeCode } from '../../lib/db.js'
import { getCurrentUser } from '../../lib/session.js'

export default function WelcomePage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  if (getCurrentUser()) return <Navigate to="/events" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setChecking(true)
    try {
      await checkInvite(code)
      navigate(`/onboarding?code=${encodeURIComponent(normalizeCode(code))}`)
    } catch (err) {
      setError(err.message)
      setChecking(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-8 py-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/40">
          <HeartHandshake size={32} />
        </span>
        <h1 className="text-3xl font-extrabold leading-tight">I Don't Want to Go Alone</h1>
        <p className="text-text-main/75">
          Find women to go with to talks, workshops and courses in Barcelona. Every member is vouched for by
          another member.
        </p>
      </div>

      <Card className="flex items-center gap-3">
        <KeyRound size={22} className="shrink-0 text-accent-gold" />
        <p className="flex-1 text-sm">
          Jury? Use the demo code <span className="font-mono font-bold text-accent-gold">{DEMO_INVITE_CODE}</span>
        </p>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setCode(DEMO_INVITE_CODE)
            setError('')
          }}
        >
          Use it
        </Button>
      </Card>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Your invite code"
          placeholder="e.g. JURY2026"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            setError('')
          }}
          error={error}
          hint="You need a code from an existing member to join."
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
        />
        <Button full type="submit" icon={checking ? undefined : ArrowRight} loading={checking} disabled={!code.trim()}>
          {checking ? 'Checking code…' : 'Continue'}
        </Button>
      </form>
    </div>
  )
}
