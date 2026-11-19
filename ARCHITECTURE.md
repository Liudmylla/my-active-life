# My Active Life — architecture

## Source layout
- `src/App.tsx` — application composition and page workflows.
- `src/components/layout` — navigation and application header.
- `src/components/calendar/WeekCalendar.tsx` — week navigation and date selection.
- `src/constants/activities.ts` — activity catalogue and stable workout-template/exercise keys.
- `src/i18n/catalog.ts` — Russian labels and legacy-name normalization; future locales can be added without changing stored keys.
- `src/types/index.ts` — shared domain types.
- `src/utils/dates.ts` — timezone-safe local date helpers.
- `src/supabase.ts` — Supabase client.

## Stable workout identifiers
Workout templates are stored as `lowerBody`, `upperBody`, or `fullBody`. Exercises are stored as stable keys such as `romanianDeadlift` and `bulgarianSplitSquat`. Russian text is presentation-only and lives in the i18n catalog. Existing local and cloud records with the previous Russian/English labels are normalized when loaded.

## Date handling
Strength workout dates use local `YYYY-MM-DD` values. The date defaults to today, can be changed before saving, and is persisted in local browser storage. Calendar activity edits update the matching running-history row by its stable legacy ID without creating a second history entry. Deleting or unchecking a calendar item does not delete an independent running-history record.

## Supabase safety
The current app schema is retained in this code change. No database migrations or destructive SQL are executed. A clean replacement schema and any table-removal statements require a separate review before they are run in Supabase.
