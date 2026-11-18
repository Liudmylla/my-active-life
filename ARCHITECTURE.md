# My Active Life — code structure

This refactor keeps the existing app behavior, visual styles, localStorage keys and Supabase schema intact while moving shared definitions out of the root component.

## Source layout

- `src/App.tsx` — application composition, page state, workflows and Supabase synchronization.
- `src/types/index.ts` — shared domain types (`Session`, `RunningEntry`, `StrengthWorkout`, cycle data and tab types).
- `src/constants/activities.ts` — activity catalogue, exercise library, workout templates and activity icon mapping.
- `src/utils/dates.ts` — local date helpers (timezone-safe local `YYYY-MM-DD`, week calculations and formatting).
- `src/components/layout/Sidebar.tsx` — navigation sidebar.
- `src/components/layout/Topbar.tsx` — application header and cloud/account status.
- `src/components/calendar/WeekCalendar.tsx` — interactive Monday–Sunday calendar, week navigation, today shortcut, and date selection.
- `src/supabase.ts` — Supabase client.

## Data compatibility

- Existing localStorage keys are unchanged.
- Existing Supabase tables and columns are unchanged.
- `Session.date` stores the exact local calendar date as `YYYY-MM-DD` inside `legacy_data` in Supabase, so no schema migration is required.
- Legacy sessions that only stored a weekday are assigned that weekday in the current week on load. Their original historical date cannot be reconstructed because it was never stored.
- `running_history` remains independent of calendar sessions; `legacy_session_id` is only a legacy identifier, not a foreign key.

## Next safe extraction points

The next modules to extract are the running editor/history, strength workout builder, cycle journal, and cloud repository. They should be moved one at a time with build checks so state transitions and sync behavior are not accidentally changed.
