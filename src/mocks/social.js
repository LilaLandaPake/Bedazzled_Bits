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

// Mirrors the `attendances` table. Spread so friend badges show on most events.
export const attendances = [
  [lila, e.hackathon],
  [marta, e.hackathon],
  [aisha, e.hackathon],
  [lila, e.aiTalk],
  [aisha, e.aiTalk],
  [nuria, e.aiTalk],
  [marta, e.uxWorkshop],
  [camille, e.uxWorkshop],
  [aisha, e.dataMeetup],
  [sofia, e.pitchNight],
  [marta, e.pitchNight],
  [camille, e.writingCircle],
  [sofia, e.languageExchange],
  [camille, e.languageExchange],
  [lila, e.reactStudy],
  [nuria, e.reactStudy],
].map(([user_id, event_id]) => ({ user_id, event_id, created_at: '2026-10-05T12:00:00Z' }))

// Mirrors the `messages` table. One flagged example shows the AI safety banner.
export const messages = [
  {
    id: 'f0000000-0000-4000-8000-000000000001',
    event_id: e.aiTalk,
    user_id: aisha,
    text: 'Hi! Anyone want to meet at the entrance 10 minutes before?',
    flagged: false,
    flag_category: null,
    flag_reason: null,
    created_at: '2026-10-08T18:00:00Z',
  },
  {
    id: 'f0000000-0000-4000-8000-000000000002',
    event_id: e.aiTalk,
    user_id: lila,
    text: "Yes! I'll be there at 18:50 with a pink tote bag.",
    flagged: false,
    flag_category: null,
    flag_reason: null,
    created_at: '2026-10-08T18:04:00Z',
  },
  {
    id: 'f0000000-0000-4000-8000-000000000003',
    event_id: e.aiTalk,
    user_id: nuria,
    text: 'Easier to chat on WhatsApp, can someone send me their number?',
    flagged: true,
    flag_category: 'off_platform',
    flag_reason: 'Asks to move the conversation to another app and share a phone number.',
    created_at: '2026-10-08T18:10:00Z',
  },
]

// Mirrors `blocks`, `reports` and `ratings`. Empty by default.
export const blocks = []
export const reports = []
export const ratings = []
