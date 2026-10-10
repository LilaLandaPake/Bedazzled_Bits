import { AlertTriangle, Inbox, Loader2, RotateCcw } from 'lucide-react'
import Button from './Button.jsx'

export function Loading({ label = 'Loading…' }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-text-main/70">
      <Loader2 size={28} className="animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-purple/15 text-accent-purple">
        <Icon size={26} />
      </span>
      <h2 className="text-lg font-bold">{title}</h2>
      {message && <p className="text-sm text-text-main/70">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
        <AlertTriangle size={26} />
      </span>
      <h2 className="text-lg font-bold">We couldn't load this</h2>
      <p className="text-sm text-text-main/70">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RotateCcw} onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  )
}
