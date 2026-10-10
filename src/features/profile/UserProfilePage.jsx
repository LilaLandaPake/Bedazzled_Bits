import { useParams } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Button from '../../components/ui/Button.jsx'
import Header from '../../components/ui/Header.jsx'
import { EmptyState } from '../../components/ui/States.jsx'
import ScreenPlaceholder from '../../components/ScreenPlaceholder.jsx'
import { users } from '../../mocks/index.js'

export default function UserProfilePage() {
  const { id } = useParams()
  const user = users.find((u) => u.id === id)

  if (!user) {
    return (
      <>
        <Header title="Member" back="/profile" />
        <EmptyState
          title="Member not found"
          message="This profile isn't available."
          action={<Button to="/events">Back to events</Button>}
        />
      </>
    )
  }

  return (
    <>
      <Header title={user.name} back="/profile" />
      <div className="flex flex-col items-center gap-2 py-4">
        <Avatar name={user.name} size="lg" />
        <p className="text-lg font-bold">{user.name}</p>
        <p className="text-sm text-text-main/70">{user.role}</p>
      </div>
      <ScreenPlaceholder title="Member profile" message="Bio, who vouched for her, and Block / Report actions." />
    </>
  )
}
