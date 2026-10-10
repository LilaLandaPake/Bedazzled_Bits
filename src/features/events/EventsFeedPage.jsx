import Card from '../../components/ui/Card.jsx'
import Chip from '../../components/ui/Chip.jsx'
import Header from '../../components/ui/Header.jsx'
import ScreenPlaceholder from '../../components/ScreenPlaceholder.jsx'
import { events } from '../../mocks/index.js'

export default function EventsFeedPage() {
  return (
    <>
      <Header title="Events for you" />
      <ScreenPlaceholder
        title="Recommended events"
        message="AI recommendations, tag filters and friend badges will appear here."
      >
        {events.map((event) => (
          <Card key={event.id} to={`/events/${event.id}`} className="flex flex-col gap-2">
            <p className="font-semibold">{event.title}</p>
            <div className="flex flex-wrap gap-1.5">
              {event.tags.map((tag) => (
                <Chip key={tag}>{tag}</Chip>
              ))}
            </div>
          </Card>
        ))}
      </ScreenPlaceholder>
    </>
  )
}
