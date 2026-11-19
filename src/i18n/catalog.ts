export const exerciseLibrary = ['romanianDeadlift','bulgarianSplitSquat','legCurl','legPress','hipAbduction','kickback','latPulldown','seatedRow','facePull','dumbbellBenchPress','shoulderExtension','tricepsExtensionCable','tricepsOverheadExtension','lateralRaise','lyingTricepsExtension','bicepsCurl','gobletSquat','plank'] as const
export type ExerciseKey = typeof exerciseLibrary[number]
export type WorkoutTemplateKey = 'lowerBody' | 'upperBody' | 'fullBody'

export const exerciseLabels: Record<ExerciseKey,string> = {
  romanianDeadlift:'Румынская становая тяга',
  bulgarianSplitSquat:'Болгарские выпады',
  legCurl:'Сгибание ног',
  legPress:'Жим ногами',
  hipAbduction:'Отведение бедра',
  kickback:'Отведение ноги назад',
  latPulldown:'Тяга верхнего блока',
  seatedRow:'Горизонтальная тяга',
  facePull:'Тяга к лицу',
  dumbbellBenchPress:'Жим гантелей лёжа',
  shoulderExtension:'Разгибание плеча',
  tricepsExtensionCable:'Разгибание рук на блоке',
  tricepsOverheadExtension:'Разгибание из-за головы',
  lateralRaise:'Махи гантелями в стороны',
  lyingTricepsExtension:'Французский жим лёжа',
  bicepsCurl:'Сгибание рук на бицепс',
  gobletSquat:'Приседания с гантелью',
  plank:'Планка',
}
export const templateLabels: Record<WorkoutTemplateKey,string> = {
  lowerBody:'Низ тела',
  upperBody:'Верх тела',
  fullBody:'Full Body',
}
export const exerciseLabel = (key:string):string => exerciseLabels[key as ExerciseKey] ?? key
export const templateLabel = (key:string):string => templateLabels[key as WorkoutTemplateKey] ?? key
