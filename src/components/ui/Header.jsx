import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Sticky top bar. `back` is the fallback path used when there is no in-app history
// (e.g. the page was opened from a shared link). `onBack` overrides navigation entirely,
// e.g. to step back inside a multi-step form.
export default function Header({ title, back, onBack, right }) {
  const navigate = useNavigate()

  function goBack() {
    if (onBack) onBack()
    else if (window.history.state?.idx > 0) navigate(-1)
    else navigate(back)
  }

  return (
    <header className="sticky top-0 z-20 -mx-4 mb-4 flex min-h-14 items-center gap-2 bg-main/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur">
      {(back || onBack) && (
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full transition active:bg-white/10"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      <h1 className="flex-1 truncate text-lg font-bold">{title}</h1>
      {right}
    </header>
  )
}
