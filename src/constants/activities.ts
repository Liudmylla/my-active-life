import type { CyclePhase, Kind, RunCategory, Symptom, WorkType, WorkoutTemplateKey } from '../types'
import { Activity, Dumbbell, Footprints, Leaf, Snowflake, Waves } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const activityKinds: Kind[] = ['strengthLower', 'strengthUpper', 'fullBody', 'run', 'dance', 'yoga', 'bike', 'pilates', 'coldBath']
export const strengthKinds: Kind[] = ['strengthLower', 'strengthUpper', 'fullBody']
export const runCategories: RunCategory[] = ['easy', 'long', 'quality']
export const workTypes: WorkType[] = ['intervals', 'repeats', 'tempo']
export const cyclePhases: CyclePhase[] = ['none', 'menstrual', 'follicular', 'ovulatory', 'luteal', 'unsure']
export const symptoms: Symptom[] = ['fatigue', 'goodEnergy', 'headache', 'bloating', 'breastTenderness', 'cramps', 'sleepIssues', 'hotFlashes', 'lowMood', 'appetite', 'feelingGood']
export const workoutTemplateKeys: WorkoutTemplateKey[] = ['lowerBody', 'upperBody', 'fullBody']

export const exerciseLibrary = ['romanianDeadlift', 'bulgarianSplitSquat', 'legCurl', 'legPress', 'hipAbduction', 'kickback', 'latPulldown', 'seatedRow', 'facePull', 'dumbbellBenchPress', 'shoulderExtension', 'tricepsExtensionCable', 'tricepsOverheadExtension', 'lateralRaise', 'lyingTricepsExtension', 'bicepsCurl', 'gobletSquat', 'plank'] as const
export type ExerciseKey = typeof exerciseLibrary[number]

export const workoutTemplates: Record<WorkoutTemplateKey, ExerciseKey[]> = {
  lowerBody: ['romanianDeadlift', 'bulgarianSplitSquat', 'legCurl', 'legPress', 'hipAbduction', 'kickback'],
  upperBody: ['latPulldown', 'seatedRow', 'facePull', 'dumbbellBenchPress', 'shoulderExtension', 'tricepsExtensionCable', 'tricepsOverheadExtension', 'lateralRaise', 'lyingTricepsExtension', 'bicepsCurl'],
  fullBody: ['romanianDeadlift', 'gobletSquat', 'latPulldown', 'dumbbellBenchPress'],
}

export const isStrengthKind = (kind: Kind) => strengthKinds.includes(kind)
export const templateForKind = (kind: Kind): WorkoutTemplateKey =>
  kind === 'strengthUpper' ? 'upperBody' : kind === 'fullBody' ? 'fullBody' : 'lowerBody'
export const kindForTemplate = (template: WorkoutTemplateKey): Kind =>
  template === 'upperBody' ? 'strengthUpper' : template === 'fullBody' ? 'fullBody' : 'strengthLower'

export const iconFor = (kind: Kind): LucideIcon =>
  isStrengthKind(kind) ? Dumbbell
    : kind === 'run' ? Footprints
      : kind === 'coldBath' ? Snowflake
      : kind === 'yoga' || kind === 'pilates' ? Leaf
        : kind === 'bike' ? Activity : Waves
