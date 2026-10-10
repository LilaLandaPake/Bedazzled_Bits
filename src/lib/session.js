// The signed-in member's id, cached in localStorage so pages can read it synchronously.
// With Supabase, the Supabase Auth session is the source of truth (see initAuth in auth.js).
// Storage can throw (private mode, blocked site data), so every access is guarded.
import { supabase } from './supabase.js'

const KEY = 'idwtga_user_id'

export function getCurrentUser() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setCurrentUser(id) {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    // Session just won't persist across reloads.
  }
}

// Forgets the member in this browser only (used when the login session has already ended).
export function forgetUser() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing to clear.
  }
}

// Signs out: forgets the member and ends the Supabase login session.
export function clearSession() {
  forgetUser()
  supabase?.auth.signOut().catch(() => {})
}
