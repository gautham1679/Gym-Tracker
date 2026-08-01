-- ============================================================================
-- Gym Tracker — Database Schema
-- Run this whole file once in Supabase: Dashboard -> SQL Editor -> New query
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- workouts: one row per training session (e.g. "Chest Day" on a given date)
-- ----------------------------------------------------------------------------
create table if not exists public.workouts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  workout_date date not null default (timezone('utc', now()))::date,
  category     text not null check (char_length(category) between 1 and 40),
  name         text,
  is_completed boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.workouts is 'A single training session belonging to a user, tagged with a category (Chest, Back, Legs, ...) and a date.';

-- ----------------------------------------------------------------------------
-- exercises: exercises performed within a workout session
-- ----------------------------------------------------------------------------
create table if not exists public.exercises (
  id          uuid primary key default gen_random_uuid(),
  workout_id  uuid not null references public.workouts(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- sets: individual sets for an exercise — reps and weight are both required
-- ----------------------------------------------------------------------------
create table if not exists public.sets (
  id           uuid primary key default gen_random_uuid(),
  exercise_id  uuid not null references public.exercises(id) on delete cascade,
  set_number   integer not null check (set_number > 0),
  reps         integer not null check (reps > 0 and reps <= 1000),
  weight_kg    numeric(6,2) not null check (weight_kg >= 0 and weight_kg <= 1000),
  completed    boolean not null default false,
  created_at   timestamptz not null default now()
);

comment on column public.sets.weight_kg is 'Weight is required for every set — enforced NOT NULL plus a range check.';

-- ----------------------------------------------------------------------------
-- indexes
-- ----------------------------------------------------------------------------
create index if not exists idx_workouts_user_date on public.workouts (user_id, workout_date desc);
create index if not exists idx_exercises_workout on public.exercises (workout_id, position);
create index if not exists idx_sets_exercise on public.sets (exercise_id, set_number);

-- ----------------------------------------------------------------------------
-- keep updated_at fresh on workouts
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_workouts_updated_at on public.workouts;
create trigger trg_workouts_updated_at
  before update on public.workouts
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security — every user can only ever see/write their own data
-- ----------------------------------------------------------------------------
alter table public.workouts  enable row level security;
alter table public.exercises enable row level security;
alter table public.sets      enable row level security;

-- workouts
drop policy if exists "workouts_select_own" on public.workouts;
create policy "workouts_select_own" on public.workouts
  for select using (auth.uid() = user_id);

drop policy if exists "workouts_insert_own" on public.workouts;
create policy "workouts_insert_own" on public.workouts
  for insert with check (auth.uid() = user_id);

drop policy if exists "workouts_update_own" on public.workouts;
create policy "workouts_update_own" on public.workouts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "workouts_delete_own" on public.workouts;
create policy "workouts_delete_own" on public.workouts
  for delete using (auth.uid() = user_id);

-- exercises (ownership derived via parent workout)
drop policy if exists "exercises_select_own" on public.exercises;
create policy "exercises_select_own" on public.exercises
  for select using (
    exists (select 1 from public.workouts w where w.id = exercises.workout_id and w.user_id = auth.uid())
  );

drop policy if exists "exercises_insert_own" on public.exercises;
create policy "exercises_insert_own" on public.exercises
  for insert with check (
    exists (select 1 from public.workouts w where w.id = exercises.workout_id and w.user_id = auth.uid())
  );

drop policy if exists "exercises_update_own" on public.exercises;
create policy "exercises_update_own" on public.exercises
  for update using (
    exists (select 1 from public.workouts w where w.id = exercises.workout_id and w.user_id = auth.uid())
  );

drop policy if exists "exercises_delete_own" on public.exercises;
create policy "exercises_delete_own" on public.exercises
  for delete using (
    exists (select 1 from public.workouts w where w.id = exercises.workout_id and w.user_id = auth.uid())
  );

-- sets (ownership derived via exercise -> workout)
drop policy if exists "sets_select_own" on public.sets;
create policy "sets_select_own" on public.sets
  for select using (
    exists (
      select 1 from public.exercises e
      join public.workouts w on w.id = e.workout_id
      where e.id = sets.exercise_id and w.user_id = auth.uid()
    )
  );

drop policy if exists "sets_insert_own" on public.sets;
create policy "sets_insert_own" on public.sets
  for insert with check (
    exists (
      select 1 from public.exercises e
      join public.workouts w on w.id = e.workout_id
      where e.id = sets.exercise_id and w.user_id = auth.uid()
    )
  );

drop policy if exists "sets_update_own" on public.sets;
create policy "sets_update_own" on public.sets
  for update using (
    exists (
      select 1 from public.exercises e
      join public.workouts w on w.id = e.workout_id
      where e.id = sets.exercise_id and w.user_id = auth.uid()
    )
  );

drop policy if exists "sets_delete_own" on public.sets;
create policy "sets_delete_own" on public.sets
  for delete using (
    exists (
      select 1 from public.exercises e
      join public.workouts w on w.id = e.workout_id
      where e.id = sets.exercise_id and w.user_id = auth.uid()
    )
  );
