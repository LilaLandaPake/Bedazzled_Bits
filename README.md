# I Don't Want to Go Alone

A mobile-first web app where women in Barcelona find other women to go with to learning
events (talks, workshops, courses). Entry is invite-only: every member is vouched for by an
existing member. AI recommends events and flags risky chat messages.

**Jury demo code: `JURY2026`**

See [PROJECT_GUIDE.md](PROJECT_GUIDE.md) for the product rules, data model and API contracts.

## Run locally

```bash
npm install
npm run dev
```

Without any environment variables the app runs on **mock data** stored in your browser
(Profile → *Reset demo data* starts over). Chat messages are shared live between tabs of the
same browser, so two tabs signed in as different members can talk.

`npm run dev` does not serve `/api`, so AI features fall back: the feed is sorted by shared
interests and distance, and new chat messages aren't checked. To run the AI locally:

```bash
npx vercel dev
```

## Environment variables

Copy `.env.example` to `.env.local`.

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | browser | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | browser | Supabase anon key |
| `GEMINI_API_KEY` | `/api` only | Google Gemini key (free tier, from aistudio.google.com). **Never prefix with `VITE_`.** |
| `ANTHROPIC_API_KEY` | `/api` only | Alternative: Claude key (paid). Set one of the two AI keys. |
| `GEMINI_MODEL` / `ANTHROPIC_MODEL` | `/api` only | Optional. Defaults: `gemini-3.5-flash-lite` / `claude-haiku-4-5`. |
| `AI_PROVIDER` | `/api` only | Optional: `gemini` or `anthropic`, only if both keys are set. |

## Set up Supabase

1. Create a project at supabase.com.
2. **Authentication → Sign In / Providers → Email:** turn **off** "Confirm email". Members sign in
   with a username; it is stored as a hidden `<username>@members.idwtga.app` address and no email
   is ever sent.
3. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql), then
   [`supabase/migrations/003_auth.sql`](supabase/migrations/003_auth.sql), then [`supabase/seed.sql`](supabase/seed.sql).
4. Put the project URL and anon key in `.env.local` (and in Vercel).

**Already have a database from an earlier version?** Run the migrations you haven't run yet, in
order, then `seed.sql` again:

| File | Adds |
|---|---|
| [`001_figma_handoff.sql`](supabase/migrations/001_figma_handoff.sql) | Event formats and end times, `direct_messages`, new interest names |
| [`002_star_ratings.sql`](supabase/migrations/002_star_ratings.sql) | 1–5 star ratings |
| [`003_auth.sql`](supabase/migrations/003_auth.sql) | Username + password accounts and per-member access rules |

`seed.sql` is generated from `src/mocks`. After changing the mocks, run `npm run seed:sql`.

**Security.** Members sign in with a username and password through Supabase Auth; passwords
never touch the app's tables. Access rules (`003_auth.sql`) let each member act only as herself:
post only in chats of events she joined, message only friends, see only her own blocks, invites
and given ratings. Star averages and invite checks run in server-side functions. Visitors who
aren't signed in can't read any table. Known limits: the AI safety check runs in the sender's
browser (it can only ever add a flag), and passwords can't be reset yet. Demo members from
`seed.sql` have no login.

## Deploy to Vercel

1. Import the repo in Vercel (framework preset: Vite).
2. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and one AI key.
3. Deploy. `vercel.json` sends every non-`/api` path to the app so links like `/events/…` work on reload.

`/api/recommend` and `/api/moderate` are public endpoints: if you use a paid key, set a
monthly spend limit on that account.

## Before every commit

```bash
npm run lint
npm run build
```

## Stack

React 19 (JSX), Vite 8, Tailwind CSS 4, React Router, Supabase (database + realtime),
lucide-react icons, Vercel serverless functions calling Gemini or Claude.
