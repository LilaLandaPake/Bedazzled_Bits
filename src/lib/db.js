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
  return d
}

// The current user plus who she's connected to and who she has blocked / been blocked by.
// Blocked members are removed from `friends` and hidden from attendee lists.
async function socialContext(userId) {
  let me, friendIds, blocks
  if (supabase) {
    const [meRes, linksRes, blocksRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).maybeSingle(),
      supabase.from('connections').select('connected_user_id').eq('user_id', userId),
      supabase.from('blocks').select('*').or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
    ])
    if ([meRes, linksRes, blocksRes].some((r) => r.error)) throw new Error(NETWORK_ERROR)
    me = meRes.data
    friendIds = linksRes.data.map((l) => l.connected_user_id)
    blocks = blocksRes.data
  } else {
    me = mockDb.users.find((u) => u.id === userId) ?? null
    friendIds = mockDb.connections.filter((c) => c.user_id === userId).map((c) => c.connected_user_id)
    blocks = mockDb.blocks.filter((b) => b.blocker_id === userId || b.blocked_id === userId)
  }
  const blocked = new Set(blocks.flatMap((b) => [b.blocker_id, b.blocked_id]))
  blocked.delete(userId)
  const friends = new Set(friendIds.filter((id) => !blocked.has(id)))
  return { me, friends, blocked }
}

async function usersByIds(ids) {
  if (!ids.length) return []
  if (supabase) {
    const { data, error } = await supabase.from('users').select('*').in('id', ids)
    if (error) throw new Error(NETWORK_ERROR)
    return data
  }
  const set = new Set(ids)
  return mockDb.users.filter((u) => set.has(u.id))
}

// Adds attendeeCount, isGoing, friendsGoing and distance_km to an event.
function enrich(event, goingIds, ctx, people) {
  return {
    ...event,
    attendeeCount: goingIds.length,
    isGoing: goingIds.includes(ctx.me.id),
    friendsGoing: goingIds
      .filter((id) => ctx.friends.has(id) && people.has(id))
      .map((id) => ({ id, name: people.get(id).name })),
    distance_km: distanceKm(ctx.me.lat, ctx.me.lng, event.lat, event.lng),
  }
}

// Everything the feed needs in one call: the current user and upcoming events, each
// enriched as above.
export async function getFeed(userId) {
  let events, attendances
  const ctx = await socialContext(userId)
  if (!ctx.me) return { me: null, events: [] }

  if (supabase) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('starts_at', startOfToday().toISOString())
      .order('starts_at')
    if (error) throw new Error(NETWORK_ERROR)
    events = data
    const ids = events.map((e) => e.id)
    const att = ids.length ? await supabase.from('attendances').select('user_id, event_id').in('event_id', ids) : { data: [] }
    if (att.error) throw new Error(NETWORK_ERROR)
    attendances = att.data
  } else {
    await mockDelay()
    const from = startOfToday()
    events = mockDb.events
      .filter((e) => new Date(e.starts_at) >= from)
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
    attendances = mockDb.attendances
  }

  const friendRows = await usersByIds([...ctx.friends])
  const people = new Map(friendRows.map((u) => [u.id, u]))
  const enriched = events.map((event) =>
    enrich(
      event,
      attendances.filter((a) => a.event_id === event.id).map((a) => a.user_id),
      ctx,
      people,
    ),
  )
  return { me: ctx.me, events: enriched }
}

// One event with its creator and attendee list. `attendees` is only filled once the
// current user has joined (the guide: the list is revealed after joining).
// Returns { me, event: null } when the event doesn't exist.
export async function getEvent(eventId, userId) {
  const ctx = await socialContext(userId)
  if (!ctx.me) return { me: null, event: null }

  let event, goingIds
  if (supabase) {
    const [eventRes, attRes] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).maybeSingle(),
      supabase.from('attendances').select('user_id, created_at').eq('event_id', eventId).order('created_at'),
    ])
    // An id that isn't a valid uuid makes Postgres error: treat it as "not found".
    if (eventRes.error?.code === '22P02') return { me: ctx.me, event: null }
    if (eventRes.error || attRes.error) throw new Error(NETWORK_ERROR)
    event = eventRes.data
    goingIds = attRes.data.map((a) => a.user_id)
  } else {
    await mockDelay()
    event = mockDb.events.find((e) => e.id === eventId) ?? null
    goingIds = mockDb.attendances.filter((a) => a.event_id === eventId).map((a) => a.user_id)
  }
  if (!event) return { me: ctx.me, event: null }

  const rows = await usersByIds([...new Set([...goingIds, event.created_by].filter(Boolean))])
  const people = new Map(rows.map((u) => [u.id, u]))
  const enriched = enrich(event, goingIds, ctx, people)

  const creator = people.get(event.created_by)
  enriched.creator = creator && !ctx.blocked.has(creator.id) ? { id: creator.id, name: creator.name } : null
  enriched.attendees = enriched.isGoing
    ? goingIds
        .filter((id) => !ctx.blocked.has(id) && people.has(id))
        .map((id) => {
          const u = people.get(id)
          return { id, name: u.name, role: u.role, isMe: id === userId, isFriend: ctx.friends.has(id) }
        })
    : []
  return { me: ctx.me, event: enriched }
}

export async function joinEvent(eventId, userId) {
  const row = { user_id: userId, event_id: eventId, created_at: new Date().toISOString() }
  if (supabase) {
    const { error } = await supabase.from('attendances').upsert(row, { ignoreDuplicates: true })
    if (error) throw new Error("We couldn't save that. Please try again.")
    return
  }
  await mockDelay(200)
  if (!mockDb.attendances.some((a) => a.user_id === userId && a.event_id === eventId)) {
    mockDb.attendances.push(row)
    saveMockDb()
  }
}

export async function leaveEvent(eventId, userId) {
  if (supabase) {
    const { error } = await supabase.from('attendances').delete().eq('user_id', userId).eq('event_id', eventId)
    if (error) throw new Error("We couldn't save that. Please try again.")
    return
  }
  await mockDelay(200)
  mockDb.attendances = mockDb.attendances.filter((a) => !(a.user_id === userId && a.event_id === eventId))
  saveMockDb()
}

// Publishes a member's event and signs her up for it. Returns the new event.
export async function createEvent({ title, description, tags, starts_at, venue, area, url }, userId) {
  const point = AREAS.find((a) => a.name === area)
  const event = {
    id: uuid(),
    title: title.trim(),
    description: description.trim(),
    tags,
    starts_at,
    venue: venue.trim() ? `${venue.trim()}, ${area}` : `${area}, Barcelona`,
    lat: point?.lat ?? null,
    lng: point?.lng ?? null,
    url: url || null,
    created_by: userId,
    is_user_created: true,
    created_at: new Date().toISOString(),
  }

  if (supabase) {
    const { error } = await supabase.from('events').insert(event)
    if (error) throw new Error("We couldn't publish your event. Please try again.")
  } else {
    await mockDelay()
    mockDb.events.push(event)
    saveMockDb()
  }
  // The creator wants company, so she's going. Not fatal if it fails.
  await joinEvent(event.id, userId).catch(() => {})
  return event
}

// ---------- Chat ----------

// Mock mode has no server, so live updates are shared between tabs of the same browser.
const mockChannel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('idwtga_chat') : null

// The chat for one event: whether the user may take part (only attendees) and the
// messages, minus those from blocked members. `people` maps user id -> { name }.
export async function getChat(eventId, userId) {
  const ctx = await socialContext(userId)
  if (!ctx.me) return { me: null }

  let event, goingIds, messages
  if (supabase) {
    const [eventRes, attRes, msgRes] = await Promise.all([
      supabase.from('events').select('id, title').eq('id', eventId).maybeSingle(),
      supabase.from('attendances').select('user_id').eq('event_id', eventId),
      supabase.from('messages').select('*').eq('event_id', eventId).order('created_at').limit(200),
    ])
    if (eventRes.error?.code === '22P02') return { me: ctx.me, event: null }
    if ([eventRes, attRes, msgRes].some((r) => r.error)) throw new Error(NETWORK_ERROR)
    event = eventRes.data
    goingIds = attRes.data.map((a) => a.user_id)
    messages = msgRes.data
  } else {
    await mockDelay()
    event = mockDb.events.find((e) => e.id === eventId) ?? null
    goingIds = mockDb.attendances.filter((a) => a.event_id === eventId).map((a) => a.user_id)
    messages = mockDb.messages
      .filter((m) => m.event_id === eventId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }
  if (!event) return { me: ctx.me, event: null }

  const rows = await usersByIds([...new Set([...goingIds, ...messages.map((m) => m.user_id)])])
  const people = Object.fromEntries(rows.map((u) => [u.id, { name: u.name }]))
  return {
    me: ctx.me,
    event,
    isGoing: goingIds.includes(userId),
    blocked: ctx.blocked,
    messages: messages.filter((m) => !ctx.blocked.has(m.user_id)),
    people,
  }
}

// Saves a message. The id is created here so the live echo can be matched to it.
export async function sendMessage(eventId, userId, text) {
  const message = {
    id: uuid(),
    event_id: eventId,
    user_id: userId,
    text: text.trim(),
    flagged: false,
    flag_category: null,
    flag_reason: null,
    created_at: new Date().toISOString(),
  }
  if (supabase) {
    const { error } = await supabase.from('messages').insert(message)
    if (error) throw new Error('Message not sent.')
    return message
  }
  await mockDelay(150)
  mockDb.messages.push(message)
  saveMockDb()
  mockChannel?.postMessage(message)
  return message
}

// Marks a message as flagged by the AI moderator. Returns the updated message.
export async function flagMessage(message, { category, reason }) {
  const patch = { flagged: true, flag_category: category, flag_reason: reason }
  if (supabase) {
    const { error } = await supabase.from('messages').update(patch).eq('id', message.id)
    if (error) throw new Error(NETWORK_ERROR)
  } else {
    const stored = mockDb.messages.find((m) => m.id === message.id)
    if (stored) Object.assign(stored, patch)
    saveMockDb()
  }
  const updated = { ...message, ...patch }
  mockChannel?.postMessage(updated)
  return updated
}

// Calls onMessage(message) for every new or updated message in the event's chat.
// Returns an unsubscribe function.
export function subscribeToChat(eventId, onMessage) {
  if (supabase) {
    const filter = `event_id=eq.${eventId}`
    const channel = supabase
      .channel(`chat:${eventId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter }, (p) => onMessage(p.new))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter }, (p) => onMessage(p.new))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }
  if (!mockChannel) return () => {}
  const listener = ({ data }) => {
    if (data?.event_id !== eventId) return
    // Keep this tab's copy in sync too.
    const stored = mockDb.messages.find((m) => m.id === data.id)
    if (stored) Object.assign(stored, data)
    else mockDb.messages.push(data)
    onMessage(data)
  }
  mockChannel.addEventListener('message', listener)
  return () => mockChannel.removeEventListener('message', listener)
}

// ---------- Members & safety ----------

const SAVE_ERROR = "We couldn't save that. Please try again."

// Another member's profile as seen by `viewerId`. `member` is null when she doesn't exist
// or has blocked the viewer (blocked members stop seeing each other).
export async function getMember(viewerId, memberId) {
  const ctx = await socialContext(viewerId)
  if (!ctx.me) return { me: null }
  // Postgres rejects malformed uuids; treat them as "not found".
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberId)) {
    return { me: ctx.me, member: null }
  }

  let iBlocked = false
  let blockedMe = false
  if (supabase) {
    const { data, error } = await supabase
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`and(blocker_id.eq.${viewerId},blocked_id.eq.${memberId}),and(blocker_id.eq.${memberId},blocked_id.eq.${viewerId})`)
    if (error) throw new Error(NETWORK_ERROR)
    iBlocked = data.some((b) => b.blocker_id === viewerId)
    blockedMe = data.some((b) => b.blocker_id === memberId)
  } else {
    await mockDelay()
    iBlocked = mockDb.blocks.some((b) => b.blocker_id === viewerId && b.blocked_id === memberId)
    blockedMe = mockDb.blocks.some((b) => b.blocker_id === memberId && b.blocked_id === viewerId)
  }

  const member = blockedMe ? null : await getUser(memberId)
  if (!member) return { me: ctx.me, member: null }

  const voucher = member.invited_by ? await getUser(member.invited_by).catch(() => null) : null
  return {
    me: ctx.me,
    member,
    voucher: voucher && !ctx.blocked.has(voucher.id) ? { id: voucher.id, name: voucher.name } : null,
    isConnected: ctx.friends.has(memberId),
    iBlocked,
  }
}

export async function connectWith(userId, otherId) {
  const now = new Date().toISOString()
  const rows = [
    { user_id: userId, connected_user_id: otherId, created_at: now },
    { user_id: otherId, connected_user_id: userId, created_at: now },
  ]
  if (supabase) {
    const { error } = await supabase.from('connections').upsert(rows, { ignoreDuplicates: true })
    if (error) throw new Error(SAVE_ERROR)
    return
  }
  await mockDelay(200)
  for (const row of rows) {
    if (!mockDb.connections.some((c) => c.user_id === row.user_id && c.connected_user_id === row.connected_user_id)) {
      mockDb.connections.push(row)
    }
  }
  saveMockDb()
}

// Instant, no reason asked. Nothing happens to the blocked member.
export async function blockUser(blockerId, blockedId) {
  const row = { blocker_id: blockerId, blocked_id: blockedId, created_at: new Date().toISOString() }
  if (supabase) {
    const { error } = await supabase.from('blocks').upsert(row, { ignoreDuplicates: true })
    if (error) throw new Error(SAVE_ERROR)
    return
  }
  await mockDelay(200)
  if (!mockDb.blocks.some((b) => b.blocker_id === blockerId && b.blocked_id === blockedId)) mockDb.blocks.push(row)
  saveMockDb()
}

export async function unblockUser(blockerId, blockedId) {
  if (supabase) {
    const { error } = await supabase.from('blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId)
    if (error) throw new Error(SAVE_ERROR)
    return
  }
  await mockDelay(200)
  mockDb.blocks = mockDb.blocks.filter((b) => !(b.blocker_id === blockerId && b.blocked_id === blockedId))
  saveMockDb()
}

// Saved as 'pending'. No automatic sanction.
export async function reportUser({ reporterId, reportedId, reason, details }) {
  const row = {
    id: uuid(),
    reporter_id: reporterId,
    reported_id: reportedId,
    reason,
    details: details.trim() || null,
    status: 'pending',
    created_at: new Date().toISOString(),
  }
  if (supabase) {
    const { error } = await supabase.from('reports').insert(row)
    if (error) throw new Error("We couldn't send your report. Please try again.")
    return
  }
  await mockDelay()
  mockDb.reports.push(row)
  saveMockDb()
}

// ---------- Ratings ----------

// The women to rate after an event (other attendees, minus blocked) and the answers
// already given. `answers` maps to_user -> would_go_again.
export async function getRatingSheet(eventId, userId) {
  const { me, event } = await getEvent(eventId, userId)
  if (!me || !event) return { me, event }

  let existing
  if (supabase) {
    const { data, error } = await supabase
      .from('ratings')
      .select('to_user, would_go_again')
      .eq('event_id', eventId)
      .eq('from_user', userId)
    if (error) throw new Error(NETWORK_ERROR)
    existing = data
  } else {
    existing = mockDb.ratings.filter((r) => r.event_id === eventId && r.from_user === userId)
  }
  return {
    me,
    event,
    people: event.attendees.filter((a) => !a.isMe),
    answers: Object.fromEntries(existing.map((r) => [r.to_user, r.would_go_again])),
  }
}

// `answers` maps to_user -> true/false. Private: only the author can see them.
export async function saveRatings(eventId, fromUser, answers) {
  const now = new Date().toISOString()
  const rows = Object.entries(answers).map(([toUser, value]) => ({
    event_id: eventId,
    from_user: fromUser,
    to_user: toUser,
    would_go_again: value,
    created_at: now,
  }))
  if (!rows.length) return
  if (supabase) {
    const { error } = await supabase.from('ratings').upsert(rows, { onConflict: 'event_id,from_user,to_user' })
    if (error) throw new Error(SAVE_ERROR)
    return
  }
  await mockDelay()
  for (const row of rows) {
    const stored = mockDb.ratings.find(
      (r) => r.event_id === row.event_id && r.from_user === row.from_user && r.to_user === row.to_user,
    )
    if (stored) stored.would_go_again = row.would_go_again
    else mockDb.ratings.push({ id: uuid(), ...row })
  }
  saveMockDb()
}

// ---------- My profile ----------

// Unambiguous characters only (no 0/O, 1/I/L).
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function newInviteCode(name) {
  const prefix =
    name
      .normalize('NFD')
      .replace(/[^A-Za-z]/g, '')
      .toUpperCase()
      .slice(0, 4) || 'IDWT'
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  return `${prefix}-${[...bytes].map((b) => CODE_CHARS[b % CODE_CHARS.length]).join('')}`
}

// Profile page data: me, my network, my invites (with who used them) and my upcoming events.
export async function getMyProfile(userId) {
  const [feed, friends] = await Promise.all([getFeed(userId), getFriends(userId)])
  if (!feed.me) return { me: null }

  let invites
  if (supabase) {
    const { data, error } = await supabase.from('invites').select('*').eq('owner_id', userId)
    if (error) throw new Error(NETWORK_ERROR)
    invites = data
  } else {
    invites = mockDb.invites.filter((i) => i.owner_id === userId)
  }
  const usedBy = await usersByIds(invites.map((i) => i.used_by).filter(Boolean))
  const names = new Map(usedBy.map((u) => [u.id, u.name]))

  return {
    me: feed.me,
    friends,
    invites: invites
      .filter((i) => !i.reusable)
      .map((i) => ({ code: i.code, usedBy: i.used_by ? { id: i.used_by, name: names.get(i.used_by) ?? 'A member' } : null })),
    invitedCount: invites.filter((i) => i.used_by).length,
    going: feed.events.filter((e) => e.isGoing),
  }
}

// Creates a single-use invite code owned by the user. Returns the code.
export async function createInvite(user) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const invite = { code: newInviteCode(user.name), owner_id: user.id, used_by: null, reusable: false }
    if (supabase) {
      const { error } = await supabase.from('invites').insert(invite)
      if (!error) return invite.code
      if (error.code !== '23505') throw new Error("We couldn't create a code. Please try again.") // 23505 = taken
    } else {
      await mockDelay(200)
      if (mockDb.invites.some((i) => i.code === invite.code)) continue
      mockDb.invites.push(invite)
      saveMockDb()
      return invite.code
    }
  }
  throw new Error("We couldn't create a code. Please try again.")
}
