import { Construction } from 'lucide-react'
import { EmptyState } from './ui/States.jsx'

// Temporary body for screens that are routed but not built yet. Remove once every screen is done.
export default function ScreenPlaceholder({ title, message, children }) {
  return (
    <>
      <EmptyState icon={Construction} title={title} message={message} />
      {children && <div className="flex flex-col gap-3">{children}</div>}
    </>
  )
}
