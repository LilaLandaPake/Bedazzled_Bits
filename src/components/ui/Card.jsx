import { Link } from 'react-router-dom'

// White (dark: plum) surface with the beige hairline border. Becomes a tappable <Link>
// when `to` is given.
export default function Card({ to, className = '', children, ...rest }) {
  const classes = `block rounded-3xl border border-line bg-surface p-5 ${
    to ? 'transition active:scale-[0.99] active:border-primary/50' : ''
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
