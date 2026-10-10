const COLORS = ['bg-avatar-1', 'bg-avatar-2', 'bg-avatar-3']

const SIZES = {
  xs: 'h-9 w-9 text-sm',
  sm: 'h-11 w-11 text-base',
  md: 'h-14 w-14 text-xl',
  lg: 'h-16 w-16 text-2xl',
  xl: 'h-24 w-24 text-4xl',
}

const initial = (name = '') => name.trim().charAt(0).toUpperCase() || '?'

// Same name always gets the same colour.
function colorFor(name = '') {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

// Initial in a coloured circle. `color` overrides the hashed colours, background and text
// (e.g. 'bg-gold text-on-gold').
export default function Avatar({ name, size = 'md', color, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold ${SIZES[size]} ${
        color ?? `${colorFor(name)} text-avatar-ink`
      } ${className}`}
    >
      {initial(name)}
    </span>
  )
}
