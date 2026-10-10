const TONES = {
  purple: {
    idle: 'bg-accent-purple/15 text-accent-purple',
    selected: 'bg-accent-purple text-main',
  },
  gold: {
    idle: 'bg-accent-gold/15 text-accent-gold',
    selected: 'bg-accent-gold text-main',
  },
  pink: {
    idle: 'bg-primary/15 text-primary',
    selected: 'bg-primary text-white',
  },
}

// Tags, filters and badges. Purple for tags, gold for AI/friend highlights.
// Becomes a toggle button when `onClick` is given.
export default function Chip({ tone = 'purple', selected = false, icon: Icon, onClick, className = '', children }) {
  const classes = `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${
    TONES[tone][selected ? 'selected' : 'idle']
  } ${className}`

  const content = (
    <>
      {Icon && <Icon size={14} />}
      {children}
    </>
  )

  if (onClick) {
    return (
      <button type="button" aria-pressed={selected} onClick={onClick} className={`${classes} transition active:scale-95`}>
        {content}
      </button>
    )
  }

  return <span className={classes}>{content}</span>
}
