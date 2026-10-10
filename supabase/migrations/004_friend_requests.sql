-- Friend requests: members become friends only when one sends a request and the other
-- accepts (or through an invite code). The shared demo code JURY2026 now connects the
-- newcomer with Lila only, not with Lila's friends.
--
-- Run after 003_auth.sql. Safe to run more than once.

create table if not exists friend_requests (
  from_user uuid not null references users (id) on delete cascade,
  to_user uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_user, to_user),
  check (from_user <> to_user)
);
create index if not exists friend_requests_to_user_idx on friend_requests (to_user);

alter table friend_requests enable row level security;

-- You see requests you sent or received, and can cancel or decline them.
-- Sending and accepting go through the functions below.
drop policy if exists "own requests read" on friend_requests;
drop policy if exists "cancel or decline request" on friend_requests;
create policy "own requests read" on friend_requests for select to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());
create policy "cancel or decline request" on friend_requests for delete to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());

-- Friendships can no longer be created directly by the app: only by accepted requests and
-- invite codes (server functions).
drop policy if exists "own connections create" on connections;

-- ---------- Functions ----------

create or replace function public.blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  )
$$;

create or replace function public.make_friends(a uuid, b uuid)
returns void language sql security definer set search_path = public as $$
  insert into connections (user_id, connected_user_id) values (a, b), (b, a) on conflict do nothing;
  delete from friend_requests where (from_user = a and to_user = b) or (from_user = b and to_user = a);
$$;

-- Returns 'sent', or 'friends' if you already were friends or she had already asked you.
-- Errors: not_signed_in, not_found, blocked.
create or replace function public.send_friend_request(p_to uuid)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if p_to is null or p_to = uid or not exists (select 1 from users where id = p_to) then
    raise exception 'not_found';
  end if;
  if exists (select 1 from connections where user_id = uid and connected_user_id = p_to) then
    return 'friends';
  end if;
  if blocked_between(uid, p_to) then raise exception 'blocked'; end if;

  if exists (select 1 from friend_requests where from_user = p_to and to_user = uid) then
    perform make_friends(uid, p_to);
    return 'friends';
  end if;

  insert into friend_requests (from_user, to_user) values (uid, p_to) on conflict do nothing;
  return 'sent';
end $$;

-- Accepts a request she sent you. Errors: not_signed_in, no_request, blocked.
create or replace function public.accept_friend_request(p_from uuid)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if not exists (select 1 from friend_requests where from_user = p_from and to_user = uid) then
    raise exception 'no_request';
  end if;
  if blocked_between(uid, p_from) then raise exception 'blocked'; end if;
  perform make_friends(uid, p_from);
  return 'friends';
end $$;

-- Joining with an invite code now connects the newcomer with the inviter only.
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
  if inv.owner_id is not null and inv.owner_id <> uid then perform make_friends(uid, inv.owner_id); end if;

  return row_to_json(me);
end $$;

-- Supabase grants new functions to anon and authenticated by default: only members may
-- call these, and the two helpers are internal.
revoke all on function public.blocked_between(uuid, uuid) from public, anon, authenticated;
revoke all on function public.make_friends(uuid, uuid) from public, anon, authenticated;
revoke all on function public.send_friend_request(uuid) from public, anon, authenticated;
revoke all on function public.accept_friend_request(uuid) from public, anon, authenticated;
revoke all on function public.join_with_invite(text, text, text, text, text[], text, float, float) from public, anon, authenticated;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.accept_friend_request(uuid) to authenticated;
grant execute on function public.join_with_invite(text, text, text, text, text[], text, float, float) to authenticated;
