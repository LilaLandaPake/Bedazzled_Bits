import ThemeToggle from './ThemeToggle.jsx'

// Small spaced capitals above titles and sections: "BARCELONA · THIS WEEK", "ABOUT".
export function Eyebrow({ as: Tag = 'p', icon: Icon, className = '', children }) {
  return (
    <Tag className={`flex items-center gap-2 font-display text-sm font-bold tracking-[0.14em] text-muted uppercase ${className}`}>
      {Icon && <Icon size={20} />}
      {children}
    </Tag>
  )
}

// Top of a tab screen: eyebrow, big display title and an optional element on the right.
export default function PageTitle({ eyebrow, title, right }) {
  return (
    <header className="flex items-center gap-3 pt-[calc(env(safe-area-inset-top)+2rem)] pb-5">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-3">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : <span />}
          <ThemeToggle small />
        </div>
        <h1 className="font-display text-4xl leading-tight font-extrabold tracking-tight">{title}</h1>
      </div>
      {right}
    </header>
  )
}
