import type { ExerciseEntry, RunningEntry, Session, SetEntry, StrengthWorkout } from '../types'
import { kindForTemplate } from '../constants/activities'
import { ensureSessionDates, parseLocalDate } from '../utils/dates'
import { normalizeRunningEntry, normalizeSession, normalizeStrengthFields } from './legacy'

export const initialSessions: Session[] = [
  { id: 1, day: 0, kind: 'strengthLower', title: '', planned: true, done: true, duration: 55 },
  { id: 2, day: 0, kind: 'run', runCategory: 'easy', title: '', planned: true, done: true, duration: 52, distance: 6.2, pace: '8:23', avgHr: 137, calories: 410 },
  { id: 3, day: 1, kind: 'dance', title: 'Dance class', planned: true, done: true, duration: 45 },
  { id: 4, day: 2, kind: 'strengthUpper', title: '', planned: true, done: false, duration: 50 },
  { id: 5, day: 3, kind: 'run', runCategory: 'quality', workType: 'intervals', title: '', planned: true, done: false, duration: 55, distance: 7 },
  { id: 6, day: 4, kind: 'fullBody', title: '', planned: true, done: false, duration: 45 },
  { id: 7, day: 5, kind: 'run', runCategory: 'long', title: '', planned: true, done: false, duration: 80, distance: 9 },
]

let lastId = 0
/** Monotonic, collision-free numeric id (fits in a Postgres bigint and a JS safe integer). */
export const newId = () => {
  lastId = Math.max(Date.now() * 1000 + Math.floor(Math.random() * 1000), lastId + 1)
  return lastId
}

const freshId = (used: Set<number>) => {
  let id = newId()
  while (used.has(id)) id += 1
  used.add(id)
  return id
}
export const normalizeIds = <T extends { id: number }>(items: T[]): T[] => {
  const used = new Set<number>()
  return items.map(item => {
    const id = typeof item.id === 'number' && Number.isSafeInteger(item.id) && !used.has(item.id) ? (used.add(item.id), item.id) : freshId(used)
    return { ...item, id }
  })
}

/** Union by id; `preferred` wins field-by-field for records present in both lists. */
export const mergeRecords = <T extends { id: number }>(preferred: T[], secondary: T[]): T[] => {
  const merged = new Map<number, T>()
  secondary.forEach(item => merged.set(item.id, item))
  preferred.forEach(item => merged.set(item.id, { ...(merged.get(item.id) || {} as T), ...item }))
  return Array.from(merged.values())
}

export const emptySet = (): SetEntry => ({ id: newId(), kg: '', reps: '', done: false })
export const makeExercise = (name: string): ExerciseEntry => ({ id: newId(), name, sets: [emptySet(), emptySet(), emptySet()] })
/** Copies weights/reps as a starting point for a new workout; completion flags are reset. */
export const copyExercisesAsPlan = (exercises: ExerciseEntry[]): ExerciseEntry[] =>
  exercises.map(ex => ({ ...ex, id: newId(), sets: ex.sets.map(st => ({ id: newId(), kg: st.kg, reps: st.reps, done: false })) }))
/** Deep copy for editing an existing workout as-is. */
export const cloneExercises = (exercises: ExerciseEntry[]): ExerciseEntry[] =>
  exercises.map(ex => ({ ...ex, sets: ex.sets.map(st => ({ ...st })) }))

export const normalizeSessions = (items: Session[]): Session[] =>
  ensureSessionDates(normalizeIds(items).map(normalizeSession))
export const normalizeRuns = (items: RunningEntry[]): RunningEntry[] =>
  normalizeIds(items).map(normalizeRunningEntry)

const normalizeStrengthBase = (items: StrengthWorkout[]): StrengthWorkout[] => normalizeIds(items).map(workout => ({
  ...normalizeStrengthFields(workout),
  exercises: normalizeIds((workout.exercises || []).map(ex => ({ ...ex, sets: normalizeIds(ex.sets || []) }))),
}))

// One-off correction of a duplicated workout (18 Nov removed, 17 Nov kept). Idempotent.
const DUPLICATE_WORKOUT_ID = 1795123675574606
const KEPT_WORKOUT_ID = 1795123675574981
export const normalizeStrength = (items: StrengthWorkout[]): StrengthWorkout[] =>
  normalizeStrengthBase(items.filter(w => w.id !== DUPLICATE_WORKOUT_ID)).map(w => ({
    ...w,
    date: w.id === KEPT_WORKOUT_ID ? '2026-11-17' : w.date,
    calendarSessionId: w.calendarSessionId === undefined ? w.id : w.calendarSessionId,
  }))

export const strengthSession = (workout: StrengthWorkout): Session => ({
  id: workout.calendarSessionId ?? workout.id,
  day: (parseLocalDate(workout.date).getDay() + 6) % 7,
  date: workout.date,
  kind: kindForTemplate(workout.template),
  title: workout.title,
  planned: true,
  done: true,
})

/** Make sure every strength workout linked to the calendar has a matching session. */
export const linkStrengthSessions = (items: Session[], workouts: StrengthWorkout[]): Session[] => {
  const next = items.filter(s => s.id !== DUPLICATE_WORKOUT_ID)
  for (const workout of workouts) {
    if (workout.calendarSessionId == null) continue
    const linked = strengthSession(workout)
    const index = next.findIndex(s => s.id === workout.calendarSessionId)
    if (index >= 0) next[index] = { ...next[index], ...linked, done: next[index].done, duration: next[index].duration }
    else next.push(linked)
  }
  return ensureSessionDates(next)
}

export const paceToSeconds = (pace?: string) => {
  if (!pace) return NaN
  const [m, s] = pace.split(':')
  return Number(m) * 60 + Number(s || 0)
}
export const completedSets = (workout: { exercises: ExerciseEntry[] }) =>
  workout.exercises.reduce((n, e) => n + e.sets.filter(st => st.done).length, 0)
