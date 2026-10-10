import { Outlet } from 'react-router-dom'
import BottomNav from './ui/BottomNav.jsx'

// Centered mobile column (max 480px). `withNav` adds the bottom tab bar
// and reserves space so content never hides behind it.
export default function AppShell({ withNav = false }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4">
      <main className={`flex flex-1 flex-col ${withNav ? 'pb-28' : 'pb-6'}`}>
        <Outlet />
      </main>
      {withNav && <BottomNav />}
    </div>
  )
}
