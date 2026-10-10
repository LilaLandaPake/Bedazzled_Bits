import { ArrowRight, ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import { Eyebrow } from '../../components/ui/PageTitle.jsx'
import { findMembers } from '../../lib/db.js'
import { getCurrentUser, setCurrentUser } from '../../lib/session.js'

// For members who already joined (signed out, or opening the app on another device).
export default function SignInPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [matches, setMatches] = useState(null)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  if (getCurrentUser()) return <Navigate to="/events" replace />

  function enter(member) {
    setCurrentUser(member.id)
    navigate('/events', { replace: true })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMatches(null)
    setChecking(true)
    try {
      const found = await findMembers(name)
      if (found.length === 1) return enter(found[0])
      if (found.length === 0) setError("We couldn't find a member with that name. Check the spelling, or join with an invite code.")
      setMatches(found)
    } catch (err) {
      setError(err.message)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pt-[calc(env(safe-area-inset-top)+2rem)] pb-4">
      <Link to="/" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-ink" aria-label="Back">
        <ChevronLeft size={28} />
      </Link>
      <div className="flex flex-col gap-4">
        <Eyebrow>Welcome back</Eyebrow>
        <h1 className="font-display text-5xl leading-[1.05] font-extrabold tracking-tight">
          Sign <span className="text-highlight">in.</span>
        </h1>
        <p className="text-lg leading-relaxed">Enter the name you joined with.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Your name"
          placeholder="e.g. Lila"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
            setMatches(null)
          }}
          error={error}
          autoComplete="off"
        />
        <Button full size="lg" type="submit" icon={checking ? undefined : ArrowRight} loading={checking} disabled={!name.trim()}>
          Sign in
        </Button>
      </form>

      {matches?.length > 1 && (
        <div className="flex flex-col gap-3">
          <p className="text-muted">More than one member has that name. Which one are you?</p>
          {matches.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => enter(m)}
              className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-3 text-left transition active:scale-[0.98]"
            >
              <Avatar name={m.name} size="md" />
              <span>
                <span className="block font-display text-xl font-bold">{m.name}</span>
                <span className="text-muted">{[m.role, m.area].filter(Boolean).join(' · ')}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
