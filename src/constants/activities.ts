import type { Kind } from '../types'
import { Activity, Dumbbell, Footprints, Leaf, Waves } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ExerciseKey, WorkoutTemplateKey } from '../i18n/catalog'

export const activityKinds: Kind[] = ['Силовая · низ', 'Силовая · верх', 'Full Body', 'Бег', 'Танцы', 'Йога', 'Байк', 'Пилатес']
export const weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
export const exerciseLibrary: ExerciseKey[] = ['romanianDeadlift','bulgarianSplitSquat','legCurl','legPress','hipAbduction','kickback','latPulldown','seatedRow','facePull','dumbbellBenchPress','shoulderExtension','tricepsExtensionCable','tricepsOverheadExtension','lateralRaise','lyingTricepsExtension','bicepsCurl','gobletSquat','plank']
export const workoutTemplates: Record<WorkoutTemplateKey, ExerciseKey[]> = {
  lowerBody: ['romanianDeadlift','bulgarianSplitSquat','legCurl','legPress','hipAbduction','kickback'],
  upperBody: ['latPulldown','seatedRow','facePull','dumbbellBenchPress','shoulderExtension','tricepsExtensionCable','tricepsOverheadExtension','lateralRaise','lyingTricepsExtension','bicepsCurl'],
  fullBody: ['romanianDeadlift','gobletSquat','latPulldown','dumbbellBenchPress'],
}
export const iconFor = (kind: Kind): LucideIcon =>
  kind.includes('Силовая') || kind === 'Full Body' ? Dumbbell
    : kind === 'Бег' ? Footprints
      : kind === 'Йога' || kind === 'Пилатес' ? Leaf
        : kind === 'Байк' ? Activity : Waves
