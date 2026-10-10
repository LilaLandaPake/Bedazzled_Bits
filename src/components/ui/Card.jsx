import { Link } from 'react-router-dom'

// A surface on the card colour. Becomes a tappable <Link> when `to` is given.
export default function Card({ to, className = '', children, ...rest }) {
  const classes = `block rounded-2xl bg-card p-4 ring-1 ring-white/5 ${
    to ? 'transition active:scale-[0.99] active:ring-accent-purple/40' : ''
  } ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}
