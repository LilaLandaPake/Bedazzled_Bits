// Username + password accounts.
// With Supabase: Supabase Auth holds the password; the username is turned into a hidden
// email (<username>@members.idwtga.app) because Supabase logins need one. No email is sent;
// "Confirm email" must be off in the Supabase dashboard.
// Mock mode: a salted hash is kept in this browser's mock database (local testing only).
import { mockDb, saveMockDb } from './mockDb.js'
import { forgetUser, setCurrentUser } from './session.js'
import { supabase } from './supabase.js'

const EMAIL_DOMAIN = 'members.idwtga.app'
export const MIN_PASSWORD = 8

export const normalizeUsername = (raw) => raw.trim().toLowerCase().replace(/^@/, '')
const emailFor = (username) => `${normalizeUsername(username)}@${EMAIL_DOMAIN}`

export function usernameError(raw) {
  const u = normalizeUsername(raw)
  if (!u) return 'Choose a username.'
  if (u.length < 3 || u.length > 20) return 'Use 3 to 20 characters.'
  if (!/^[a-z0-9_.]+$/.test(u)) return 'Use only letters, numbers, dots and underscores.'
  return ''
}

export function passwordError(password) {
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`
  return ''
}

// ---------- Mock-mode password hashing ----------

async function hash(password, salt) {
  const text = `${salt}:${password}`
  if (crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  // crypto.subtle is missing on plain-http LAN addresses; mock mode is local-only anyway.
  let h = 0x811c9dc5
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193)
  return `fnv-${(h >>> 0).toString(16)}`
}

export async function mockCreateCredentials(userId, username, password) {
  const salt = crypto.getRandomValues(new Uint32Array(1))[0].toString(16)
  mockDb.credentials.push({ user_id: userId, username: normalizeUsername(username), salt, hash: await hash(password, salt) })
  saveMockDb()
}

export const mockUsernameTaken = (username) =>
  mockDb.credentials.some((c) => c.username === normalizeUsername(username))

// ---------- Accounts ----------

// Creates the login and signs in. Returns the account id (used as the member's id).
// Supabase only; mock-mode accounts are created by joinWithInvite().
export async function createAccount(username, password) {
  const email = emailFor(username)
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) {
    if (/already (registered|exists)/i.test(error.message)) {
      // A previous attempt created the login but joining failed: reuse it if the password matches.
      const retry = await supabase.auth.signInWithPassword({ email, password })
      if (retry.error) throw new Error('That username is taken. Try another one.')
      return retry.data.user.id
    }
    if (/password/i.test(error.message)) throw new Error(error.message)
    throw new Error("We couldn't create your account. Please try again.")
  }
  if (!data.session) {
    throw new Error('Your account needs email confirmation, which this app doesn\'t use. Ask the team to turn off "Confirm email" in Supabase.')
  }
  return data.user.id
}

// Signs in and returns the member id. Throws a message that is safe to show.
export async function signIn(username, password) {
  const wrong = 'Wrong username or password.'
  if (usernameError(username) || !password) throw new Error(wrong)

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: emailFor(username), password })
    if (error) {
      if (/invalid login credentials/i.test(error.message)) throw new Error(wrong)
      throw new Error("We couldn't reach the server. Check your connection and try again.")
    }
    const { data: profile } = await supabase.from('users').select('id').eq('id', data.user.id).maybeSingle()
    if (!profile) {
      await supabase.auth.signOut()
      throw new Error("This account didn't finish joining. Join again with your invite code.")
    }
    setCurrentUser(data.user.id)
    return data.user.id
  }

  const cred = mockDb.credentials.find((c) => c.username === normalizeUsername(username))
  if (!cred || cred.hash !== (await hash(password, cred.salt))) throw new Error(wrong)
  setCurrentUser(cred.user_id)
  return cred.user_id
}

// Runs once before the app renders: the Supabase login session is the source of truth for
// who is signed in, so a stale or logged-out browser is sent back to the start.
export async function initAuth() {
  if (!supabase) return
  try {
    const { data } = await supabase.auth.getSession()
    const id = data.session?.user?.id
    if (id) setCurrentUser(id)
    else forgetUser()
  } catch {
    forgetUser()
  }
  supabase.auth.onAuthStateChange((event, session) => {
    if (!session) forgetUser()
  })
}
