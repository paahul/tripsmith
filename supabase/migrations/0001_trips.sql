-- Trips: anonymous, shareable trip plans keyed by short id.
-- No user_id yet; we'll add it when auth lands.

create table if not exists public.trips (
  id         text        primary key,
  plan       jsonb       not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS is disabled for now since all reads/writes happen server-side using
-- the service_role key. When we add user auth + a user_id column, enable
-- RLS and add policies for owner-only writes + public reads by id.
alter table public.trips disable row level security;

-- Quick lookup of stale trips (used by an optional cleanup job later).
create index if not exists trips_updated_at_idx
  on public.trips (updated_at);
