import { Compass } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import { EmptyState } from '../components/ui/States.jsx'

export default function NotFoundPage() {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <EmptyState
        icon={Compass}
        title="This page doesn't exist"
        message="The link may be broken or the page was moved."
        action={<Button to="/">Go to the start</Button>}
      />
    </div>
  )
}
