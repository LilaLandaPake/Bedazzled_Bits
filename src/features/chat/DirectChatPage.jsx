import { UserPlus, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Header from '../../components/ui/Header.jsx'
import { EmptyState, ErrorState, Loading } from '../../components/ui/States.jsx'
import { flagDirectMessage, getDirectChat, sendDirectMessage, subscribeToDirectChat } from '../../lib/db.js'
import { clearSession, getCurrentUser } from '../../lib/session.js'
import ChatRoom from './ChatRoom.jsx'

// 1:1 messages with a member of your network, opened from Friends and "For you".
export default function DirectChatPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const me = getCurrentUser()
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (id === me) return
    let cancelled = false
    getDirectChat(me, id)
      .then((chat) => {
        if (cancelled) return
        if (!chat.me) {
          clearSession()
          navigate('/', { replace: true })
          return
        }
        if (!chat.other) return setState({ status: 'missing' })
        if (!chat.isConnected) return setState({ status: 'locked', other: chat.other })
        setState({ status: 'ready', ...chat })
      })
      .catch((err) => !cancelled && setState({ status: 'error', error: err.message }))
    return () => {
      cancelled = true
    }
  }, [id, me, attempt, navigate])

  if (id === me) return <Navigate to="/profile" replace />

  const header = <Header title={state.other?.name ?? 'Messages'} back="/friends" bordered />

  if (state.status === 'loading') {
    return (
      <>
        {header}
        <Loading label="Loading messages…" />
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
          title="Chat not available"
          message="This member doesn't exist or isn't available to you."
          action={<Button to="/friends">Back to friends</Button>}
        />
      </>
    )
  }

  if (state.status === 'locked') {
    return (
      <>
        {header}
        <EmptyState
          icon={UserPlus}
          title={`${state.other.name} isn't in your network`}
          message="You can message women you're connected with. Add her from her profile first."
          action={<Button to={`/u/${id}`}>See her profile</Button>}
        />
      </>
    )
  }

  return (
    <ChatRoom
      key={id}
      me={me}
      title={state.other.name}
      subtitle={state.other.role || 'Vouched member'}
      back="/friends"
      placeholder={`Message ${state.other.name}`}
      emptyMessage={`Say hi to ${state.other.name} and find an event to go to together.`}
      initialMessages={state.messages}
      initialPeople={{ [state.other.id]: { name: state.other.name } }}
      blocked={[]}
      subscribe={(onMessage) => subscribeToDirectChat(me, id, onMessage)}
      send={(text) => sendDirectMessage(me, id, text)}
      flag={flagDirectMessage}
    />
  )
}
