import { DEMO_INVITE_CODE } from '../lib/constants.js'
import { MOCK_EVENT_IDS } from './events.js'
import { MOCK_USER_IDS } from './users.js'

const { lila, marta, aisha, sofia, nuria, camille } = MOCK_USER_IDS
const e = MOCK_EVENT_IDS

// Mirrors the `invites` table.
export const invites = [
  { code: DEMO_INVITE_CODE, owner_id: lila, used_by: null, reusable: true },
  { code: 'LILA-7Q2K', owner_id: lila, used_by: marta, reusable: false },
  { code: 'LILA-3XW9', owner_id: lila, used_by: aisha, reusable: false },
  { code: 'MART-8HDE', owner_id: marta, used_by: sofia, reusable: false },
  { code: 'AISH-5PLM', owner_id: aisha, used_by: nuria, reusable: false },
  { code: 'SOFI-2RTB', owner_id: sofia, used_by: camille, reusable: false },
]

// Mirrors the `connections` table: every friendship is stored in both directions.
const pairs = [
  [lila, marta],
  [lila, aisha],
  [marta, sofia],
  [aisha, nuria],
  [sofia, camille],
  [marta, aisha],
  [nuria, lila],
]

export const connections = pairs.flatMap(([a, b]) => [
  { user_id: a, connected_user_id: b, created_at: '2026-09-15T10:00:00Z' },
  { user_id: b, connected_user_id: a, created_at: '2026-09-15T10:00:00Z' },
])

// Mirrors the `attendances` table. Spread so friend badges show on most events; the
// dates feed the "For you" activity ("Lila is going · 2h ago").
export const attendances = [
  [lila, e.hackathon, '2026-10-10T07:30:00Z'],
  [marta, e.hackathon, '2026-10-09T16:00:00Z'],
  [aisha, e.hackathon, '2026-10-08T11:20:00Z'],
  [nuria, e.hackathon, '2026-10-07T19:45:00Z'],
  [lila, e.aiTalk, '2026-10-06T09:10:00Z'],
  [aisha, e.aiTalk, '2026-10-05T12:00:00Z'],
  [nuria, e.aiTalk, '2026-10-09T21:30:00Z'],
  [marta, e.uxWorkshop, '2026-10-08T08:15:00Z'],
  [camille, e.uxWorkshop, '2026-10-06T17:40:00Z'],
  [aisha, e.dataMeetup, '2026-10-04T10:00:00Z'],
  [sofia, e.pitchNight, '2026-10-03T18:00:00Z'],
  [marta, e.pitchNight, '2026-10-09T10:30:00Z'],
  [camille, e.writingCircle, '2026-10-01T08:00:00Z'],
  [sofia, e.languageExchange, '2026-10-02T12:00:00Z'],
  [camille, e.languageExchange, '2026-10-05T20:00:00Z'],
  [lila, e.reactStudy, '2026-10-03T19:00:00Z'],
  [nuria, e.reactStudy, '2026-10-08T22:10:00Z'],
].map(([user_id, event_id, created_at]) => ({ user_id, event_id, created_at }))

const message = (n, event_id, user_id, text, created_at, flag) => ({
  id: `f0000000-0000-4000-8000-00000000000${n}`,
  event_id,
  user_id,
  text,
  flagged: Boolean(flag),
  flag_category: flag?.category ?? null,
  flag_reason: flag?.reason ?? null,
  created_at,
})

// Mirrors the `messages` table. Flagged examples show the AI safety banner.
export const messages = [
  message(1, e.aiTalk, aisha, 'Hi! Anyone want to meet at the entrance 10 minutes before?', '2026-10-08T18:00:00Z'),
  message(2, e.aiTalk, lila, "Yes! I'll be there at 18:50 with a pink tote bag.", '2026-10-08T18:04:00Z'),
  message(3, e.aiTalk, nuria, 'Easier to chat on WhatsApp, can someone send me their number?', '2026-10-08T18:10:00Z', {
    category: 'off_platform',
    reason: 'Asks to move the conversation to another app and share a phone number.',
  }),
  message(4, e.hackathon, lila, 'First time at a hackathon — anyone want to meet at the entrance?', '2026-10-10T07:40:00Z'),
  message(5, e.hackathon, aisha, "Yes! I'll be there 10 min early.", '2026-10-10T07:44:00Z'),
  message(6, e.hackathon, marta, "Let's meet at my place first, it's close.", '2026-10-10T07:52:00Z', {
    category: 'private_place',
    reason: 'Suggests meeting somewhere private instead of at the event.',
  }),
]

// Mirrors the `direct_messages` table (1:1 chats between connected members).
export const direct_messages = [
  {
    id: 'd0000000-0000-4000-8000-000000000001',
    user_id: lila,
    to_user: marta,
    text: 'Are you going to the hackathon? I signed up!',
    flagged: false,
    flag_category: null,
    flag_reason: null,
    created_at: '2026-10-09T15:00:00Z',
  },
]

// Mirrors `blocks`, `reports` and `ratings`. Empty by default.
export const blocks = []
export const reports = []
export const ratings = []
