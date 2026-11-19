import type { Kind } from '../types'
import { Activity, Dumbbell, Footprints, Leaf, Waves } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const activityKinds: Kind[] = ['Силовая · низ', 'Силовая · верх', 'Full Body', 'Бег', 'Танцы', 'Йога', 'Байк', 'Пилатес']
export const weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
export const exerciseLibrary = ['Romanian Deadlift', 'Bulgarian split squat', 'Leg curl','Leg press', 'Hip abduction', 'Kickback', 'Lat pulldown', 'Seated row', 'Face pull', 'Dumbbell bench press', 'Shoulder ', 'Goblet squat', 'Plank','Triceps']
export const workoutTemplates: Record<string, string[]> = {
  'Низ тела': ['Romanian Deadlift', 'Bulgarian split squat', 'Leg curl', 'Leg press','Hip abduction','Kickback'],
  'Верх тела': ['Lat pulldown', 'Seated row', 'Face pull', 'Dumbbell bench press', 'Shoulder extension','Triceps extension cable','Triceps extension hand behind the head','Extension laterales 45 degrees','Extension behind the head laying on the bench','biceps'],
  'Full Body': ['Romanian Deadlift', 'Goblet squat', 'Lat pulldown', 'Dumbbell bench press'],
}

export const iconFor = (kind: Kind): LucideIcon =>
  kind.includes('Силовая') || kind === 'Full Body' ? Dumbbell
    : kind === 'Бег' ? Footprints
      : kind === 'Йога' || kind === 'Пилатес' ? Leaf
        : kind === 'Байк' ? Activity : Waves
