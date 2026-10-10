// Data access for the app. Every function works against Supabase when it's configured
// and against the local mock database otherwise. Errors thrown here have messages that
// are safe to show to the user.
import { AREAS } from './constants.js'
import { distanceKm } from './distance.js'
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

// ---------- Events ----------

// Events starting today or later (today's are kept so the hackathon itself shows up).
function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

// Everything the feed needs in one call: the current user and upcoming events, each with
// attendee count, friends going (blocked members excluded) and distance from the user.
export async function getFeed(userId) {
  let me, events, attendances, friendIds, blocks

  if (supabase) {
    const [meRes, eventsRes, linksRes, blocksRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).maybeSingle(),
      supabase.from('events').select('*').gte('starts_at', startOfToday()).order('starts_at'),
      supabase.from('connections').select('connected_user_id').eq('user_id', userId),
      supabase.from('blocks').select('*').or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
    ])
    const failed = [meRes, eventsRes, linksRes, blocksRes].find((r) => r.error)
    if (failed) throw new Error(NETWORK_ERROR)
    me = meRes.data
    events = eventsRes.data
    friendIds = linksRes.data.map((l) => l.connected_user_id)
    blocks = blocksRes.data

    const eventIds = events.map((e) => e.id)
    const attRes = eventIds.length
      ? await supabase.from('attendances').select('user_id, event_id').in('event_id', eventIds)
      : { data: [] }
    if (attRes.error) throw new Error(NETWORK_ERROR)
    attendances = attRes.data
  } else {
    await mockDelay()
    me = mockDb.users.find((u) => u.id === userId) ?? null
    const from = new Date(startOfToday())
    events = mockDb.events.filter((e) => new Date(e.starts_at) >= from)
    events.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
    friendIds = mockDb.connections.filter((c) => c.user_id === userId).map((c) => c.connected_user_id)
    blocks = mockDb.blocks.filter((b) => b.blocker_id === userId || b.blocked_id === userId)
    attendances = mockDb.attendances
  }

  if (!me) return { me: null, events: [] }

  const blocked = new Set(blocks.flatMap((b) => [b.blocker_id, b.blocked_id]))
  blocked.delete(userId)
  const friends = new Set(friendIds.filter((id) => !blocked.has(id)))

  // Friend names are needed for the badges.
  const friendNames = new Map()
  if (friends.size) {
    if (supabase) {
      const { data } = await supabase.from('users').select('id, name').in('id', [...friends])
      data?.forEach((u) => friendNames.set(u.id, u.name))
    } else {
      mockDb.users.filter((u) => friends.has(u.id)).forEach((u) => friendNames.set(u.id, u.name))
    }
  }

  const enriched = events.map((event) => {
    const going = attendances.filter((a) => a.event_id === event.id).map((a) => a.user_id)
    return {
      ...event,
      attendeeCount: going.length,
      isGoing: going.includes(userId),
      friendsGoing: going
        .filter((id) => friends.has(id) && friendNames.has(id))
        .map((id) => ({ id, name: friendNames.get(id) })),
      distance_km: distanceKm(me.lat, me.lng, event.lat, event.lng),
    }
  })

  return { me, events: enriched }
}
