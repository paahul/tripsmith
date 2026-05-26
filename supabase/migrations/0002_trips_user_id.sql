-- Add nullable user_id to trips. Existing trips stay anonymous (user_id null);
-- new trips capture the logged-in user when one exists. Anonymous planning
-- still works fully.

alter table public.trips
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists trips_user_id_idx
  on public.trips (user_id)
  where user_id is not null;
