import { useEffect, useState } from 'react'
import type { Session, SetEntry, StrengthWorkout, WorkoutTemplateKey } from '../types'
import type { Messages } from '../i18n/locales/ru'
import type { Journal, StrengthDraft } from './useJournal'
import { templateForKind, workoutTemplates } from '../constants/activities'
import { normalizeWorkoutTemplate } from '../domain/legacy'
import { cloneExercises, copyExercisesAsPlan, emptySet, makeExercise } from '../domain/records'
import { readJSON, storageKeys, writeJSON } from '../storage/local'
import { localISODate } from '../utils/dates'

export type StrengthNotice = keyof Messages['strength']['notices']

const latestFor = (history: StrengthWorkout[], template: WorkoutTemplateKey, excludeId?: number | null) => history
  .filter(w => w.template === template && w.id !== excludeId)
  .sort((a, b) => b.date.localeCompare(a.date))[0]

const freshDraft = (history: StrengthWorkout[], template: WorkoutTemplateKey, date = localISODate(new Date())): StrengthDraft => {
  const previous = latestFor(history, template)
  return {
    workoutId: null,
    calendarSessionId: null,
    date,
    template,
    title: previous?.title ?? '',
    exercises: previous ? copyExercisesAsPlan(previous.exercises) : workoutTemplates[template].map(makeExercise),
  }
}

const readDraft = (history: StrengthWorkout[]): StrengthDraft => {
  const saved = readJSON<StrengthDraft | null>(storageKeys.strengthDraft, null)
  if (saved && Array.isArray(saved.exercises)) return { ...saved, template: normalizeWorkoutTemplate(saved.template) }
  return freshDraft(history, 'lowerBody', localStorage.getItem(storageKeys.strengthDate) || undefined)
}

export function useStrengthEditor(journal: Journal) {
  const history = journal.strength
  const [draft, setDraft] = useState<StrengthDraft>(() => readDraft(history))
  const [notice, setNotice] = useState<StrengthNotice | null>(null)

  useEffect(() => { writeJSON(storageKeys.strengthDraft, draft) }, [draft])

  const patch = (changes: Partial<StrengthDraft>) => setDraft(d => ({ ...d, ...changes }))
  const updateExercises = (fn: (exercises: StrengthDraft['exercises']) => StrengthDraft['exercises']) =>
    setDraft(d => ({ ...d, exercises: fn(d.exercises) }))

  const openWorkout = (workout: StrengthWorkout) => {
    setDraft({
      workoutId: workout.id,
      calendarSessionId: workout.calendarSessionId ?? null,
      date: workout.date,
      template: workout.template,
      title: workout.title,
      exercises: cloneExercises(workout.exercises),
    })
    setNotice('openedSaved')
  }

  const openPlanned = (session: Session) => {
    const saved = history.find(w => w.calendarSessionId === session.id)
    if (saved) { openWorkout(saved); return }
    const template = templateForKind(session.kind)
    const previous = latestFor(history, template)
    setDraft({
      workoutId: null,
      calendarSessionId: session.id,
      date: session.date || localISODate(new Date()),
      template,
      title: session.title,
      exercises: previous ? copyExercisesAsPlan(previous.exercises) : workoutTemplates[template].map(makeExercise),
    })
    setNotice(previous ? 'openedPlanWithPrevious' : 'openedPlan')
  }

  const changeTemplate = (template: WorkoutTemplateKey) => {
    // An opened workout keeps its exercises; only its template changes.
    if (draft.workoutId != null) { patch({ template }); return }
    setDraft({ ...freshDraft(history, template, draft.date), calendarSessionId: draft.calendarSessionId })
    setNotice(latestFor(history, template) ? 'templateLoaded' : 'templateNew')
  }

  const loadPrevious = () => {
    const previous = latestFor(history, draft.template, draft.workoutId)
    if (!previous) { setNotice('noPrevious'); return }
    patch({ title: draft.title || previous.title, exercises: copyExercisesAsPlan(previous.exercises) })
    setNotice('previousLoaded')
  }

  const startNew = () => { setDraft(freshDraft(history, draft.template)); setNotice(null) }

  const save = () => {
    const updating = draft.workoutId != null
    const workout = journal.actions.saveStrengthWorkout(draft)
    patch({ workoutId: workout.id, calendarSessionId: workout.calendarSessionId ?? null })
    setNotice(updating ? 'updated' : 'saved')
  }

  const remove = (id: number) => {
    journal.actions.deleteStrengthWorkout(id)
    if (draft.workoutId === id) setDraft(freshDraft(history.filter(w => w.id !== id), draft.template))
    setNotice('deleted')
  }

  /** Most recent earlier result for an exercise, ignoring the workout being edited. */
  const previousSets = (exerciseName: string) => history
    .filter(w => w.id !== draft.workoutId && w.date <= draft.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .flatMap(w => w.exercises)
    .find(e => e.name === exerciseName)?.sets

  return {
    draft,
    notice,
    hasPrevious: Boolean(latestFor(history, draft.template, draft.workoutId)),
    setTitle: (title: string) => patch({ title }),
    setDate: (date: string) => patch({ date }),
    changeTemplate,
    loadPrevious,
    openWorkout,
    openPlanned,
    startNew,
    save,
    remove,
    previousSets,
    addExercise: (name: string) => updateExercises(list => [...list, makeExercise(name)]),
    removeExercise: (id: number) => updateExercises(list => list.filter(ex => ex.id !== id)),
    addSet: (exerciseId: number) => updateExercises(list => list.map(ex => ex.id === exerciseId ? { ...ex, sets: [...ex.sets, emptySet()] } : ex)),
    updateSet: (exerciseId: number, setId: number, changes: Partial<SetEntry>) =>
      updateExercises(list => list.map(ex => ex.id === exerciseId ? { ...ex, sets: ex.sets.map(st => st.id === setId ? { ...st, ...changes } : st) } : ex)),
  }
}

export type StrengthEditor = ReturnType<typeof useStrengthEditor>
