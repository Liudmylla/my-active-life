import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import type { CloudSection, CloudStatus, CycleLog, RunningEntry, Session, StrengthWorkout } from '../types'
import { isStrengthKind, templateForKind } from '../constants/activities'
import { normalizeCycleLog } from '../domain/legacy'
import { initialSessions, linkStrengthSessions, mergeRecords, newId, normalizeRuns, normalizeSessions, normalizeStrength, strengthSession } from '../domain/records'
import { loadSnapshot, saveDaily, saveRunning, saveSessions, saveStrength } from '../cloud/sync'
import { pendingSections, readJSON, storageKeys, writeJSON } from '../storage/local'
import { localISODate, parseLocalDate } from '../utils/dates'
import type { AuthUser } from './useAuth'

type JournalData = {
  sessions: Session[]
  strength: StrengthWorkout[]
  runs: RunningEntry[]
  periodStarts: string[]
  cycleLogs: CycleLog[]
  weight: string
}
export type CloudError = { section: CloudSection | 'load'; message: string }
/** Fields edited in the activity form. */
export type SessionDraft = Pick<Session, 'kind' | 'title' | 'runCategory' | 'workType' | 'duration' | 'distance' | 'pace' | 'avgHr' | 'calories'> & { date: string }
export type StrengthDraft = {
  workoutId: number | null
  calendarSessionId: number | null
  date: string
  template: StrengthWorkout['template']
  title: string
  exercises: StrengthWorkout['exercises']
}

const readLocal = (): JournalData => {
  const strength = normalizeStrength(readJSON<StrengthWorkout[]>(storageKeys.strength, []))
  return {
    sessions: linkStrengthSessions(normalizeSessions(readJSON<Session[]>(storageKeys.sessions, initialSessions)), strength),
    strength,
    runs: normalizeRuns(readJSON<RunningEntry[]>(storageKeys.running, [])),
    periodStarts: readJSON<string[]>(storageKeys.periodStarts, []),
    cycleLogs: readJSON<CycleLog[]>(storageKeys.cycleLogs, []).map(normalizeCycleLog),
    weight: localStorage.getItem(storageKeys.weight) || '',
  }
}

const savers: Record<CloudSection, (userId: string, d: JournalData) => Promise<void>> = {
  calendar: (userId, d) => saveSessions(supabase!, userId, d.sessions),
  running: (userId, d) => saveRunning(supabase!, userId, d.runs),
  strength: (userId, d) => saveStrength(supabase!, userId, d.strength),
  daily: (userId, d) => saveDaily(supabase!, userId, d.periodStarts, d.cycleLogs, d.weight),
}

const errorMessage = (error: unknown) => (error as { message?: string })?.message || ''

export function useJournal(user: AuthUser | null) {
  const [data, setData] = useState<JournalData>(readLocal)
  const [cloudReady, setCloudReady] = useState(false)
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('local')
  const [cloudError, setCloudError] = useState<CloudError | null>(null)

  const latest = useRef(data)
  latest.current = data
  const readyRef = useRef(false)
  const userRef = useRef(user)
  userRef.current = user
  const queues = useRef<Partial<Record<CloudSection, Promise<void>>>>({})
  const weightTimer = useRef<number>()

  useEffect(() => {
    writeJSON(storageKeys.sessions, data.sessions)
    writeJSON(storageKeys.strength, data.strength)
    writeJSON(storageKeys.running, data.runs)
    writeJSON(storageKeys.periodStarts, data.periodStarts)
    writeJSON(storageKeys.cycleLogs, data.cycleLogs)
    localStorage.setItem(storageKeys.weight, data.weight)
  }, [data])

  /** Saves are serialized per section; each one mirrors the full list it captured, so the last one wins. */
  const cloudSave = useCallback((section: CloudSection, snapshot: JournalData, allowBeforeReady = false) => {
    const current = userRef.current
    if (!supabase || !current) { setCloudStatus('local'); return }
    if (!readyRef.current && !allowBeforeReady) { pendingSections.add(section); setCloudStatus('waiting'); return }
    const run = async () => {
      if (userRef.current?.id !== current.id) return
      try {
        setCloudStatus('saving')
        await savers[section](current.id, snapshot)
        pendingSections.remove(section)
        setCloudStatus('saved')
        setCloudError(null)
      } catch (error) {
        pendingSections.add(section)
        setCloudStatus('error')
        setCloudError({ section, message: errorMessage(error) })
      }
    }
    queues.current[section] = (queues.current[section] ?? Promise.resolve()).then(run)
  }, [])

  /** Applies a change locally and pushes the touched sections to the cloud. */
  const commit = useCallback((patch: Partial<JournalData>, sections: CloudSection[]) => {
    const next = { ...latest.current, ...patch }
    latest.current = next
    setData(next)
    sections.forEach(section => cloudSave(section, next))
  }, [cloudSave])

  useEffect(() => {
    readyRef.current = false
    setCloudReady(false)
    if (!supabase || !user) { setCloudStatus('local'); return }
    let cancelled = false
    setCloudStatus('connecting')
    loadSnapshot(supabase, user.id, user.email).then(cloud => {
      if (cancelled) return
      const local = latest.current
      const pending = pendingSections.all()
      // Sessions and daily data: cloud is authoritative unless it is empty or local has unsynced edits.
      const useLocalSessions = (!cloud.sessions.length || pending.includes('calendar')) && local.sessions.length > 0
      const useLocalDaily = (!cloud.periodStarts.length && !cloud.cycleLogs.length) || pending.includes('daily')
      // Histories are merged by id; local wins for records present on both sides.
      const strength = mergeRecords(local.strength, cloud.strength)
      const runs = mergeRecords(local.runs, cloud.runs)
      const next: JournalData = {
        sessions: linkStrengthSessions(useLocalSessions ? local.sessions : cloud.sessions, strength),
        strength,
        runs,
        periodStarts: useLocalDaily && local.periodStarts.length ? local.periodStarts : cloud.periodStarts,
        cycleLogs: useLocalDaily && local.cycleLogs.length ? local.cycleLogs : cloud.cycleLogs,
        weight: pending.includes('daily') ? local.weight : cloud.latestWeight ?? local.weight,
      }
      latest.current = next
      setData(next)
      readyRef.current = true
      setCloudReady(true)
      setCloudStatus('synced')
      setCloudError(null)
      if (useLocalSessions || strength.some(w => w.calendarSessionId != null)) cloudSave('calendar', next, true)
      if (strength.length) cloudSave('strength', next, true)
      if (runs.length) cloudSave('running', next, true)
      if (useLocalDaily || !cloud.latestWeight) cloudSave('daily', next, true)
    }).catch(error => {
      if (cancelled) return
      setCloudStatus('loadError')
      setCloudError({ section: 'load', message: errorMessage(error) })
    })
    return () => { cancelled = true }
  }, [user?.id, cloudSave])

  useEffect(() => {
    if (!cloudReady) return
    const retry = () => pendingSections.all().forEach(section => cloudSave(section, latest.current))
    window.addEventListener('online', retry)
    retry()
    return () => window.removeEventListener('online', retry)
  }, [cloudReady, cloudSave])

  const saveSession = (draft: SessionDraft, editingId: number | null) => {
    const { sessions, runs, strength } = latest.current
    const edited = sessions.find(s => s.id === editingId)
    const isRun = draft.kind === 'run'
    const updated: Session = {
      ...(edited || {} as Session),
      ...draft,
      id: edited?.id ?? newId(),
      day: (parseLocalDate(draft.date).getDay() + 6) % 7,
      title: draft.title.trim(),
      runCategory: isRun ? draft.runCategory ?? 'easy' : undefined,
      workType: isRun && draft.runCategory === 'quality' ? draft.workType ?? 'intervals' : undefined,
      planned: edited?.planned ?? true,
      done: edited?.done ?? false,
    }
    const patch: Partial<JournalData> = { sessions: edited ? sessions.map(s => s.id === edited.id ? updated : s) : [...sessions, updated] }
    const touched: CloudSection[] = ['calendar']
    if (edited && isRun && runs.some(r => r.id === updated.id)) {
      patch.runs = runs.map(r => r.id === updated.id ? { ...r, ...updated, done: true, runDate: draft.date } : r)
      touched.push('running')
    }
    if (edited && strength.some(w => w.calendarSessionId === updated.id)) {
      patch.strength = strength.map(w => w.calendarSessionId !== updated.id ? w
        : isStrengthKind(updated.kind) ? { ...w, date: draft.date, title: updated.title, template: templateForKind(updated.kind) }
          : { ...w, calendarSessionId: null })
      touched.push('strength')
    }
    commit(patch, touched)
  }

  const toggleDone = (id: number) => {
    const { sessions, runs } = latest.current
    const target = sessions.find(s => s.id === id)
    if (!target) return
    const completing = !target.done
    const now = new Date().toISOString()
    const patch: Partial<JournalData> = { sessions: sessions.map(s => s.id === id ? { ...s, done: completing, recordedAt: completing ? now : undefined } : s) }
    const touched: CloudSection[] = ['calendar']
    // A completed run is copied into its own history record, which survives unchecking or deleting the session.
    if (target.kind === 'run' && completing) {
      patch.runs = [...runs.filter(r => r.id !== id), { ...target, done: true, recordedAt: now, runDate: target.date || localISODate(new Date()) }]
      touched.push('running')
    }
    commit(patch, touched)
  }

  const deleteSession = (id: number) => {
    const { sessions, strength } = latest.current
    const patch: Partial<JournalData> = { sessions: sessions.filter(s => s.id !== id) }
    const touched: CloudSection[] = ['calendar']
    if (strength.some(w => w.calendarSessionId === id)) {
      patch.strength = strength.map(w => w.calendarSessionId === id ? { ...w, calendarSessionId: null } : w)
      touched.push('strength')
    }
    commit(patch, touched)
  }

  /** Creates or updates a strength workout and marks its calendar session as done. */
  const saveStrengthWorkout = (draft: StrengthDraft): StrengthWorkout => {
    const { sessions, strength } = latest.current
    const existing = draft.workoutId != null ? strength.find(w => w.id === draft.workoutId)
      : draft.calendarSessionId != null ? strength.find(w => w.calendarSessionId === draft.calendarSessionId)
        : undefined
    const base = {
      id: existing?.id ?? newId(),
      date: draft.date,
      template: draft.template,
      title: draft.title.trim(),
      exercises: draft.exercises,
    }
    // Editing a history entry that was detached from the calendar must not recreate a calendar session.
    if (existing && existing.calendarSessionId == null && draft.calendarSessionId == null) {
      const workout: StrengthWorkout = { ...base, calendarSessionId: null }
      commit({ strength: [workout, ...strength.filter(w => w.id !== workout.id)] }, ['strength'])
      return workout
    }
    const calendarId = draft.calendarSessionId ?? existing?.calendarSessionId ?? newId()
    const workout: StrengthWorkout = { ...base, calendarSessionId: calendarId }
    const planned = sessions.find(s => s.id === calendarId)
    const linked: Session = { ...strengthSession(workout), done: true, recordedAt: planned?.recordedAt ?? new Date().toISOString(), duration: planned?.duration }
    commit({
      strength: [workout, ...strength.filter(w => w.id !== workout.id)],
      sessions: planned ? sessions.map(s => s.id === calendarId ? { ...s, ...linked } : s) : [...sessions, linked],
    }, ['strength', 'calendar'])
    return workout
  }

  const deleteStrengthWorkout = (id: number) =>
    commit({ strength: latest.current.strength.filter(w => w.id !== id) }, ['strength'])

  const updateRun = (entry: RunningEntry) =>
    commit({ runs: latest.current.runs.map(r => r.id === entry.id ? { ...entry, date: entry.runDate, day: (parseLocalDate(entry.runDate).getDay() + 6) % 7 } : r) }, ['running'])

  const deleteRun = (id: number) =>
    commit({ runs: latest.current.runs.filter(r => r.id !== id) }, ['running'])

  const addPeriodStart = (date: string) =>
    commit({ periodStarts: Array.from(new Set([...latest.current.periodStarts, date])).sort() }, ['daily'])

  const saveCycleLog = (entry: Omit<CycleLog, 'id'>) => {
    const log: CycleLog = { ...entry, id: newId() }
    commit({ cycleLogs: [log, ...latest.current.cycleLogs.filter(x => x.date !== entry.date)] }, ['daily'])
  }

  const updateWeight = (weight: string) => {
    const next = { ...latest.current, weight }
    latest.current = next
    setData(next)
    window.clearTimeout(weightTimer.current)
    weightTimer.current = window.setTimeout(() => cloudSave('daily', latest.current), 800)
  }

  return {
    ...data,
    cloudReady,
    cloudStatus,
    cloudError,
    actions: { saveSession, toggleDone, deleteSession, saveStrengthWorkout, deleteStrengthWorkout, updateRun, deleteRun, addPeriodStart, saveCycleLog, updateWeight },
  }
}

export type Journal = ReturnType<typeof useJournal>
