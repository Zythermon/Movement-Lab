-- Movement · registro de progresión
-- Pega este archivo completo en el SQL Editor de Supabase y ejecútalo una vez.
-- Proyecto: tdipbnvglcksmzmunnba
--
-- profiles: una fila por usuario de Google.
-- exercises: el plan compartido (Full Body A y B). Solo lectura desde la app.
-- workout_logs: el historial de cada persona. Una fila es una sesión de un ejercicio.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

create table public.exercises (
  id text primary key,
  day text not null check (day in ('A', 'B')),
  code text not null,
  name text not null,
  sets integer not null check (sets > 0),
  rep_min integer not null check (rep_min > 0),
  rep_max integer not null check (rep_max >= rep_min),
  load_type text not null check (load_type in ('lb', 'lbcu', 'variante', 'banda', 'dips')),
  sort_order integer not null unique
);

create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise_id text not null references public.exercises (id),
  load text not null check (length(btrim(load)) > 0),
  reps integer[] not null check (cardinality(reps) > 0),
  logged_at timestamptz not null default now()
);

create index workout_logs_user_exercise_logged_at_idx
  on public.workout_logs (user_id, exercise_id, logged_at);

create index workout_logs_user_logged_at_idx
  on public.workout_logs (user_id, logged_at);

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_logs enable row level security;

grant select, insert, update on public.profiles to authenticated;
grant select on public.exercises to authenticated;
grant select, insert, update, delete on public.workout_logs to authenticated;

revoke insert, update, delete on public.exercises from anon, authenticated;

create policy "Users read their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Authenticated users read the shared plan"
  on public.exercises
  for select
  to authenticated
  using (true);

create policy "Users read their own logs"
  on public.workout_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert their own logs"
  on public.workout_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update their own logs"
  on public.workout_logs
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete their own logs"
  on public.workout_logs
  for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

insert into public.profiles (id, email, full_name)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name')
from auth.users
on conflict (id) do nothing;

insert into public.exercises (id, day, code, name, sets, rep_min, rep_max, load_type, sort_order)
values
  ('a1', 'A', 'A1', 'Barbell / KB Front Squat', 3, 6, 8, 'lb', 1),
  ('a2', 'A', 'A2', 'Cable Pullover', 3, 12, 15, 'lb', 2),
  ('a3', 'A', 'B1', 'Slider Curl', 3, 12, 15, 'variante', 3),
  ('a4', 'A', 'B2', 'DB Incline Bench Press', 3, 10, 12, 'lb', 4),
  ('a5', 'A', 'C1', 'Bar Dips', 2, 8, 15, 'dips', 5),
  ('a6', 'A', 'C2', 'Cable Crunch', 2, 15, 15, 'lb', 6),
  ('b1', 'B', 'A1', 'Hip Thrust ROM+', 3, 6, 8, 'lb', 7),
  ('b2', 'B', 'A2', 'Seated Cable Row', 3, 12, 15, 'lb', 8),
  ('b3', 'B', 'B1', 'Bulgarian Split Squat', 3, 8, 10, 'lbcu', 9),
  ('b4', 'B', 'B2', 'Push-up ROM+', 3, 8, 15, 'variante', 10),
  ('b5', 'B', 'C1', 'Seated DB Curl', 2, 15, 15, 'lb', 11),
  ('b6', 'B', 'C2', 'Band Pull Apart', 2, 15, 15, 'banda', 12);
