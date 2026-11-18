# My Active Life

Personal activity journal built with React, TypeScript, Vite and Supabase.

## What is stored in the cloud

The app now uses the five independent Supabase tables created by the database migration:

- `profiles` — account profile and timezone metadata.
- `sessions` — weekly calendar/planner only (`planned` and `done`).
- `running_history` — independent completed-run history and run metrics. It does not depend on calendar rows.
- `strength_history` — independent strength-workout history; exercises and sets are kept together as JSON.
- `daily_data` — weight, body measurements, sleep, energy, mood, symptoms, cycle phase, period-start dates and notes.

The old `user_app_data` table is not used by the new app and is left untouched as a backup. The app also keeps a local browser copy and queues failed cloud saves per section for retry when the connection returns.

## Run locally

1. Install Node.js 18 or newer.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the local URL printed by Vite (usually `http://localhost:5173`).

## Existing Supabase project — one small final SQL step

The five-table migration has already been run in your project. In Supabase Dashboard → SQL Editor, run the contents of:

`supabase/002_detach_running_history.sql`

This removes the old optional `session_id` foreign-key column from `running_history`. It does not delete any run records. It completes the agreed separation between calendar and run history.

Do not rerun the original migration unless you are intentionally setting up a fresh project. The original script is included as `supabase/001_create_and_migrate.sql` for reference and backup.

## Authentication and environment

The `.env.local` file contains the browser-side Supabase URL and publishable key for this project. These are intended for client use; never put a Supabase secret/service-role key in this Vite app. Email magic-link authentication is used. Add your local and production app URLs to Supabase Authentication → URL Configuration → Redirect URLs.

## Sync behaviour

- Calendar changes save to `sessions` only.
- Marking a run complete creates/updates its own independent row in `running_history`; unchecking it removes that run-history row without coupling the tables.
- Strength workouts save to `strength_history` only.
- Cycle dates and daily wellbeing save to `daily_data`; updates merge with existing date rows so fields not currently shown in the interface are preserved.
- Current weight is saved as a dated snapshot in `daily_data`.
- Local changes are written immediately to browser storage. Each cloud section has its own pending marker and retries on reconnection.

Keep browser storage until you have confirmed that the account has synchronized successfully.

## Important

The app does not assume a 28-day cycle or predict ovulation. Cycle day is calculated from the most recent actual period-start date. Apple Health / HealthKit and automatic Apple Watch import are not implemented.
