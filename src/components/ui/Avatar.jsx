const COLORS = ['bg-primary text-white', 'bg-accent-purple text-main', 'bg-accent-gold text-main']

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-20 w-20 text-2xl',
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

// Same name always gets the same colour.
function colorFor(name = '') {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

export default function Avatar({ name, size = 'md', className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${SIZES[size]} ${colorFor(name)} ${className}`}
    >
      {initials(name)}
    </span>
  )
}
