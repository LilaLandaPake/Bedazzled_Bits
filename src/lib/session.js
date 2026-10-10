// No real auth: the current user id lives in localStorage.
// Storage can throw (private mode, blocked site data), so every access is guarded.
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

export function clearSession() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing to clear.
  }
}
