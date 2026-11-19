# My Active Life — architecture

- `src/App.tsx`: application workflows.
- `src/components`: reusable UI.
- `src/constants/activities.ts`: activity kinds and stable workout/exercise keys.
- `src/i18n/catalog.ts`: Russian display labels; keys are stored in records.
- `src/types/index.ts`: domain types.
- `src/utils/dates.ts`: local date utilities.
- `src/supabase.ts`: Supabase client.

## Fresh start
The app uses the new `mal-v2-*` local storage namespace. It does not import, normalize, or read the old local data. Re-enter records after reset.

## Supabase v2
Only profiles, sessions, running_history, strength_history and daily_data remain. Legacy columns and migration logic are removed. Running history is independent: source_session_id is informational and has no FK. Owner-scoped RLS is retained.

## Important
`supabase/schema.sql` and `supabase/001_create_and_migrate.sql` are destructive reset scripts. They drop the app tables and `public.user_app_data`, then recreate them. They have not been run against the live database.
