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
| `ANTHROPIC_API_KEY` | `/api` only | Claude key for recommendations and moderation. **Never prefix with `VITE_`.** |
| `ANTHROPIC_MODEL` | `/api` only | Optional. Defaults to `claude-haiku-4-5` (fast enough for the 6 s limit). |

## Set up Supabase

1. Create a project at supabase.com.
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql), then [`supabase/seed.sql`](supabase/seed.sql).
3. Put the project URL and anon key in `.env.local` (and in Vercel).

`seed.sql` is generated from `src/mocks`. After changing the mocks, run `npm run seed:sql`.

> There is no real authentication: the anon key can read and write every table. That is
> acceptable for the hackathon demo only.

## Deploy to Vercel

1. Import the repo in Vercel (framework preset: Vite).
2. Add the four environment variables above.
3. Deploy. `vercel.json` sends every non-`/api` path to the app so links like `/events/…` work on reload.

Set a monthly spend limit on the Anthropic account: `/api/recommend` and `/api/moderate`
are public endpoints.

## Before every commit

```bash
npm run lint
npm run build
```

## Stack

React 19 (JSX), Vite 8, Tailwind CSS 4, React Router, Supabase (database + realtime),
lucide-react icons, Vercel serverless functions calling Claude.
