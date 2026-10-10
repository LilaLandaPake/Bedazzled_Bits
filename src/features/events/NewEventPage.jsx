import Header from '../../components/ui/Header.jsx'
import ScreenPlaceholder from '../../components/ScreenPlaceholder.jsx'

export default function NewEventPage() {
  return (
    <>
      <Header title="Publish an event" back="/events" />
      <ScreenPlaceholder
        title="Create an event"
        message="Title, description, tags, venue, date and an optional external link."
      />
    </>
  )
}
