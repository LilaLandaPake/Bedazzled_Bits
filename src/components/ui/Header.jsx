import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Sticky top bar with a back chevron. `back` is the fallback path used when there is no
// in-app history (e.g. the page was opened from a shared link). `onBack` overrides
// navigation entirely, e.g. to step back inside a multi-step form. Title and subtitle are
// optional: detail pages show only the chevron.
export default function Header({ title, subtitle, back, onBack, right, bordered = false }) {
  const navigate = useNavigate()

  function goBack() {
    if (onBack) onBack()
    else if (window.history.state?.idx > 0) navigate(-1)
    else navigate(back)
  }

  return (
    <header
      className={`sticky top-0 z-20 -mx-4 mb-4 flex min-h-16 items-center gap-3 bg-bg/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur ${
        bordered ? 'border-b border-line py-3' : 'py-2'
      }`}
    >
      {(back || onBack) && (
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink transition active:bg-soft"
        >
          <ChevronLeft size={28} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        {title && <h1 className="truncate font-display text-2xl leading-tight font-bold">{title}</h1>}
        {subtitle && <p className="truncate text-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}
