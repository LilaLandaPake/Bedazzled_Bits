import { useParams } from 'react-router-dom'
import Header from '../../components/ui/Header.jsx'
import ScreenPlaceholder from '../../components/ScreenPlaceholder.jsx'

export default function EventChatPage() {
  const { id } = useParams()

  return (
    <>
      <Header title="Event chat" back={`/events/${id}`} />
      <ScreenPlaceholder
        title="Event chat"
        message="Realtime chat with the women going, with AI safety warnings on risky messages."
      />
    </>
  )
}
