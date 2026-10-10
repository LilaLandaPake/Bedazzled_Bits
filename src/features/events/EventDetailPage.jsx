import { MessageCircle, Star } from 'lucide-react'
import { useParams } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Header from '../../components/ui/Header.jsx'
import { EmptyState } from '../../components/ui/States.jsx'
import ScreenPlaceholder from '../../components/ScreenPlaceholder.jsx'
import { events } from '../../mocks/index.js'

export default function EventDetailPage() {
  const { id } = useParams()
  const event = events.find((e) => e.id === id)

  if (!event) {
    return (
      <>
        <Header title="Event" back="/events" />
        <EmptyState
          title="Event not found"
          message="It may have been removed, or the link is incomplete."
          action={<Button to="/events">See all events</Button>}
        />
      </>
    )
  }

  return (
    <>
      <Header title={event.title} back="/events" />
      <ScreenPlaceholder
        title="Event detail"
        message="Event info, friend badges, attendee count and the join button will appear here."
      >
        <Button full variant="secondary" icon={MessageCircle} to={`/events/${id}/chat`}>
          Open event chat
        </Button>
        <Button full variant="ghost" icon={Star} to={`/events/${id}/rate`}>
          Simulate event finished
        </Button>
      </ScreenPlaceholder>
    </>
  )
}
