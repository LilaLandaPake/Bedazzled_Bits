export const DEMO_INVITE_CODE = 'JURY2026'

export const INTERESTS = [
  'AI & Tech',
  'Design & UX',
  'Entrepreneurship',
  'Coding',
  'Data & Analytics',
  'Languages',
  'Career & Leadership',
  'Creative Writing',
]

// Barcelona neighbourhoods offered in onboarding, with approximate centre points.
export const AREAS = [
  { name: 'Ciutat Vella', lat: 41.3833, lng: 2.1777 },
  { name: 'Eixample', lat: 41.3917, lng: 2.1649 },
  { name: 'Gràcia', lat: 41.4036, lng: 2.1561 },
  { name: 'Poblenou', lat: 41.4036, lng: 2.2003 },
  { name: 'Sant Antoni', lat: 41.3781, lng: 2.1617 },
  { name: 'Sants', lat: 41.3755, lng: 2.1366 },
  { name: 'Les Corts', lat: 41.3851, lng: 2.1311 },
  { name: 'Sant Martí', lat: 41.4145, lng: 2.1989 },
  { name: 'Horta-Guinardó', lat: 41.4183, lng: 2.1675 },
  { name: 'Sarrià-Sant Gervasi', lat: 41.4005, lng: 2.1345 },
]

export const REPORT_CATEGORIES = [
  { id: 'harassment', label: 'Harassment or disrespect', description: 'Insults, persistent unwanted contact, humiliating treatment' },
  { id: 'private_place', label: 'Pressure to meet somewhere private', description: "Wanting to meet away from the event or at someone's home" },
  { id: 'off_platform', label: 'Asked to move to another app', description: 'Insisting on continuing on WhatsApp, Instagram, etc.' },
  { id: 'money', label: 'Asked for money or tried to sell something', description: 'Requesting money, selling products or services' },
  { id: 'personal_data', label: 'Asked for or shared personal data', description: "Asking for an address or phone number, or sharing someone else's details" },
  { id: 'fake_profile', label: 'Fake profile or false identity', description: "Not who she says she is, or using someone else's photos" },
  { id: 'inappropriate', label: 'Sexual or inappropriate content', description: 'Messages or images that are out of place' },
  { id: 'hate', label: 'Hate speech or discrimination', description: 'Racist, homophobic or similar comments' },
  { id: 'unsafe_in_person', label: 'Made me feel unsafe at the event', description: 'In-person behaviour during the meetup' },
  { id: 'other', label: 'Something else', description: 'Any other case, with a required description' },
]

// Categories the moderation AI may return (subset of the report categories).
export const MODERATION_CATEGORIES = [
  'private_place',
  'off_platform',
  'money',
  'personal_data',
  'harassment',
  'inappropriate',
  'hate',
  'unsafe_in_person',
]

export const categoryLabel = (id) => REPORT_CATEGORIES.find((c) => c.id === id)?.label ?? 'Something else'
