-- Additive migration: connect strength diary records to calendar sessions.
-- Safe to run on the existing schema; does not drop or erase any data.
alter table public.strength_history
  add column if not exists calendar_session_id bigint;

-- Existing strength records are linked by their stable record ID.
update public.strength_history
set calendar_session_id = id
where calendar_session_id is null;

create index if not exists strength_history_calendar_session_idx
  on public.strength_history(user_id, calendar_session_id);
