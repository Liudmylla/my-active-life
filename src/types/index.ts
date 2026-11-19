export type Kind = 'Силовая · низ' | 'Силовая · верх' | 'Full Body' | 'Бег' | 'Танцы' | 'Йога' | 'Байк' | 'Пилатес'
export type RunCategory = 'Лёгкий' | 'Длительный' | 'Работа'
export type WorkType = 'Интервалы' | 'Отрезки' | 'Темповый бег'

export type Session = {
  id: number
  day: number
  /** Calendar date in local YYYY-MM-DD format. Optional for legacy records. */
  date?: string
  kind: Kind
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
  note?: string
}

export type SetEntry = { id: number; kg: string; reps: string; done: boolean }
export type ExerciseEntry = { id: number; name: string; sets: SetEntry[] }
export type StrengthWorkout = { id: number; date: string; template: string; title: string; exercises: ExerciseEntry[]; calendarSessionId?: number | null }
export type CycleLog = { id: number; date: string; energy: number; symptoms: string[]; note: string; phase: string }
export type RunningEntry = Session & { runDate: string }
export type AppTab = 'week' | 'log' | 'progress' | 'cycle'
