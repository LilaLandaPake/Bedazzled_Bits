import { ArrowRight, ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import { Eyebrow } from '../../components/ui/PageTitle.jsx'
import { signIn } from '../../lib/auth.js'
import { getCurrentUser } from '../../lib/session.js'

// For members who already joined (signed out, or opening the app on another device).
export default function SignInPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  if (getCurrentUser()) return <Navigate to="/events" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setChecking(true)
    try {
      await signIn(username, password)
      navigate('/events', { replace: true })
    } catch (err) {
      setError(err.message)
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
        <p className="text-lg leading-relaxed">Enter the username and password you chose when you joined.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Username"
          placeholder="e.g. laura_bcn"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value)
            setError('')
          }}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError('')
          }}
          error={error}
          autoComplete="current-password"
        />
        <Button
          full
          size="lg"
          type="submit"
          icon={checking ? undefined : ArrowRight}
          loading={checking}
          disabled={!username.trim() || !password}
        >
          Sign in
        </Button>
      </form>

      <p className="text-sm text-muted">
        Forgot your password? It can't be reset yet. New here?{' '}
        <Link to="/" className="font-bold text-ink underline underline-offset-2">
          Join with an invite code
        </Link>
        .
      </p>
    </div>
  )
}
