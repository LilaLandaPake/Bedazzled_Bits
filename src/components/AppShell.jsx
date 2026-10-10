import { Outlet } from 'react-router-dom'
import { hasSupabase } from '../lib/supabase.js'
import BottomNav from './ui/BottomNav.jsx'

// Centered mobile column (max 480px). `withNav` adds the bottom tab bar
// and reserves space so content never hides behind it.
export default function AppShell({ withNav = false }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4">
      {!hasSupabase && (
        <p role="note" className="-mx-4 bg-soft px-4 py-1.5 text-center text-xs text-soft-ink">
          Demo data: saved on this device only, not shared with other phones. Connect Supabase to share.
        </p>
      )}
      <main className={`flex flex-1 flex-col ${withNav ? 'pb-32' : 'pb-6'}`}>
        <Outlet />
      </main>
      {withNav && <BottomNav />}
    </div>
  )
}
