import type { Kind } from '../types'
import { Activity, Dumbbell, Footprints, Leaf, Waves } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const activityKinds: Kind[] = ['Силовая · низ', 'Силовая · верх', 'Full Body', 'Бег', 'Танцы', 'Йога', 'Байк', 'Пилатес']
export const weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
export const exerciseLibrary = ['Romanian Deadlift', 'Bulgarian split squat', 'Leg curl', 'Hip abduction', 'Cable kickback', 'Lat pulldown', 'Seated row', 'Face pull', 'Dumbbell bench press', 'Shoulder press', 'Goblet squat', 'Plank']
export const workoutTemplates: Record<string, string[]> = {
  'Низ тела': ['Romanian Deadlift', 'Bulgarian split squat', 'Leg curl', 'Hip abduction'],
  'Верх тела': ['Lat pulldown', 'Seated row', 'Face pull', 'Dumbbell bench press'],
  'Full Body': ['Romanian Deadlift', 'Goblet squat', 'Lat pulldown', 'Dumbbell bench press'],
}

export const iconFor = (kind: Kind): LucideIcon =>
  kind.includes('Силовая') || kind === 'Full Body' ? Dumbbell
    : kind === 'Бег' ? Footprints
      : kind === 'Йога' || kind === 'Пилатес' ? Leaf
        : kind === 'Байк' ? Activity : Waves
