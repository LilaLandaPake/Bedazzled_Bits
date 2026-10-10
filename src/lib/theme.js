// Night (default) and day mode. The choice is kept in localStorage and applied as
// data-theme on <html>; index.html applies it before first paint so there is no flash.
import { useSyncExternalStore } from 'react'

const KEY = 'idwtga_theme'
const EVENT = 'idwtga:theme'
const THEME_COLORS = { dark: '#170A2B', light: '#FFF4E9' }

function stored() {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export const getTheme = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
}

export function setTheme(theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // The switch still works for this visit.
  }
  applyTheme(theme)
  window.dispatchEvent(new Event(EVENT))
}

// Call once at startup.
export const initTheme = () => applyTheme(stored())

function subscribe(onChange) {
  window.addEventListener(EVENT, onChange)
  return () => window.removeEventListener(EVENT, onChange)
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => 'dark')
  return [theme, (next) => setTheme(next ?? (theme === 'dark' ? 'light' : 'dark'))]
}
