-- I Don't Want to Go Alone — database schema.
-- Fresh project: run this in the Supabase SQL editor, then migrations/003_auth.sql
-- (accounts and access rules), then seed.sql.
-- Existing project: don't run this; run the migrations in order instead.

create table users (
  id uuid primary key,
  name text not null,
  role text,
  interests text[] not null default '{}',
  area text,
  lat float,
  lng float,
  invited_by uuid references users (id) on delete set null,
  is_demo bool not null default false,
  created_at timestamptz not null default now()
);

create table invites (
  code text primary key,
  owner_id uuid references users (id) on delete cascade,
  used_by uuid references users (id) on delete set null,
  reusable bool not null default false
);

create table connections (
  user_id uuid not null references users (id) on delete cascade,
  connected_user_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, connected_user_id)
);

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  tags text[] not null default '{}',
  format text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue text,
  lat float,
  lng float,
  url text,
  created_by uuid references users (id) on delete set null,
  is_user_created bool not null default false,
  created_at timestamptz not null default now()
);

create table attendances (
  user_id uuid not null references users (id) on delete cascade,
  event_id uuid not null references events (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  text text not null,
  flagged bool not null default false,
  flag_category text,
  flag_reason text,
  created_at timestamptz not null default now()
);

-- 1:1 messages between connected members (Friends -> Message). Same moderation flow.
create table direct_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  to_user uuid not null references users (id) on delete cascade,
  text text not null,
  flagged bool not null default false,
  flag_category text,
  flag_reason text,
  created_at timestamptz not null default now()
);

create table blocks (
  blocker_id uuid not null references users (id) on delete cascade,
  blocked_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references users (id) on delete cascade,
  reported_id uuid not null references users (id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table ratings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  from_user uuid not null references users (id) on delete cascade,
  to_user uuid not null references users (id) on delete cascade,
  stars smallint not null constraint ratings_stars_range check (stars between 1 and 5),
  would_go_again bool, -- legacy yes/no answer, no longer asked
  created_at timestamptz not null default now(),
  unique (event_id, from_user, to_user)
);
create index ratings_to_user_idx on ratings (to_user);

create index on messages (event_id, created_at);
create index on attendances (event_id);
create index on direct_messages (to_user, created_at);

-- Row level security on: nothing is readable or writable until migrations/003_auth.sql
-- adds the access rules.
do $$
declare t text;
begin
  foreach t in array array['users','invites','connections','events','attendances','messages','direct_messages','blocks','reports','ratings']
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- Realtime for the chats (inserts, and updates when moderation flags a message).
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table direct_messages;
