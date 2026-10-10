-- Ratings become 1–5 stars ("How was going to this event with her?").
-- Run on a database that already has 001_figma_handoff.sql applied. Fresh projects don't
-- need this: schema.sql already includes it. Safe to run more than once.

alter table ratings add column if not exists stars smallint;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ratings_stars_range') then
    alter table ratings add constraint ratings_stars_range check (stars between 1 and 5);
  end if;
end $$;

-- The old yes/no answer is no longer asked. Kept (nullable) so existing rows aren't lost.
alter table ratings alter column would_go_again drop not null;

create index if not exists ratings_to_user_idx on ratings (to_user);

-- Then run seed.sql again: it adds the demo ratings that make member averages visible.
