-- Additive migration: water temperature for the "cold bath" activity.
-- Safe to run on the existing schema; does not drop or modify any data.
alter table public.sessions
  add column if not exists water_temp_c numeric(4,1);
