-- Run once after 001_create_and_migrate.sql.
-- Running history is fully independent from the calendar/planner.
alter table public.running_history
  drop column if exists session_id;
