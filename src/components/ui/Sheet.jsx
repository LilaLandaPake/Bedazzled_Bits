import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

// Bottom sheet over a dimmed page. Closes on the X, a tap on the backdrop or Escape.
// `footer` stays pinned under the scrolling content.
export default function Sheet({ open, onClose, title, subtitle, footer, children }) {
  const titleId = useId()
  const panelRef = useRef(null)
  // Latest onClose without re-running the effect (which would steal focus) on every render.
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement
    const onKey = (e) => e.key === 'Escape' && closeRef.current()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-scrim" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[90dvh] w-full max-w-[480px] flex-col rounded-t-[2.5rem] bg-bg outline-none"
      >
        <span aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-line" />
        <div className="flex items-start gap-3 px-6 pt-5 pb-4">
          <div className="flex-1">
            <h2 id={titleId} className="font-display text-3xl leading-tight font-extrabold tracking-tight">
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-line text-ink transition active:bg-soft"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-4">{children}</div>
        {footer && (
          <div className="mx-6 flex items-center gap-4 border-t border-line pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
