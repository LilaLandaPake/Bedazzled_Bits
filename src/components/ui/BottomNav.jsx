import { Activity, Compass, User, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/events', icon: Compass, label: 'Explore' },
  { to: '/for-you', icon: Activity, label: 'For you' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto grid max-w-[480px] grid-cols-4 px-2 py-2">
        {TABS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-2xl py-1.5 font-display text-sm font-bold transition active:scale-95 ${
                isActive ? 'text-primary' : 'text-muted'
              }`
            }
          >
            <Icon size={28} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
