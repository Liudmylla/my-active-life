# Calendar update

- Replaced the fixed November day strip with a real Monday–Sunday calendar.
- Previous/next week buttons move by seven days and preserve the selected weekday.
- The Today shortcut returns to the current week and date.
- The selected date is owned by `App`, so both Add Activity buttons save to the currently selected day.
- New sessions store `date` as local `YYYY-MM-DD` inside the existing `legacy_data` JSON field in Supabase. No database migration is needed.
- Calendar indicators, daily session list, and weekly totals are filtered by actual dates.
- Existing weekday-only sessions are assigned the matching weekday in the current week. Their original historical date cannot be recovered because it was not stored. The migrated dates are written to local storage and synced to Supabase.

## Validation

TypeScript/TSX syntax transpilation passed for the edited files. A full Vite/TypeScript build could not be run in this environment because npm dependencies were unavailable (registry timeout and no offline cache). Run `npm install` followed by `npm run build` locally before deployment.
