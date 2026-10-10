import { Star } from 'lucide-react'
import { MIN_RATINGS_SHOWN } from '../../lib/constants.js'

const LABELS = ['', 'Not great', 'Okay', 'Good', 'Very good', 'Great']

// Five tappable stars (1–5). Tapping the current value again keeps it.
export function StarInput({ value = 0, onChange, label }) {
  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label={label} className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
            onClick={() => onChange(n)}
            className="rounded-lg p-1 transition active:scale-90"
          >
            <Star
              size={30}
              strokeWidth={2}
              className={n <= value ? 'fill-gold text-gold' : 'text-line'}
            />
          </button>
        ))}
      </div>
      <span className="text-sm font-bold text-muted" aria-hidden="true">
        {LABELS[value]}
      </span>
    </div>
  )
}

// "★ 4.7 · 6 ratings", or a short note while she has fewer than MIN_RATINGS_SHOWN.
// `trust` comes from getTrust(): { count, average }.
export function StarSummary({ trust, self = false, className = '' }) {
  if (!trust) return null
  if (trust.average == null) {
    const left = MIN_RATINGS_SHOWN - trust.count
    return (
      <p className={`text-sm text-muted ${className}`}>
        {self
          ? `Your rating appears after ${MIN_RATINGS_SHOWN} ratings (${left} to go)`
          : trust.count === 0
            ? 'No ratings yet'
            : 'Not enough ratings yet'}
      </p>
    )
  }
  return (
    <p
      className={`inline-flex items-center gap-1.5 font-display font-bold ${className}`}
      aria-label={`Rated ${trust.average} out of 5 by ${trust.count} women`}
    >
      <Star size={18} className="fill-gold text-gold" />
      {trust.average.toFixed(1)}
      <span className="font-sans text-sm font-normal text-muted">
        · {trust.count} {trust.count === 1 ? 'rating' : 'ratings'}
      </span>
    </p>
  )
}
