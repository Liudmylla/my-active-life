import type { CycleLog, CyclePhase, Kind, RunCategory, RunningEntry, Session, StrengthWorkout, Symptom, WorkType, WorkoutTemplateKey } from '../types'
import { activityKinds, cyclePhases, runCategories, symptoms, workTypes } from '../constants/activities'

// Records written before i18n stored Russian display labels. They are mapped
// to stable keys on every read so old local and cloud data keep working.
const legacyKinds: Record<string, Kind> = {
  'Силовая · низ': 'strengthLower', 'Силовая · верх': 'strengthUpper', 'Full Body': 'fullBody',
  'Бег': 'run', 'Танцы': 'dance', 'Йога': 'yoga', 'Байк': 'bike', 'Пилатес': 'pilates',
}
const legacyRunCategories: Record<string, RunCategory> = { 'Лёгкий': 'easy', 'Длительный': 'long', 'Работа': 'quality' }
const legacyWorkTypes: Record<string, WorkType> = { 'Интервалы': 'intervals', 'Отрезки': 'repeats', 'Темповый бег': 'tempo' }
const legacyPhases: Record<string, CyclePhase> = {
  'Не отмечено': 'none', 'Менструация': 'menstrual', 'Фолликулярная': 'follicular',
  'Овуляторная': 'ovulatory', 'Лютеиновая': 'luteal', 'Не уверена': 'unsure',
}
const legacySymptoms: Record<string, Symptom> = {
  'Усталость': 'fatigue', 'Хорошая энергия': 'goodEnergy', 'Мигрень / головная боль': 'headache',
  'Вздутие': 'bloating', 'Болезненность груди': 'breastTenderness', 'Спазмы': 'cramps',
  'Нарушение сна': 'sleepIssues', 'Приливы / жар': 'hotFlashes', 'Низкое настроение': 'lowMood',
  'Повышенный аппетит': 'appetite', 'Хорошее самочувствие': 'feelingGood',
}
// Auto-generated titles are replaced by '' so the UI shows them in the current language.
const legacyDefaultTitles = new Set([
  'Лёгкий бег', 'Длительный бег', 'Работа · интервалы', 'Работа · отрезки', 'Работа · темповый бег',
  'Ноги и ягодицы', 'Спина, плечи, руки', 'Общая силовая', ...Object.keys(legacyKinds),
  'lowerBody', 'upperBody', 'fullBody',
])

const pick = <T extends string>(value: unknown, allowed: readonly T[], legacy: Record<string, T>): T | undefined => {
  if (typeof value !== 'string' || !value) return undefined
  if ((allowed as readonly string[]).includes(value)) return value as T
  return legacy[value]
}

export const normalizeKind = (value: unknown): Kind => pick(value, activityKinds, legacyKinds) ?? 'run'
export const normalizeRunCategory = (value: unknown) => pick(value, runCategories, legacyRunCategories)
export const normalizeWorkType = (value: unknown) => pick(value, workTypes, legacyWorkTypes)
export const normalizePhase = (value: unknown): CyclePhase => pick(value, cyclePhases, legacyPhases) ?? 'none'
export const normalizeSymptom = (value: string): string => pick(value, symptoms, legacySymptoms) ?? value
export const normalizeTitle = (value: unknown): string => {
  const title = typeof value === 'string' ? value.trim() : ''
  return legacyDefaultTitles.has(title) ? '' : title
}

export const normalizeWorkoutTemplate = (value: unknown): WorkoutTemplateKey => {
  const key = String(value ?? '').trim().toLowerCase()
  if (['lowerbody', 'низ тела', 'низ', 'ноги', 'ноги и ягодицы'].includes(key)) return 'lowerBody'
  if (['upperbody', 'верх тела', 'верх', 'спина, плечи, руки'].includes(key)) return 'upperBody'
  return 'fullBody'
}

export const normalizeSession = <T extends Session>(session: T): T => {
  const kind = normalizeKind(session.kind)
  const runCategory = kind === 'run' ? normalizeRunCategory(session.runCategory) ?? 'easy' : undefined
  return {
    ...session,
    kind,
    title: normalizeTitle(session.title),
    runCategory,
    workType: runCategory === 'quality' ? normalizeWorkType(session.workType) ?? 'intervals' : undefined,
  }
}
export const normalizeRunningEntry = (entry: RunningEntry): RunningEntry =>
  ({ ...normalizeSession(entry), kind: 'run', runDate: entry.runDate || entry.date || '' })

export const normalizeCycleLog = (log: CycleLog): CycleLog => ({
  ...log,
  phase: normalizePhase(log.phase),
  symptoms: Array.from(new Set((log.symptoms || []).map(normalizeSymptom))),
  note: log.note || '',
})

export const normalizeStrengthFields = (workout: StrengthWorkout): StrengthWorkout => ({
  ...workout,
  template: normalizeWorkoutTemplate(workout.template),
  title: normalizeTitle(workout.title),
})
