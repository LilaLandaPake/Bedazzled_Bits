-- Real accounts: username + password through Supabase Auth, and access rules so each member
-- can only act as herself. Replaces the open "demo anon access" rules.
--
-- Run after 001 and 002 (or after schema.sql on a fresh project), then run seed.sql.
-- Safe to run more than once.
--
-- Before using the app: Supabase dashboard -> Authentication -> Sign In / Providers -> Email:
-- turn OFF "Confirm email". Usernames are stored as <username>@members.idwtga.app behind the
-- scenes; no email is ever sent.

-- ---------- Usernames ----------

alter table users add column if not exists username text;
create unique index if not exists users_username_key on users (lower(username));

-- ---------- Remove the open demo rules ----------

do $$
declare t text;
begin
  foreach t in array array['users','invites','connections','events','attendances','messages',
                           'direct_messages','blocks','reports','ratings']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "demo anon access" on %I', t);
  end loop;
end $$;

-- ---------- Rules for signed-in members ----------
-- Each block drops its policies first so the file can be re-run after edits.

-- Members can see each other's profiles. Profiles are only created by join_with_invite().
drop policy if exists "members read" on users;
create policy "members read" on users for select to authenticated using (true);

-- Invite codes: only your own. Redeeming goes through check_invite() / join_with_invite().
drop policy if exists "own invites read" on invites;
drop policy if exists "own invites create" on invites;
create policy "own invites read" on invites for select to authenticated using (owner_id = auth.uid());
create policy "own invites create" on invites for insert to authenticated
  with check (owner_id = auth.uid() and used_by is null and reusable = false);

-- Connections: only rows that involve you.
drop policy if exists "own connections read" on connections;
drop policy if exists "own connections create" on connections;
drop policy if exists "own connections delete" on connections;
create policy "own connections read" on connections for select to authenticated
  using (user_id = auth.uid() or connected_user_id = auth.uid());
create policy "own connections create" on connections for insert to authenticated
  with check (user_id = auth.uid() or connected_user_id = auth.uid());
create policy "own connections delete" on connections for delete to authenticated
  using (user_id = auth.uid() or connected_user_id = auth.uid());

-- Events: everyone reads; you publish, edit and delete your own.
drop policy if exists "events read" on events;
drop policy if exists "own events write" on events;
drop policy if exists "own events update" on events;
drop policy if exists "own events delete" on events;
create policy "events read" on events for select to authenticated using (true);
create policy "own events write" on events for insert to authenticated with check (created_by = auth.uid());
create policy "own events update" on events for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "own events delete" on events for delete to authenticated using (created_by = auth.uid());

-- Attendances: everyone reads (attendee counts); you join and leave as yourself.
drop policy if exists "attendances read" on attendances;
drop policy if exists "own attendance join" on attendances;
drop policy if exists "own attendance leave" on attendances;
create policy "attendances read" on attendances for select to authenticated using (true);
create policy "own attendance join" on attendances for insert to authenticated with check (user_id = auth.uid());
create policy "own attendance leave" on attendances for delete to authenticated using (user_id = auth.uid());

-- Event chat: only women going to the event read and write; you write as yourself.
drop policy if exists "attendees read chat" on messages;
drop policy if exists "attendees write chat" on messages;
drop policy if exists "sender flags own message" on messages;
create policy "attendees read chat" on messages for select to authenticated
  using (exists (select 1 from attendances a where a.event_id = messages.event_id and a.user_id = auth.uid()));
create policy "attendees write chat" on messages for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from attendances a where a.event_id = messages.event_id and a.user_id = auth.uid())
  );
-- The AI check runs in the sender's browser and can only ever turn the flag ON.
create policy "sender flags own message" on messages for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and flagged = true);

-- Direct messages: only the two people in the conversation; only to friends; never across a block.
drop policy if exists "dm participants read" on direct_messages;
drop policy if exists "dm send to friends" on direct_messages;
drop policy if exists "sender flags own dm" on direct_messages;
create policy "dm participants read" on direct_messages for select to authenticated
  using (user_id = auth.uid() or to_user = auth.uid());
create policy "dm send to friends" on direct_messages for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from connections c where c.user_id = auth.uid() and c.connected_user_id = to_user)
    and not exists (
      select 1 from blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = to_user)
         or (b.blocker_id = to_user and b.blocked_id = auth.uid())
    )
  );
create policy "sender flags own dm" on direct_messages for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and flagged = true);

-- Only the flag columns can ever be updated on messages (no editing text after sending).
revoke update on messages, direct_messages from anon, authenticated;
grant update (flagged, flag_category, flag_reason) on messages, direct_messages to authenticated;

-- Blocks: you see blocks that involve you; only the blocker can create or remove one.
drop policy if exists "own blocks read" on blocks;
drop policy if exists "own blocks create" on blocks;
drop policy if exists "own blocks remove" on blocks;
create policy "own blocks read" on blocks for select to authenticated
  using (blocker_id = auth.uid() or blocked_id = auth.uid());
create policy "own blocks create" on blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "own blocks remove" on blocks for delete to authenticated using (blocker_id = auth.uid());

-- Reports: send as yourself; nobody can read them through the app (team uses the dashboard).
drop policy if exists "send report" on reports;
create policy "send report" on reports for insert to authenticated with check (reporter_id = auth.uid());

-- Ratings: you see only the ratings you gave; you rate only women who went to the same event.
-- Averages come from member_rating(), so individual ratings stay anonymous.
drop policy if exists "own ratings read" on ratings;
drop policy if exists "rate co-attendees" on ratings;
drop policy if exists "update own ratings" on ratings;
create policy "own ratings read" on ratings for select to authenticated using (from_user = auth.uid());
create policy "rate co-attendees" on ratings for insert to authenticated
  with check (
    from_user = auth.uid() and to_user <> auth.uid()
    and exists (select 1 from attendances a where a.event_id = ratings.event_id and a.user_id = auth.uid())
    and exists (select 1 from attendances a where a.event_id = ratings.event_id and a.user_id = ratings.to_user)
  );
create policy "update own ratings" on ratings for update to authenticated
  using (from_user = auth.uid()) with check (from_user = auth.uid());

-- ---------- Server-side functions ----------
-- "security definer" functions run with full access but only do the one checked thing.

-- Is this invite code usable? Callable before signing up. Never reveals other codes.
create or replace function public.check_invite(p_code text)
returns json language plpgsql stable security definer set search_path = public as $$
declare inv invites; owner_name text;
begin
  select * into inv from invites where code = upper(trim(p_code));
  if not found then return json_build_object('ok', false, 'reason', 'not_found'); end if;
  if not inv.reusable and inv.used_by is not null then
    return json_build_object('ok', false, 'reason', 'used');
  end if;
  select name into owner_name from users where id = inv.owner_id;
  return json_build_object('ok', true, 'owner_id', inv.owner_id, 'owner_name', owner_name, 'reusable', inv.reusable);
end $$;

-- Is this username free? Callable before signing up.
create or replace function public.username_available(p_username text)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from users where lower(username) = lower(trim(p_username)))
$$;

-- Creates the signed-in member's profile from an invite code: claims single-use codes,
-- records who vouched, and connects her with the inviter (and, for the shared demo code,
-- with the inviter's friends). Returns the new profile. Errors: not_signed_in, not_found,
-- used, username_taken.
create or replace function public.join_with_invite(
  p_code text, p_username text, p_name text, p_role text,
  p_interests text[], p_area text, p_lat float, p_lng float
)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); inv invites; me users;
begin
  if uid is null then raise exception 'not_signed_in'; end if;

  select * into me from users where id = uid;
  if found then return row_to_json(me); end if; -- already joined (e.g. retried)

  select * into inv from invites where code = upper(trim(p_code)) for update;
  if not found then raise exception 'not_found'; end if;
  if not inv.reusable and inv.used_by is not null then raise exception 'used'; end if;
  if exists (select 1 from users where lower(username) = lower(trim(p_username))) then
    raise exception 'username_taken';
  end if;

  insert into users (id, username, name, role, interests, area, lat, lng, invited_by, is_demo)
  values (uid, lower(trim(p_username)), trim(p_name), nullif(trim(p_role), ''), coalesce(p_interests, '{}'),
          p_area, p_lat, p_lng, inv.owner_id, false)
  returning * into me;

  if not inv.reusable then update invites set used_by = uid where code = inv.code; end if;

  if inv.owner_id is not null then
    insert into connections (user_id, connected_user_id)
    select x.a, x.b
    from (
      select inv.owner_id as friend
      union
      select c.connected_user_id from connections c where inv.reusable and c.user_id = inv.owner_id
    ) f
    cross join lateral (values (f.friend, uid), (uid, f.friend)) as x(a, b)
    where f.friend <> uid
    on conflict do nothing;
  end if;

  return row_to_json(me);
end $$;

-- A member's star rating: count, and the average only once she has 3 or more ratings.
create or replace function public.member_rating(p_user uuid)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'count', count(*),
    'average', case when count(*) >= 3 then round(avg(stars)::numeric, 1) end
  )
  from ratings where to_user = p_user and stars is not null
$$;

-- Supabase grants new functions to anon and authenticated by default, so revoke from them too.
revoke all on function public.check_invite(text) from public, anon, authenticated;
revoke all on function public.username_available(text) from public, anon, authenticated;
revoke all on function public.join_with_invite(text, text, text, text, text[], text, float, float) from public, anon, authenticated;
revoke all on function public.member_rating(uuid) from public, anon, authenticated;
grant execute on function public.check_invite(text) to anon, authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.join_with_invite(text, text, text, text, text[], text, float, float) to authenticated;
grant execute on function public.member_rating(uuid) to authenticated;
