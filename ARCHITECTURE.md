# My Active Life — architecture

```
src/
  App.tsx                     page shell: tabs, modal, wiring
  main.tsx                    React root + <I18nProvider>
  types/                      domain types (stable, language-neutral keys)
  constants/activities.ts     activity kinds, run categories, symptoms, exercise library, templates
  domain/
    legacy.ts                 maps old Russian labels stored in records to stable keys
    records.ts                ids, merging, strength ↔ calendar linking, helpers
  storage/local.ts            localStorage keys, JSON helpers, pending-sync markers
  cloud/sync.ts               Supabase row mappers, load snapshot, per-table saves
  state/
    useAuth.ts                session restore, password / email-code sign-in, set password
    useJournal.ts             all journal data, local persistence, cloud load/save/retry
    useStrengthEditor.ts      strength workout draft: new, from plan, or opened from history
  i18n/
    index.tsx                 provider, useI18n(), formatting and title helpers
    locales/ru.ts, fr.ts      typed message catalogs (fr must match ru's shape)
  components/
    layout/                   Sidebar, Topbar, LanguageSwitcher
    calendar/WeekCalendar.tsx
    auth/                     AuthPanel, AccountStrip
    session/SessionModal.tsx  add / edit calendar activity, edit a run in history
    views/                    WeekView, StrengthDiary, ProgressView, CycleView
```

## Data and translations
Records store keys (`run`, `easy`, `intervals`, `fatigue`, `lowerBody`…), never display text.
An empty `title` means "show the default title in the current language".
Records written by older versions (Russian labels such as `Бег`, `Лёгкий`, `Усталость`) are
normalized on every read, from localStorage and from Supabase, and written back with keys.

Adding a language: copy `src/i18n/locales/ru.ts` to a new file typed as `Messages`,
translate it, and register it in `languages` in `src/i18n/index.tsx`.

## Sync
Every change is written to localStorage immediately, then saved to the touched Supabase table.
Saves are serialized per table. A failed save marks the section as pending; pending sections
are retried when the browser comes back online and are preferred over cloud data on the next load.

## Supabase
Tables: profiles, sessions, running_history, strength_history, daily_data, with owner-scoped RLS.
`supabase/schema.sql` and `supabase/001_create_and_migrate.sql` are destructive reset scripts.
