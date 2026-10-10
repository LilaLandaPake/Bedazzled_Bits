import { HeartHandshake, KeyRound } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import { DEMO_INVITE_CODE } from '../../lib/constants.js'
import { getCurrentUser, setCurrentUser } from '../../lib/session.js'
import { MOCK_USER_IDS } from '../../mocks/index.js'

export default function WelcomePage() {
  const navigate = useNavigate()

  if (getCurrentUser()) return <Navigate to="/events" replace />

  // TODO(step 2): replace with invite code entry + onboarding.
  function previewAsDemo() {
    setCurrentUser(MOCK_USER_IDS.marta)
    navigate('/events')
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
        <p className="text-sm">
          Jury demo invite code: <span className="font-mono font-bold text-accent-gold">{DEMO_INVITE_CODE}</span>
        </p>
      </Card>

      <div className="flex flex-col gap-3">
        <Button full to="/onboarding">
          I have an invite code
        </Button>
        <Button full variant="ghost" onClick={previewAsDemo}>
          Preview as a demo member
        </Button>
      </div>
    </div>
  )
}
