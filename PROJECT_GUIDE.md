# I Don't Want to Go Alone — project guide

Read this file fully before changing anything.

## What we are building

A mobile-first web app where women find other women to go with to learning events
(talks, workshops, courses) in Barcelona. Entry is invite-only: every member is vouched
for by an existing member. Members can also publish events (both internal meetup ideas
and external workshops they want company for). The app leverages friend networks so women
feel encouraged to go when someone they know or were referred by is attending.

The AI has two jobs: recommending events and flagging risky chat messages. The jury will
use the app on their own, with no presentation, so every screen must be self-explanatory
and nothing may crash.

## Stack

Already in the repo:
- React 19 with JSX. **No TypeScript.**
- Vite 8 (`@vitejs/plugin-react`, config in `vite.config.js`)
- Tailwind CSS 4 through `@tailwindcss/vite`. There is no `tailwind.config.js`; global styles are in `src/index.css`.
- lucide-react for icons
- oxlint (`.oxlintrc.json`), npm

Dependencies to add:
- `react-router-dom` for routing
- `@supabase/supabase-js` for the database and realtime chat
- Vercel serverless functions in `/api` for the AI calls

Commands: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`.
Vite alone does not serve `/api`. To test AI endpoints locally, run `vercel dev`.

## Rules for Claude

- Do not add libraries beyond the ones listed above without explicit permission.
- The AI API key lives only in `/api` functions, read from `process.env`. Never import it in `src/`.
- Only env vars starting with `VITE_` reach the browser: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The AI key must not have that prefix.
- Use the shared components in `src/components/ui/`. Do not restyle them locally.
- Mobile-first: design for a 380px wide screen, content in a centered column of max 480px.
- Use mock data from `src/mocks/` that matches the data model exactly whenever backend data is missing.
- Every screen needs a loading state, an empty state and an error state.
- Before every commit: `npm run lint` and `npm run build` must pass.
- UI text is in English.

## Folder layout


```

src/
App.jsx                 routes
components/ui/          Button, Card, Chip, Avatar, Header, BottomNav
lib/
supabase.js           Supabase client
session.js            current user (localStorage)
distance.js           distance in km between two lat/lng points
features/
onboarding/           invite code, name, interests, area
profile/              my profile, my invites, my network, other users' profiles
events/               feed, create event modal/page, event detail, attendees
chat/                 event chat
safety/               block, report, rating
mocks/                  mock data matching the data model
api/
recommend.js
moderate.js
supabase/
schema.sql
seed.sql

```

## Routes

| Route | Screen | What it displays |
|---|---|---|
| `/` | Welcome and invite code | Welcome splash, demo code display, code entry |
| `/onboarding` | Onboarding form | Name, role, interests, area setup |
| `/events` | Recommended events feed | AI recommendations, filter by tag, friend encouragement badges |
| `/events/new` | Publish a new event | Create event form (internal idea or external URL) |
| `/events/:id` | Event detail | Event info, attendee list (revealed after joining), friend badges, join action |
| `/events/:id/chat` | Event chat | Realtime chat with live AI safety warning flags |
| `/events/:id/rate` | Member ratings | Post-event "Would you go with her again?" ratings |
| `/profile` | My profile & network | User stats, invite code generator, network list |
| `/u/:id` | Other member profile | User bio, vouch source, direct action buttons (Block / Report) |

## Session & Network Model

There is no real authentication. After a valid invite code and onboarding, the user id
is stored in localStorage under `idwtga_user_id`. `src/lib/session.js` exposes
`getCurrentUser()`, `setCurrentUser(id)` and `clearSession()`.

The demo invite code `JURY2026` is reusable and shown on the welcome screen.

**Network connections:**
When User B redeems an invite code owned by User A, a bidirectional connection in the `connections` table is created automatically (`(A, B)` and `(B, A)`). Users can also add connections directly from another member's profile page (`/u/:id`).

## Data model (Supabase)

```sql
users        id uuid pk, name text, role text, interests text[], area text,
             lat float, lng float, invited_by uuid, is_demo bool, created_at timestamptz
invites      code text pk, owner_id uuid, used_by uuid, reusable bool
connections  user_id uuid, connected_user_id uuid, created_at timestamptz,
             (pk: user_id + connected_user_id)
events       id uuid pk, title text, description text, tags text[],
             starts_at timestamptz, venue text, lat float, lng float,
             url text, created_by uuid (fk users.id), is_user_created bool default false,
             created_at timestamptz
attendances  user_id uuid, event_id uuid, created_at timestamptz (pk: user_id + event_id)
messages     id uuid pk, event_id uuid, user_id uuid, text text,
             flagged bool default false, flag_category text, flag_reason text, created_at timestamptz
blocks       blocker_id uuid, blocked_id uuid, created_at timestamptz (pk: both)
reports      id uuid pk, reporter_id uuid, reported_id uuid, reason text,
             details text, status text default 'pending', created_at timestamptz
ratings      id uuid pk, event_id uuid, from_user uuid, to_user uuid,
             would_go_again bool, created_at timestamptz

```

## Theme & Styling System

The app defaults to the **Nit (Dark Theme)** palette configured directly inside `src/index.css`:

```css
@import "tailwindcss";

:root {
  --bg-main: #170A2B;
  --bg-card: #25143E;
  --primary: #FF2D9A;
  --accent-purple: #A78BFA;
  --accent-gold: #FFB703;
  --text-main: #FFF6EC;
}

body {
  background-color: var(--bg-main);
  color: var(--text-main);
}

```

* **Background:** `#170A2B` (Dark Purple)
* **Cards & Surfaces:** `#25143E` (Slightly lighter purple)
* **Primary CTAs / Buttons:** `#FF2D9A` (Hot Pink)
* **Secondary / Tags:** `#A78BFA` (Soft Purple)
* **Highlight Badges (AI / Friends):** `#FFB703` (Warm Gold)
* **Text & Light Surfaces:** `#FFF6EC` (Off-white)

## Fixed Lists & System Taxonomy

### Interests & Tags

* `AI & Tech`
* `Design & UX`
* `Entrepreneurship`
* `Coding`
* `Data & Analytics`
* `Languages`
* `Career & Leadership`
* `Creative Writing`

### Report Categories & Identifiers

| Identifier | Label in the app | Description / Coverage |
| --- | --- | --- |
| `harassment` | Harassment or disrespect | Insults, persistent unwanted contact, humiliating treatment |
| `private_place` | Pressure to meet somewhere private | Wanting to meet away from the event or at someone's home |
| `off_platform` | Asked to move to another app | Insisting on continuing on WhatsApp, Instagram, etc. |
| `money` | Asked for money or tried to sell something | Requesting money, selling products or services |
| `personal_data` | Asked for or shared personal data | Asking for an address or phone number, or sharing someone else's details |
| `fake_profile` | Fake profile or false identity | Not who she says she is, or using someone else's photos |
| `inappropriate` | Sexual or inappropriate content | Messages or images that are out of place |
| `hate` | Hate speech or discrimination | Racist, homophobic or similar comments |
| `unsafe_in_person` | Made me feel unsafe at the event | In-person behaviour during the meetup |
| `other` | Something else | Any other case, with a required description |

## Behaviour rules

* **Friend Encouragement & Social Proof:**
* On the event card in `/events` and top of `/events/:id`, if any user in `connections` for `getCurrentUser()` is in `attendances` for that event, display a highlighted badge: e.g., *"Lila is going"* or *"Lila and 1 other friend are going"*.


* **Attendees:** the event page always shows the count ("4 women are going"). The full list of who is going is shown only after the current user has joined.
* **Event Creation:** Any user can post an event at `/events/new`. They provide a title, description, tags, venue/location, date/time, and an optional external event link (`url`).
* **Block:** instant, no reason asked. Both users stop seeing each other's profile and messages. Nothing happens to the blocked user.
* **Report:** requires a reason from the fixed list plus optional details. Saved with status `pending`. No automatic sanction.
* **Rating:** private. One question per person met: "Would you go with her again?"
* **Safety wording:** say "vouched" or "verified". Never say "100% safe".

## API contracts

### `POST /api/recommend`

Request:

```json
{
  "user": { "interests": ["AI & Tech"], "lat": 41.39, "lng": 2.16 },
  "events": [
    { "id": "...", "title": "...", "tags": ["AI & Tech"], "starts_at": "...", "distance_km": 1.2 }
  ]
}

```

Response, ordered best first:

```json
{
  "recommendations": [
    { "event_id": "...", "reason": "Matches your interest in AI & Tech and is 15 minutes away." }
  ]
}

```

Fallback: if the call fails or takes more than 6 seconds, sort in the browser by number of
shared tags, then by distance, and show no reason line. The feed must never be empty because of the AI.

### `POST /api/moderate`

Request:

```json
{ "text": "let's meet at my place first", "recent": ["previous message", "..."] }

```

Response:

```json
{
  "flagged": true,
  "category": "private_place",
  "reason": "Suggests meeting somewhere private instead of at the event."
}

```

Categories: `private_place`, `off_platform`, `money`, `personal_data`, `harassment`, `inappropriate`, `hate`, `unsafe_in_person`.

Flow: save the message first, then call moderation, then update `flagged`. A flagged message
stays visible with a warning banner for the other members. If moderation fails, the message
is sent normally. Sending must never be blocked by the AI.

## Demo requirements

* Seed data: real upcoming learning events in Barcelona, user-created sample events, plus the hackathon itself as an event.
* Sample profiles are marked `is_demo = true`.
* Pre-populate network connections between demo users so friend badges ("Lila is going") appear immediately in the feed.
* A visible demo button on the event page: "Simulate event finished", which opens the rating screen.
* Test the full flow on two real phones at the same time before the feature freeze.
* Feature freeze two hours before the deadline. After that: bugs, seed data and polish only.

## Out of scope

Real identity verification, push notifications, payments, native app, admin panel.

