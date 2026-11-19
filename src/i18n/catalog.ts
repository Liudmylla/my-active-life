export const exerciseLibrary = ['romanianDeadlift','bulgarianSplitSquat','legCurl','legPress','hipAbduction','kickback','latPulldown','seatedRow','facePull','dumbbellBenchPress','shoulderExtension','tricepsExtensionCable','tricepsOverheadExtension','lateralRaise','lyingTricepsExtension','bicepsCurl','gobletSquat','plank'] as const
export type ExerciseKey = typeof exerciseLibrary[number]
export type WorkoutTemplateKey = 'lowerBody' | 'upperBody' | 'fullBody'
const ruExercises: Record<ExerciseKey,string> = {
  romanianDeadlift:'Румынская становая тяга',bulgarianSplitSquat:'Болгарские выпады',legCurl:'Сгибание ног',legPress:'Жим ногами',
  hipAbduction:'Отведение бедра',kickback:'Отведение ноги назад',latPulldown:'Тяга верхнего блока',seatedRow:'Горизонтальная тяга',
  facePull:'Тяга к лицу',dumbbellBenchPress:'Жим гантелей лёжа',shoulderExtension:'Разгибание плеча',
  tricepsExtensionCable:'Разгибание рук на блоке',tricepsOverheadExtension:'Разгибание из-за головы',lateralRaise:'Махи гантелями в стороны',
  lyingTricepsExtension:'Французский жим лёжа',bicepsCurl:'Сгибание рук на бицепс',gobletSquat:'Приседания с гантелью',plank:'Планка'
}
const ruTemplates: Record<WorkoutTemplateKey,string> = {lowerBody:'Низ тела',upperBody:'Верх тела',fullBody:'Full Body'}
const legacy: Record<string,ExerciseKey> = {
  'Romanian Deadlift':'romanianDeadlift','Bulgarian split squat':'bulgarianSplitSquat','Leg curl':'legCurl','Leg press':'legPress',
  'Hip abduction':'hipAbduction','Kickback':'kickback','Lat pulldown':'latPulldown','Seated row':'seatedRow','Face pull':'facePull',
  'Dumbbell bench press':'dumbbellBenchPress','Shoulder ':'shoulderExtension','Shoulder extension':'shoulderExtension','Goblet squat':'gobletSquat',
  'Plank':'plank','Triceps':'tricepsExtensionCable','Triceps extension cable':'tricepsExtensionCable',
  'Triceps extension hand behind the head':'tricepsOverheadExtension','Extension laterales 45 degrees':'lateralRaise',
  'Extension behind the head laying on the bench':'lyingTricepsExtension','biceps':'bicepsCurl',
  'Румынская становая тяга':'romanianDeadlift','Болгарские выпады':'bulgarianSplitSquat','Сгибание ног':'legCurl','Жим ногами':'legPress',
  'Отведение бедра':'hipAbduction','Отведение ноги назад':'kickback','Тяга верхнего блока':'latPulldown','Горизонтальная тяга':'seatedRow',
  'Тяга к лицу':'facePull','Жим гантелей лёжа':'dumbbellBenchPress','Разгибание плеча':'shoulderExtension',
  'Разгибание рук на блоке':'tricepsExtensionCable','Разгибание из-за головы':'tricepsOverheadExtension','Махи гантелями в стороны':'lateralRaise',
  'Французский жим лёжа':'lyingTricepsExtension','Сгибание рук на бицепс':'bicepsCurl','Приседания с гантелью':'gobletSquat','Планка':'plank'
}
export const normalizeExerciseKey = (value:string):ExerciseKey =>
  (exerciseLibrary as readonly string[]).includes(value) ? value as ExerciseKey : legacy[value] || 'romanianDeadlift'
export const normalizeTemplateKey = (value:string):WorkoutTemplateKey =>
  value==='lowerBody'||value==='Низ тела'?'lowerBody':value==='upperBody'||value==='Верх тела'?'upperBody':'fullBody'
export const exerciseLabel = (key:string):string => ruExercises[normalizeExerciseKey(key)]
export const templateLabel = (key:string):string => ruTemplates[normalizeTemplateKey(key)]
