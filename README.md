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
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql), then [`supabase/seed.sql`](supabase/seed.sql).
3. Put the project URL and anon key in `.env.local` (and in Vercel).

**Already have a database from an earlier version?** Run
[`supabase/migrations/001_figma_handoff.sql`](supabase/migrations/001_figma_handoff.sql) once, then
`seed.sql` again. It adds event formats and end times, the `direct_messages` table (with realtime),
and maps old interest tags to the new list.

`seed.sql` is generated from `src/mocks`. After changing the mocks, run `npm run seed:sql`.

> There is no real authentication: the anon key can read and write every table. That is
> acceptable for the hackathon demo only.

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
