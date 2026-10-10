-- Upgrades a database created with an earlier schema.sql to the Figma handoff version.
-- Fresh projects don't need this: schema.sql already includes everything below.
-- Safe to run more than once.

-- Event format ("HACKATHON", "WORKSHOP") and end time ("19:00 – 21:00").
alter table events add column if not exists format text;
alter table events add column if not exists ends_at timestamptz;

-- 1:1 messages between connected members.
create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  to_user uuid not null references users (id) on delete cascade,
  text text not null,
  flagged bool not null default false,
  flag_category text,
  flag_reason text,
  created_at timestamptz not null default now()
);
create index if not exists direct_messages_to_user_created_at_idx on direct_messages (to_user, created_at);

alter table direct_messages enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'direct_messages' and policyname = 'demo anon access') then
    create policy "demo anon access" on direct_messages for all to anon using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'direct_messages'
  ) then
    alter publication supabase_realtime add table direct_messages;
  end if;
end $$;

-- New interest list: map the old tags on members and events.
create or replace function pg_temp.map_interests(tags text[]) returns text[] language sql as $$
  select coalesce(array_agg(distinct coalesce(m.new, t)), '{}')
  from unnest(tags) as t
  left join (values
    ('AI & Tech', 'AI and machine learning'),
    ('Design & UX', 'Design and UX'),
    ('Entrepreneurship', 'Entrepreneurship and startups'),
    ('Coding', 'Programming and web development'),
    ('Data & Analytics', 'Data and analytics'),
    ('Career & Leadership', 'Career and leadership'),
    ('Creative Writing', 'Art, culture and creativity')
  ) as m(old, new) on m.old = t
$$;

update users set interests = pg_temp.map_interests(interests);
update events set tags = pg_temp.map_interests(tags);

-- Then run seed.sql again: it adds the demo formats, end times and chat messages
-- for rows that don't exist yet (existing demo rows are left as they are).
