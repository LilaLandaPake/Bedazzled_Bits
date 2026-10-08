import { Bell, Zap } from 'lucide-react'

export default function Header() {
  return (
    <header className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Zap size={22} />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Hackathon App</h1>
      </div>
      <button
        type="button"
        aria-label="Notificaciones"
        className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition active:scale-90 active:bg-slate-100"
      >
        <Bell size={22} />
      </button>
    </header>
  )
}
