export type Kind = 'strengthLower' | 'strengthUpper' | 'fullBody' | 'run' | 'dance' | 'yoga' | 'bike' | 'pilates' | 'coldBath'
export type RunCategory = 'easy' | 'long' | 'quality'
export type WorkType = 'intervals' | 'repeats' | 'tempo'
export type CyclePhase = 'none' | 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unsure'
export type Symptom = 'fatigue' | 'goodEnergy' | 'headache' | 'bloating' | 'breastTenderness' | 'cramps' | 'sleepIssues' | 'hotFlashes' | 'lowMood' | 'appetite' | 'feelingGood'
export type WorkoutTemplateKey = 'lowerBody' | 'upperBody' | 'fullBody'

export type Session = {
  id: number
  day: number
  /** Calendar date in local YYYY-MM-DD format. Optional for legacy records. */
  date?: string
  kind: Kind
  /** Empty string means "use the translated default title". */
  title: string
  planned: boolean
  done: boolean
  recordedAt?: string
  runCategory?: RunCategory
  workType?: WorkType
  duration?: number
  distance?: number
  pace?: string
  avgHr?: number
  calories?: number
  /** Water temperature in °C (cold bath only). */
  waterTemp?: number
  note?: string
}

export type SetEntry = { id: number; kg: string; reps: string; done: boolean }
export type ExerciseEntry = { id: number; name: string; sets: SetEntry[] }
export type StrengthWorkout = { id: number; date: string; template: WorkoutTemplateKey; title: string; exercises: ExerciseEntry[]; calendarSessionId?: number | null }
export type CycleLog = { id: number; date: string; energy: number; symptoms: string[]; note: string; phase: CyclePhase }
export type RunningEntry = Session & { runDate: string }
export type AppTab = 'week' | 'log' | 'progress' | 'cycle'

export type CloudSection = 'calendar' | 'running' | 'strength' | 'daily'
export type CloudStatus = 'local' | 'waiting' | 'connecting' | 'saving' | 'saved' | 'synced' | 'error' | 'loadError'
