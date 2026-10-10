import { Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const VARIANTS = {
  primary: 'rounded-full bg-primary font-display font-bold text-on-primary active:brightness-90',
  secondary: 'rounded-full border-2 border-ink bg-transparent font-display font-bold text-ink active:bg-soft',
  soft: 'rounded-full bg-soft font-display font-bold text-soft-ink active:brightness-95',
  link: 'rounded-md font-display font-bold text-ink underline decoration-2 underline-offset-4 active:opacity-70',
  danger: 'rounded-full border-2 border-primary bg-transparent font-display font-bold text-primary active:bg-soft',
}

const SIZES = {
  lg: 'h-14 px-6 text-lg',
  md: 'h-12 px-5 text-base',
  sm: 'h-10 px-4 text-sm',
  icon: 'h-12 w-12 shrink-0',
}

// Renders a <Link> when `to` is given, an external <a> (new tab) when `href` is given,
// otherwise a <button>. `link` variant has no padding so it sits inline like the design's
// "Clear", "Report" and "Block".
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
    'inline-flex select-none items-center justify-center gap-2 transition active:scale-[0.97]',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    variant === 'link' ? 'min-h-10 px-1' : SIZES[size],
    full ? 'w-full' : '',
    className,
  ].join(' ')

  const content = (
    <>
      {loading ? <Loader2 size={18} className="animate-spin" /> : Icon && <Icon size={size === 'icon' ? 22 : 18} />}
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
