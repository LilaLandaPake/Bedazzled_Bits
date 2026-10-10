import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../lib/theme.js'

// Night/day switch. Shows the mode you would switch to.
export default function ThemeToggle({ small = false, className = '' }) {
  const [theme, setTheme] = useTheme()
  const night = theme === 'dark'
  return (
    <button
      type="button"
      onClick={() => setTheme()}
      aria-label={night ? 'Switch to day mode' : 'Switch to night mode'}
      title={night ? 'Day mode' : 'Night mode'}
      className={`flex ${small ? 'h-9 w-9' : 'h-11 w-11'} shrink-0 items-center justify-center rounded-full border-2 border-line text-ink transition active:scale-90 ${className}`}
    >
      {night ? <Sun size={small ? 18 : 20} /> : <Moon size={small ? 18 : 20} />}
    </button>
  )
}
