import { LogOut, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Header from '../../components/ui/Header.jsx'
import { EmptyState, ErrorState, Loading } from '../../components/ui/States.jsx'
import ScreenPlaceholder from '../../components/ScreenPlaceholder.jsx'
import { getFriends, getUser } from '../../lib/db.js'
import { clearSession, getCurrentUser } from '../../lib/session.js'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', me: null, friends: [], error: '' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    const id = getCurrentUser()
    Promise.all([getUser(id), getFriends(id)])
      .then(([me, friends]) => {
        if (cancelled) return
        if (!me) {
          // Stored id no longer exists (e.g. data was reset): start over.
          clearSession()
          navigate('/', { replace: true })
          return
        }
        setState({ status: 'ready', me, friends, error: '' })
      })
      .catch((err) => !cancelled && setState({ status: 'error', me: null, friends: [], error: err.message }))
    return () => {
      cancelled = true
    }
  }, [attempt, navigate])

  function signOut() {
    clearSession()
    navigate('/', { replace: true })
  }

  return (
    <>
      <Header title="My profile" />
      {state.status === 'loading' && <Loading label="Loading your profile…" />}
      {state.status === 'error' && (
        <ErrorState
          message={state.error}
          onRetry={() => {
            setState((s) => ({ ...s, status: 'loading' }))
            setAttempt((n) => n + 1)
          }}
        />
      )}
      {state.status === 'ready' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Avatar name={state.me.name} size="lg" />
            <p className="text-xl font-bold">{state.me.name}</p>
            {state.me.role && <p className="text-sm text-text-main/70">{state.me.role}</p>}
            <p className="text-sm text-text-main/60">{state.me.area}</p>
          </div>

          <h2 className="mt-2 font-bold">My network</h2>
          {state.friends.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No connections yet"
              message="Invite a friend or connect with women you meet at events."
            />
          ) : (
            state.friends.map((friend) => (
              <Card key={friend.id} to={`/u/${friend.id}`} className="flex items-center gap-3">
                <Avatar name={friend.name} />
                <div>
                  <p className="font-semibold">{friend.name}</p>
                  {friend.role && <p className="text-sm text-text-main/70">{friend.role}</p>}
                </div>
              </Card>
            ))
          )}

          <ScreenPlaceholder title="More coming" message="Your stats and the invite code generator." />
          <Button full variant="ghost" icon={LogOut} onClick={signOut}>
            Sign out
          </Button>
        </div>
      )}
    </>
  )
}
