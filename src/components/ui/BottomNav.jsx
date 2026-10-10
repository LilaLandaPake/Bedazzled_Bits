import { CalendarHeart, Plus, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

function Tab({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition active:scale-95 ${
          isActive ? 'text-primary' : 'text-text-main/60'
        }`
      }
    >
      <Icon size={22} />
      {label}
    </NavLink>
  )
}

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-[480px] items-center justify-around px-4 py-1">
        <Tab to="/events" icon={CalendarHeart} label="Events" />
        <NavLink
          to="/events/new"
          aria-label="Publish an event"
          className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/40 ring-4 ring-main transition active:scale-90"
        >
          <Plus size={28} />
        </NavLink>
        <Tab to="/profile" icon={User} label="Profile" />
      </div>
    </nav>
  )
}
