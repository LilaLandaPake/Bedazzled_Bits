import { useState } from 'react'
import { Home, Plus, Search, User } from 'lucide-react'

const items = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'search', label: 'Buscar', icon: Search },
  { id: 'profile', label: 'Perfil', icon: User },
]

export default function BottomNav() {
  const [active, setActive] = useState('home')

  return (
    <nav className="relative flex items-center justify-around rounded-2xl bg-slate-900 px-2 py-2 text-slate-400">
      {items.slice(0, 2).map((item) => (
        <NavButton key={item.id} item={item} active={active === item.id} onClick={() => setActive(item.id)} />
      ))}

      <button
        type="button"
        aria-label="Acción principal"
        className="-mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 ring-4 ring-white transition active:scale-90"
      >
        <Plus size={30} />
      </button>

      {items.slice(2).map((item) => (
        <NavButton key={item.id} item={item} active={active === item.id} onClick={() => setActive(item.id)} />
      ))}
    </nav>
  )
}

function NavButton({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs transition active:scale-90 ${
        active ? 'text-white' : ''
      }`}
    >
      <Icon size={22} />
      {item.label}
    </button>
  )
}
