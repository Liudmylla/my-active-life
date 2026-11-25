import type { SupabaseClient } from '@supabase/supabase-js'
import type { CycleLog, RunningEntry, Session, StrengthWorkout } from '../types'
import { localISODate } from '../utils/dates'
import { normalizeCycleLog, normalizePhase } from '../domain/legacy'
import { normalizeRuns, normalizeSessions, normalizeStrength } from '../domain/records'

type Row = Record<string, any>

export const recordTables = { calendar: 'sessions', running: 'running_history', strength: 'strength_history' } as const

/** Never deletes: rows missing from `rows` are left untouched in the cloud. */
const upsertRows = async (client: SupabaseClient, table: string, rows: Row[]) => {
  if (!rows.length) return
  const { error } = await client.from(table).upsert(rows, { onConflict: 'id' })
  if (error) throw error
}

/** Removes only the given ids, i.e. records the user explicitly deleted. */
export const deleteRows = async (client: SupabaseClient, userId: string, table: string, ids: number[]) => {
  if (!ids.length) return
  const { error } = await client.from(table).delete().eq('user_id', userId).in('id', ids)
  if (error) throw error
}

export const saveSessions = (client: SupabaseClient, userId: string, items: Session[]) =>
  upsertRows(client, 'sessions', items.map(x => ({
    user_id: userId, id: x.id, session_date: x.date || localISODate(new Date()), day_of_week: x.day, kind: x.kind, title: x.title,
    planned: x.planned, done: x.done, recorded_at: x.recordedAt || null, run_category: x.runCategory || null, work_type: x.workType || null,
    duration_minutes: x.duration || null, distance_km: x.distance || null, pace: x.pace || null, avg_hr: x.avgHr || null,
    calories: x.calories || null, note: x.note || null,
  })))

export const saveRunning = (client: SupabaseClient, userId: string, items: RunningEntry[]) =>
  upsertRows(client, 'running_history', items.map(x => ({
    user_id: userId, id: x.id, source_session_id: x.id, run_date: x.runDate, category: x.runCategory || null, work_type: x.workType || null,
    title: x.title, duration_minutes: x.duration || null, distance_km: x.distance || null, pace: x.pace || null, avg_hr: x.avgHr || null,
    calories: x.calories || null, note: x.note || null,
  })))

export const saveStrength = (client: SupabaseClient, userId: string, items: StrengthWorkout[]) =>
  upsertRows(client, 'strength_history', items.map(x => ({
    user_id: userId, id: x.id, workout_date: x.date.slice(0, 10), template: x.template, title: x.title,
    exercises: x.exercises, calendar_session_id: x.calendarSessionId ?? null,
  })))

/** Merges with existing date rows so a cycle edit never erases body metrics (or vice versa). */
export const saveDaily = async (client: SupabaseClient, userId: string, starts: string[], logs: CycleLog[], weight: string) => {
  const byDate = new Map<string, Row>()
  for (const date of starts) byDate.set(date, { ...(byDate.get(date) || {}), entry_date: date, period_start: true })
  for (const log of logs) byDate.set(log.date, {
    ...(byDate.get(log.date) || {}), entry_date: log.date, energy: log.energy, symptoms: log.symptoms,
    notes: log.note || null, cycle_phase: log.phase === 'none' ? null : log.phase,
  })
  const normalizedWeight = weight.trim().replace(',', '.')
  if (/^\d+(\.\d+)?$/.test(normalizedWeight)) {
    const date = localISODate(new Date())
    byDate.set(date, { ...(byDate.get(date) || {}), entry_date: date, weight_kg: Number(normalizedWeight) })
  }
  if (!byDate.size) return
  const { data: existing, error } = await client.from('daily_data').select('*').eq('user_id', userId)
  if (error) throw error
  const oldByDate = new Map((existing || []).map((r: Row) => [r.entry_date, r]))
  const merged = Array.from(byDate.values()).map(r => {
    const old: Row = oldByDate.get(r.entry_date) || {}
    return {
      user_id: userId, entry_date: r.entry_date, weight_kg: r.weight_kg ?? old.weight_kg ?? null, waist_cm: old.waist_cm ?? null,
      hips_cm: old.hips_cm ?? null, sleep_hours: old.sleep_hours ?? null, energy: r.energy ?? old.energy ?? null, mood: old.mood ?? null,
      symptoms: r.symptoms ?? old.symptoms ?? [], cycle_phase: 'cycle_phase' in r ? r.cycle_phase : old.cycle_phase ?? null,
      period_start: r.period_start ?? old.period_start ?? false, notes: r.notes ?? old.notes ?? null,
    }
  })
  const { error: upsertError } = await client.from('daily_data').upsert(merged, { onConflict: 'user_id,entry_date' })
  if (upsertError) throw upsertError
}

export type CloudSnapshot = {
  sessions: Session[]
  runs: RunningEntry[]
  strength: StrengthWorkout[]
  periodStarts: string[]
  cycleLogs: CycleLog[]
  latestWeight: string | null
}

export const loadSnapshot = async (client: SupabaseClient, userId: string, email?: string): Promise<CloudSnapshot> => {
  const [profile, sess, runs, strength, daily] = await Promise.all([
    client.from('profiles').upsert({ user_id: userId, email: email || null, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }),
    client.from('sessions').select('*').eq('user_id', userId),
    client.from('running_history').select('*').eq('user_id', userId).order('run_date', { ascending: true }),
    client.from('strength_history').select('*').eq('user_id', userId).order('workout_date', { ascending: false }),
    client.from('daily_data').select('*').eq('user_id', userId).order('entry_date', { ascending: true }),
  ])
  for (const result of [profile, sess, runs, strength, daily]) if (result.error) throw result.error
  const num = (v: unknown) => v == null ? undefined : Number(v)
  const dailyRows: Row[] = daily.data || []
  const latestWeight = [...dailyRows].reverse().find(r => r.weight_kg != null)
  return {
    sessions: normalizeSessions((sess.data || []).map((r: Row) => ({
      id: r.id == null ? NaN : Number(r.id), day: r.day_of_week, date: r.session_date, kind: r.kind, title: r.title, planned: r.planned,
      done: r.done, recordedAt: r.recorded_at || undefined, runCategory: r.run_category || undefined, workType: r.work_type || undefined,
      duration: r.duration_minutes || undefined, distance: num(r.distance_km), pace: r.pace || undefined, avgHr: r.avg_hr || undefined,
      calories: r.calories || undefined, note: r.note || undefined,
    } as Session))),
    runs: normalizeRuns((runs.data || []).map((r: Row) => ({
      id: r.id == null ? NaN : Number(r.id), day: 0, date: r.run_date, kind: 'run', done: true, planned: false, runDate: r.run_date,
      title: r.title, runCategory: r.category || undefined, workType: r.work_type || undefined, duration: r.duration_minutes || undefined,
      distance: num(r.distance_km), pace: r.pace || undefined, avgHr: r.avg_hr || undefined, calories: r.calories || undefined, note: r.note || undefined,
    } as RunningEntry))),
    strength: normalizeStrength((strength.data || []).map((r: Row) => ({
      id: r.id == null ? NaN : Number(r.id), date: r.workout_date, template: r.template, title: r.title, exercises: r.exercises || [],
      calendarSessionId: r.calendar_session_id == null ? null : Number(r.calendar_session_id),
    } as StrengthWorkout))),
    periodStarts: dailyRows.filter(r => r.period_start).map(r => r.entry_date),
    cycleLogs: dailyRows
      .filter(r => r.energy != null || r.symptoms?.length || r.notes || r.cycle_phase)
      .map(r => normalizeCycleLog({ id: Date.parse(r.entry_date), date: r.entry_date, energy: r.energy || 3, symptoms: r.symptoms || [], note: r.notes || '', phase: normalizePhase(r.cycle_phase) })),
    latestWeight: latestWeight?.weight_kg != null ? String(latestWeight.weight_kg) : null,
  }
}
