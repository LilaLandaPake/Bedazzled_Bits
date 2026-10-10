import { Check } from 'lucide-react'

// Rounded pill for interests and filters. Selected pills are filled orange (dark: purple)
// with a check. Becomes a toggle button when `onClick` is given.
export default function Chip({ selected = false, check = true, onClick, className = '', children }) {
  const classes = `inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-left text-base ${
    selected ? 'border-accent bg-accent font-display font-bold text-on-accent' : 'border-line text-ink'
  } ${className}`

  const content = (
    <>
      {selected && check && <Check size={18} strokeWidth={2.5} />}
      {children}
    </>
  )

  if (onClick) {
    return (
      <button type="button" aria-pressed={selected} onClick={onClick} className={`${classes} transition active:scale-95`}>
        {content}
      </button>
    )
  }

  return <span className={classes}>{content}</span>
}

// Small uppercase label on event cards: "AI", "HACKATHON".
export function Tag({ className = '', children }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg bg-soft px-3 py-1.5 font-display text-xs font-bold tracking-[0.12em] text-soft-ink uppercase ${className}`}
    >
      {children}
    </span>
  )
}
