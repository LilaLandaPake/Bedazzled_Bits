import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import ThemeToggle from '../../components/ui/ThemeToggle.jsx'
import { Eyebrow } from '../../components/ui/PageTitle.jsx'
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
    <div className="flex flex-1 flex-col gap-6 pt-[calc(env(safe-area-inset-top)+3rem)] pb-4">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow icon={ShieldCheck}>Barcelona · Invite only</Eyebrow>
          <ThemeToggle />
        </div>
        <h1 className="font-display text-5xl leading-[1.05] font-extrabold tracking-tight">
          I don't want to go <span className="text-highlight">alone.</span>
        </h1>
        <p className="text-lg leading-relaxed">
          Find women to go with to talks, workshops and courses. Every member is vouched for by another member.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-auto flex flex-col gap-4">
        <Input
          label="Invite code"
          mono
          placeholder="e.g. JURY2026"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            setError('')
          }}
          error={error}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
        />

        <div className="flex items-center gap-3 rounded-3xl bg-soft px-5 py-4 text-soft-ink">
          <p className="flex-1">
            <span className="font-bold">Jury?</span> Use the demo code
          </p>
          <button
            type="button"
            aria-label={`Fill in the demo code ${DEMO_INVITE_CODE}`}
            onClick={() => {
              setCode(DEMO_INVITE_CODE)
              setError('')
            }}
            className="rounded-xl border-2 border-dashed border-current px-4 py-2 font-mono text-lg font-bold tracking-wider transition active:scale-95"
          >
            {DEMO_INVITE_CODE}
          </button>
        </div>

        <Button full size="lg" type="submit" loading={checking} disabled={!code.trim()}>
          {checking ? 'Checking code…' : 'Continue'}
        </Button>
        <p className="text-center text-muted">No invite? Ask a member to vouch for you.</p>
        <p className="text-center">
          Already a member?{' '}
          <Link to="/signin" className="font-display font-bold underline decoration-2 underline-offset-4">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
