// Fallback "database" used when Supabase isn't configured. Starts from src/mocks and
// persists changes in localStorage so users created in onboarding survive a reload.
import * as mocks from '../mocks/index.js'

const KEY = 'idwtga_mock_db'
// Bump when src/mocks changes shape so stale saved copies are discarded.
const VERSION = 2

const TABLES = ['users', 'invites', 'connections', 'events', 'attendances', 'messages', 'direct_messages', 'blocks', 'reports', 'ratings']

function fresh() {
  return Object.fromEntries(TABLES.map((t) => [t, structuredClone(mocks[t])]))
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (saved?.version === VERSION) return saved.tables
  } catch {
    // Unreadable or blocked storage: start from mocks.
  }
  return fresh()
}

const tables = load()

export const mockDb = tables

export function saveMockDb() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, tables }))
  } catch {
    // Changes stay in memory for this page load.
  }
}

// Small delay so loading states are visible and behave like the real backend.
export const mockDelay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

// Forget everything saved in this browser and start again from src/mocks.
export function resetMockDb() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing saved.
  }
  Object.assign(tables, fresh())
}
