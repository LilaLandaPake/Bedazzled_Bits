import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Header from '../../components/ui/Header.jsx'
import ScreenPlaceholder from '../../components/ScreenPlaceholder.jsx'
import { clearSession, getCurrentUser } from '../../lib/session.js'
import { connections, users } from '../../mocks/index.js'

export default function ProfilePage() {
  const navigate = useNavigate()
  const me = getCurrentUser()
  const friendIds = connections.filter((c) => c.user_id === me).map((c) => c.connected_user_id)
  const friends = users.filter((u) => friendIds.includes(u.id))

  function signOut() {
    clearSession()
    navigate('/', { replace: true })
  }

  return (
    <>
      <Header title="My profile" />
      <ScreenPlaceholder title="Profile & network" message="Your stats, invite code generator and network list.">
        {friends.map((friend) => (
          <Card key={friend.id} to={`/u/${friend.id}`} className="flex items-center gap-3">
            <Avatar name={friend.name} />
            <div>
              <p className="font-semibold">{friend.name}</p>
              <p className="text-sm text-text-main/70">{friend.role}</p>
            </div>
          </Card>
        ))}
        <Button full variant="ghost" icon={LogOut} onClick={signOut}>
          Sign out
        </Button>
      </ScreenPlaceholder>
    </>
  )
}
