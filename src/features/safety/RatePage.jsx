import { useParams } from 'react-router-dom'
import Header from '../../components/ui/Header.jsx'
import ScreenPlaceholder from '../../components/ScreenPlaceholder.jsx'

export default function RatePage() {
  const { id } = useParams()

  return (
    <>
      <Header title="How did it go?" back={`/events/${id}`} />
      <ScreenPlaceholder
        title="Private ratings"
        message="For each woman you met: “Would you go with her again?” Only you see your answers."
      />
    </>
  )
}
