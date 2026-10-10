// Data access for the app. Every function works against Supabase when it's configured
// and against the local mock database otherwise. Errors thrown here have messages that
// are safe to show to the user.
import { AREAS } from './constants.js'
import { mockDb, mockDelay, saveMockDb } from './mockDb.js'
import { supabase } from './supabase.js'
import { uuid } from './uuid.js'

const NETWORK_ERROR = "We couldn't reach the server. Check your connection and try again."

export const normalizeCode = (code) => code.trim().toUpperCase()

// ---------- Invites ----------

// Returns { invite, owner } for a code that can still be redeemed. Throws otherwise.
export async function checkInvite(rawCode) {
  const code = normalizeCode(rawCode)
  if (!code) throw new Error('Enter your invite code.')

  let invite
  let owner = null

  if (supabase) {
    const { data, error } = await supabase.from('invites').select('*').eq('code', code).maybeSingle()
    if (error) throw new Error(NETWORK_ERROR)
    invite = data
    if (invite?.owner_id) {
      const res = await supabase.from('users').select('id, name').eq('id', invite.owner_id).maybeSingle()
      owner = res.data
    }
  } else {
    await mockDelay()
    invite = mockDb.invites.find((i) => i.code === code)
    owner = mockDb.users.find((u) => u.id === invite?.owner_id) ?? null
  }

  if (!invite) throw new Error("That code doesn't exist. Check it with the person who invited you.")
  if (!invite.reusable && invite.used_by) throw new Error('This code has already been used. Ask for a new one.')
  return { invite, owner }
}

// ---------- Users ----------

export async function getUser(id) {
  if (!id) return null
  if (supabase) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(NETWORK_ERROR)
    return data
  }
  await mockDelay(150)
  return mockDb.users.find((u) => u.id === id) ?? null
}

// Members connected to `userId`, as user rows.
export async function getFriends(userId) {
  if (supabase) {
    const { data: links, error } = await supabase
      .from('connections')
      .select('connected_user_id')
      .eq('user_id', userId)
    if (error) throw new Error(NETWORK_ERROR)
    const ids = links.map((l) => l.connected_user_id)
    if (!ids.length) return []
    const { data, error: usersError } = await supabase.from('users').select('*').in('id', ids)
    if (usersError) throw new Error(NETWORK_ERROR)
    return data
  }
  await mockDelay(150)
  const ids = new Set(mockDb.connections.filter((c) => c.user_id === userId).map((c) => c.connected_user_id))
  return mockDb.users.filter((u) => ids.has(u.id))
}

// Creates the member, claims the invite and connects her with whoever invited her
// (both directions). Returns the new user.
export async function joinWithInvite({ code: rawCode, name, role, interests, area }) {
  const code = normalizeCode(rawCode)
  const { invite } = await checkInvite(code)
  const point = AREAS.find((a) => a.name === area)

  const user = {
    id: uuid(),
    name: name.trim(),
    role: role.trim(),
    interests,
    area,
    lat: point?.lat ?? null,
    lng: point?.lng ?? null,
    invited_by: invite.owner_id,
    is_demo: false,
    created_at: new Date().toISOString(),
  }

  const now = user.created_at
  const links = invite.owner_id
    ? [
        { user_id: invite.owner_id, connected_user_id: user.id, created_at: now },
        { user_id: user.id, connected_user_id: invite.owner_id, created_at: now },
      ]
    : []

  if (supabase) {
    const { error: userError } = await supabase.from('users').insert(user)
    if (userError) throw new Error(NETWORK_ERROR)

    if (!invite.reusable) {
      // Only succeeds if nobody redeemed the code in the meantime.
      const { data: claimed, error } = await supabase
        .from('invites')
        .update({ used_by: user.id })
        .eq('code', code)
        .is('used_by', null)
        .select()
      if (error || !claimed?.length) {
        await supabase.from('users').delete().eq('id', user.id)
        throw new Error(error ? NETWORK_ERROR : 'This code has already been used. Ask for a new one.')
      }
    }

    if (links.length) {
      // A missing connection shouldn't block joining; she can still connect from a profile.
      await supabase.from('connections').upsert(links, { ignoreDuplicates: true })
    }
    return user
  }

  await mockDelay()
  mockDb.users.push(user)
  if (!invite.reusable) mockDb.invites.find((i) => i.code === code).used_by = user.id
  mockDb.connections.push(...links)
  saveMockDb()
  return user
}
