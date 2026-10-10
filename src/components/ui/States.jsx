import { AlertTriangle, Inbox, Loader2, RotateCcw } from 'lucide-react'
import Button from './Button.jsx'

export function Loading({ label = 'Loading…' }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
      <Loader2 size={28} className="animate-spin text-primary" />
      <p>{label}</p>
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-soft text-soft-ink">
        <Icon size={28} />
      </span>
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {message && <p className="text-muted">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-soft text-primary">
        <AlertTriangle size={28} />
      </span>
      <h2 className="font-display text-xl font-bold">We couldn't load this</h2>
      <p className="text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RotateCcw} onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  )
}
