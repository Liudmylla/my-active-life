-- My Active Life — database v1
-- Additive migration: keeps public.user_app_data untouched.
-- Run once in Supabase Dashboard > SQL Editor.

begin;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  timezone text not null default 'Europe/Paris',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Weekly calendar/planner. day_of_week follows the current app convention:
-- 0 = Monday ... 6 = Sunday. Keep done as a simple true/false flag.
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  legacy_id bigint,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  kind text not null,
  title text not null,
  planned boolean not null default true,
  done boolean not null default false,
  recorded_at timestamptz,
  run_category text,
  work_type text,
  duration_minutes integer,
  distance_km numeric(7,2),
  pace text,
  avg_hr integer,
  calories integer,
  note text,
  legacy_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, legacy_id)
);

-- Detailed history of completed runs. A run may be linked to its calendar session.
create table if not exists public.running_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  legacy_session_id bigint,
  run_date date,
  category text,
  work_type text,
  title text not null,
  duration_minutes integer,
  distance_km numeric(7,2),
  pace text,
  avg_hr integer,
  calories integer,
  note text,
  legacy_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, legacy_session_id)
);

-- A strength workout keeps its exercise/sets structure in JSONB.
-- This is intentional: it is one user's personal training log, not a gym platform.
create table if not exists public.strength_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  legacy_id bigint,
  workout_date date,
  template text not null,
  title text not null,
  exercises jsonb not null default '[]'::jsonb,
  legacy_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, legacy_id)
);

-- One row per date for body metrics, wellbeing and cycle observations.
-- A period start is simply period_start = true on that date.
create table if not exists public.daily_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  weight_kg numeric(6,2),
  waist_cm numeric(6,2),
  hips_cm numeric(6,2),
  sleep_hours numeric(4,2),
  energy smallint check (energy between 1 and 5),
  mood text,
  symptoms text[] not null default '{}',
  cycle_phase text,
  period_start boolean not null default false,
  notes text,
  legacy_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index if not exists sessions_user_day_idx on public.sessions(user_id, day_of_week);
create index if not exists running_history_user_date_idx on public.running_history(user_id, run_date desc);
create index if not exists strength_history_user_date_idx on public.strength_history(user_id, workout_date desc);
create index if not exists daily_data_user_date_idx on public.daily_data(user_id, entry_date desc);

-- Enable row-level security and restrict every table to its owner.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','sessions','running_history','strength_history','daily_data'] LOOP
    EXECUTE format('alter table public.%I enable row level security', t);
    EXECUTE format('drop policy if exists %I on public.%I', t || '_select_own', t);
    EXECUTE format('create policy %I on public.%I for select to authenticated using (auth.uid() = user_id)', t || '_select_own', t);
    EXECUTE format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    EXECUTE format('create policy %I on public.%I for insert to authenticated with check (auth.uid() = user_id)', t || '_insert_own', t);
    EXECUTE format('drop policy if exists %I on public.%I', t || '_update_own', t);
    EXECUTE format('create policy %I on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t || '_update_own', t);
    EXECUTE format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    EXECUTE format('create policy %I on public.%I for delete to authenticated using (auth.uid() = user_id)', t || '_delete_own', t);
    EXECUTE format('grant select, insert, update, delete on public.%I to authenticated', t);
  END LOOP;
END $$;

-- Migrate existing JSON payloads without deleting or modifying the old table.
DO $$
DECLARE
  old_row record;
  item jsonb;
  inserted_session_id uuid;
  d date;
  w numeric(6,2);
BEGIN
  IF to_regclass('public.user_app_data') IS NULL THEN
    RAISE NOTICE 'public.user_app_data does not exist; new tables were created but no legacy data was migrated.';
    RETURN;
  END IF;

  FOR old_row IN SELECT user_id, payload FROM public.user_app_data LOOP
    INSERT INTO public.profiles(user_id, email)
    SELECT old_row.user_id, u.email FROM auth.users u WHERE u.id = old_row.user_id
    ON CONFLICT (user_id) DO UPDATE SET email = excluded.email, updated_at = now();

    -- Calendar/planner rows.
    FOR item IN SELECT value FROM jsonb_array_elements(coalesce(old_row.payload->'sessions', '[]'::jsonb)) LOOP
      INSERT INTO public.sessions (
        user_id, legacy_id, day_of_week, kind, title, planned, done, recorded_at,
        run_category, work_type, duration_minutes, distance_km, pace, avg_hr, calories, note, legacy_data
      ) VALUES (
        old_row.user_id,
        nullif(item->>'id','')::bigint,
        coalesce(nullif(item->>'day','')::smallint, 0),
        coalesce(item->>'kind','Другая активность'),
        coalesce(item->>'title','Тренировка'),
        coalesce((item->>'planned')::boolean, true),
        coalesce((item->>'done')::boolean, false),
        nullif(item->>'recordedAt','')::timestamptz,
        item->>'runCategory', item->>'workType',
        nullif(item->>'duration','')::integer,
        nullif(item->>'distance','')::numeric,
        item->>'pace', nullif(item->>'avgHr','')::integer,
        nullif(item->>'calories','')::integer, item->>'note', item
      )
      ON CONFLICT (user_id, legacy_id) DO UPDATE SET
        day_of_week=excluded.day_of_week, kind=excluded.kind, title=excluded.title,
        planned=excluded.planned, done=excluded.done, recorded_at=excluded.recorded_at,
        run_category=excluded.run_category, work_type=excluded.work_type,
        duration_minutes=excluded.duration_minutes, distance_km=excluded.distance_km,
        pace=excluded.pace, avg_hr=excluded.avg_hr, calories=excluded.calories,
        note=excluded.note, legacy_data=excluded.legacy_data, updated_at=now();
    END LOOP;

    -- Completed runs become rows in their own history, linked to the calendar item.
    FOR item IN
      SELECT value FROM jsonb_array_elements(coalesce(old_row.payload->'sessions', '[]'::jsonb))
      WHERE value->>'kind' = 'Бег' AND coalesce((value->>'done')::boolean, false)
    LOOP
      SELECT s.id INTO inserted_session_id
      FROM public.sessions s
      WHERE s.user_id = old_row.user_id AND s.legacy_id = nullif(item->>'id','')::bigint;

      INSERT INTO public.running_history (
        user_id, session_id, legacy_session_id, run_date, category, work_type, title,
        duration_minutes, distance_km, pace, avg_hr, calories, note, legacy_data
      ) VALUES (
        old_row.user_id, inserted_session_id, nullif(item->>'id','')::bigint,
        nullif(item->>'recordedAt','')::timestamptz::date,
        item->>'runCategory', item->>'workType', coalesce(item->>'title','Бег'),
        nullif(item->>'duration','')::integer, nullif(item->>'distance','')::numeric,
        item->>'pace', nullif(item->>'avgHr','')::integer,
        nullif(item->>'calories','')::integer, item->>'note', item
      )
      ON CONFLICT (user_id, legacy_session_id) DO UPDATE SET
        session_id=excluded.session_id, run_date=excluded.run_date,
        category=excluded.category, work_type=excluded.work_type, title=excluded.title,
        duration_minutes=excluded.duration_minutes, distance_km=excluded.distance_km,
        pace=excluded.pace, avg_hr=excluded.avg_hr, calories=excluded.calories,
        note=excluded.note, legacy_data=excluded.legacy_data;
    END LOOP;

    -- Strength workouts; the exercise/sets JSON is retained intact.
    FOR item IN SELECT value FROM jsonb_array_elements(coalesce(old_row.payload->'strengthHistory', '[]'::jsonb)) LOOP
      INSERT INTO public.strength_history(user_id, legacy_id, workout_date, template, title, exercises, legacy_data)
      VALUES (
        old_row.user_id, nullif(item->>'id','')::bigint,
        nullif(item->>'date','')::date,
        coalesce(item->>'template','Full Body'), coalesce(item->>'title','Силовая тренировка'),
        coalesce(item->'exercises','[]'::jsonb), item
      )
      ON CONFLICT (user_id, legacy_id) DO UPDATE SET
        workout_date=excluded.workout_date, template=excluded.template,
        title=excluded.title, exercises=excluded.exercises, legacy_data=excluded.legacy_data;
    END LOOP;

    -- Menstruation start dates are represented as daily_data.period_start = true.
    FOR item IN SELECT value FROM jsonb_array_elements(coalesce(old_row.payload->'periodStarts', '[]'::jsonb)) LOOP
      d := (item #>> '{}')::date;
      INSERT INTO public.daily_data AS dd(user_id, entry_date, period_start)
      VALUES (old_row.user_id, d, true)
      ON CONFLICT (user_id, entry_date) DO UPDATE SET period_start = true, updated_at = now();
    END LOOP;

    -- Daily wellbeing and cycle observations share the same date row.
    FOR item IN SELECT value FROM jsonb_array_elements(coalesce(old_row.payload->'cycleLogs', '[]'::jsonb)) LOOP
      d := nullif(item->>'date','')::date;
      INSERT INTO public.daily_data AS dd(user_id, entry_date, energy, symptoms, notes, cycle_phase, legacy_data)
      VALUES (
        old_row.user_id, d,
        nullif(item->>'energy','')::smallint,
        ARRAY(SELECT jsonb_array_elements_text(coalesce(item->'symptoms','[]'::jsonb))),
        nullif(item->>'note',''), nullif(item->>'phase',''), item
      )
      ON CONFLICT (user_id, entry_date) DO UPDATE SET
        energy=excluded.energy, symptoms=excluded.symptoms, notes=excluded.notes,
        cycle_phase=excluded.cycle_phase,
        period_start=dd.period_start OR excluded.period_start,
        legacy_data=dd.legacy_data || excluded.legacy_data,
        updated_at=now();
    END LOOP;

    -- The old app has one current-weight value but no measurement date.
    -- Preserve it as a dated snapshot on the migration day, only if numeric.
    w := CASE WHEN replace(trim(old_row.payload->>'weight'), ',', '.') ~ '^[0-9]+([.][0-9]+)?$'
             THEN replace(trim(old_row.payload->>'weight'), ',', '.')::numeric(6,2)
             ELSE NULL END;
    IF w IS NOT NULL THEN
      INSERT INTO public.daily_data AS dd(user_id, entry_date, weight_kg)
      VALUES (old_row.user_id, current_date, w)
      ON CONFLICT (user_id, entry_date) DO UPDATE SET
        weight_kg=coalesce(dd.weight_kg, excluded.weight_kg), updated_at=now();
    END IF;
  END LOOP;
END $$;

commit;

-- Verification queries (run separately after the migration):
-- select count(*) from public.profiles;
-- select count(*) from public.sessions;
-- select count(*) from public.running_history;
-- select count(*) from public.strength_history;
-- select count(*) from public.daily_data;
-- select entry_date, period_start, energy, symptoms, weight_kg from public.daily_data order by entry_date desc limit 20;