import { Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const VARIANTS = {
  primary: 'bg-primary text-white shadow-lg shadow-primary/30 active:brightness-90',
  secondary: 'bg-card text-text-main ring-1 ring-accent-purple/40 active:bg-accent-purple/20',
  ghost: 'text-accent-purple active:bg-accent-purple/15',
  danger: 'bg-card text-primary ring-1 ring-primary/50 active:bg-primary/15',
}

const SIZES = {
  md: 'h-12 px-5 text-base',
  sm: 'h-9 px-3 text-sm',
  icon: 'h-12 w-12 shrink-0',
}

// Renders a <Link> when `to` is given, an external <a> (new tab) when `href` is given,
// otherwise a <button>.
export default function Button({
  variant = 'primary',
  size = 'md',
  full = false,
  loading = false,
  disabled = false,
  icon: Icon,
  to,
  href,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'inline-flex select-none items-center justify-center gap-2 rounded-2xl font-semibold transition active:scale-[0.97]',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    full ? 'w-full' : '',
    className,
  ].join(' ')

  const content = (
    <>
      {loading ? <Loader2 size={18} className="animate-spin" /> : Icon && <Icon size={18} />}
      {children}
    </>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...rest}>
        {content}
      </a>
    )
  }

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  )
}
