import { useEffect, useState } from 'react'
import { Activity, CalendarDays, ChartNoAxesCombined, Check, CirclePlus, Clock3, Dumbbell, Footprints, HeartPulse, Leaf, Menu, Pencil, Plus, Sparkles, Target, Trash2, Waves } from 'lucide-react'
import { supabase } from './supabase'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import WeekCalendar from './components/calendar/WeekCalendar'

import type { Kind, RunCategory, WorkType, Session, SetEntry, ExerciseEntry, StrengthWorkout, CycleLog, RunningEntry, AppTab } from './types'
import { activityKinds as kinds, exerciseLibrary, workoutTemplates, iconFor } from './constants/activities'
import { addDays, ensureSessionDates, formatLocalDate, localISODate, parseLocalDate, startOfWeek } from './utils/dates'
import { exerciseLabel, templateLabel } from './i18n/catalog'
import type { WorkoutTemplateKey } from './i18n/catalog'
const initial: Session[] = [
  {id:1,day:0,kind:'Силовая · низ',title:'Ноги и ягодицы',planned:true,done:true,duration:55},
  {id:2,day:0,kind:'Бег',runCategory:'Лёгкий',title:'Лёгкий бег',planned:true,done:true,duration:52,distance:6.2,pace:'8:23',avgHr:137,calories:410},
  {id:3,day:1,kind:'Танцы',title:'Dance class',planned:true,done:true,duration:45},
  {id:4,day:2,kind:'Силовая · верх',title:'Спина, плечи, руки',planned:true,done:false,duration:50},
  {id:5,day:3,kind:'Бег',runCategory:'Работа',workType:'Интервалы',title:'Работа · интервалы',planned:true,done:false,duration:55,distance:7},
  {id:6,day:4,kind:'Full Body',title:'Общая силовая',planned:true,done:false,duration:45},
  {id:7,day:5,kind:'Бег',runCategory:'Длительный',title:'Длительный бег',planned:true,done:false,duration:80,distance:9},
]
const makeExercise = (name:string):ExerciseEntry => ({id:Date.now()+Math.random(),name,sets:[1,2,3].map((n)=>({id:Date.now()+Math.random()+n,kg:'',reps:'',done:false}))})

const freshId = (used:Set<number>) => {
  let id=Date.now()+Math.random()
  while(used.has(id)) id+=Math.random()+1
  used.add(id)
  return id
}
const normalizeIds = <T extends {id:number},>(items:T[]):T[] => {
  const used=new Set<number>()
  return items.map(item=>{
    const id=typeof item.id==='number'&&Number.isFinite(item.id)&&!used.has(item.id)?(used.add(item.id),item.id):freshId(used)
    return {...item,id}
  })
}
const normalizeStrength = (items:StrengthWorkout[]):StrengthWorkout[] => normalizeIds(items).map(workout=>({
  ...workout,
  exercises:normalizeIds((workout.exercises||[]).map(ex=>({
    ...ex,
    sets:normalizeIds(ex.sets||[])
  })))
}))

function App() {
  const [sessions,setSessions] = useState<Session[]>(()=>{try { const s=localStorage.getItem('mal-v2-sessions'); return ensureSessionDates(normalizeIds(s?JSON.parse(s):initial)) } catch { return ensureSessionDates(initial) }})
  const [tab,setTab] = useState<AppTab>('week')
  const [menuOpen,setMenuOpen] = useState(false)
  const [runCategoryFilter,setRunCategoryFilter] = useState<'Все'|RunCategory>('Все')
  const [runMetric,setRunMetric] = useState<'pace'|'avgHr'|'distance'>('pace')
  const [selectedDate,setSelectedDate] = useState(localISODate(new Date()))
  const [weekStart,setWeekStart] = useState(localISODate(startOfWeek(new Date())))
  const [modal,setModal] = useState(false)
  const [editingSessionId,setEditingSessionId] = useState<number | null>(null)
  const [kind,setKind] = useState<Kind>('Бег')
  const [title,setTitle] = useState('')
  const [runCategory,setRunCategory] = useState<RunCategory>('Лёгкий')
  const [workType,setWorkType] = useState<WorkType>('Интервалы')
  const [duration,setDuration] = useState('45')
  const [distance,setDistance] = useState('')
  const [pace,setPace] = useState('')
  const [hr,setHr] = useState('')
  const [cal,setCal] = useState('')
  const [weight,setWeight] = useState(()=>localStorage.getItem('mal-v2-weight')||'71')
  const [periodStarts,setPeriodStarts] = useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('mal-v2-period-starts')||'[]')}catch{return []}})
  const [cycleLogs,setCycleLogs] = useState<CycleLog[]>(()=>{try{return JSON.parse(localStorage.getItem('mal-v2-cycle-logs')||'[]')}catch{return []}})
  const [periodDate,setPeriodDate] = useState(localISODate(new Date()))
  const [cycleLogDate,setCycleLogDate] = useState(localISODate(new Date()))
  const [cycleEnergy,setCycleEnergy] = useState(3)
  const [cycleSymptoms,setCycleSymptoms] = useState<string[]>([])
  const [cyclePhase,setCyclePhase] = useState('Не отмечено')
  const [cycleNote,setCycleNote] = useState('')
  const [strengthHistory,setStrengthHistory] = useState<StrengthWorkout[]>(()=>{try { return normalizeStrength(JSON.parse(localStorage.getItem('mal-v2-strength')||'[]')) } catch { return [] }})
  const [runningHistory,setRunningHistory]=useState<RunningEntry[]>(()=>{try{return normalizeIds(JSON.parse(localStorage.getItem('mal-v2-running')||'[]'))}catch{return []}})
  const [template,setTemplate] = useState<WorkoutTemplateKey>('lowerBody')
  const [strengthDate,setStrengthDate] = useState(()=>localStorage.getItem('mal-v2-strength-date') || localISODate(new Date()))
  const [workoutTitle,setWorkoutTitle] = useState('Ноги и ягодицы')
  const [draftExercises,setDraftExercises] = useState<ExerciseEntry[]>(()=>{
    const previous = strengthHistory.find(w=>w.template==='lowerBody')
    return previous ? previous.exercises.map(ex=>({...ex,name:ex.name,id:Date.now()+Math.random(),sets:ex.sets.map(st=>({id:Date.now()+Math.random(),kg:st.kg,reps:st.reps,done:false}))})) : workoutTemplates.lowerBody.map(makeExercise)
  })
  const [newExercise,setNewExercise] = useState(exerciseLibrary[0])
  const [notice,setNotice] = useState('')
  const [user,setUser] = useState<{id:string;email?:string} | null>(null)
  const [authEmail,setAuthEmail] = useState('')
  const [authMessage,setAuthMessage] = useState('')
  const [cloudReady,setCloudReady] = useState(false)
  const [cloudStatus,setCloudStatus] = useState('Локальный режим')
  const weekEnd = localISODate(addDays(parseLocalDate(weekStart), 6))
  const weekSessions = sessions.filter(s => !!s.date && s.date >= weekStart && s.date <= weekEnd)
  const completed = weekSessions.filter(s=>s.done)
  const totalKm = completed.reduce((a,s)=>a+(s.distance||0),0)
  const totalMins = completed.reduce((a,s)=>a+(s.duration||0),0)
  const totalKcal = completed.reduce((a,s)=>a+(s.calories||0),0)
  const completedRuns = runningHistory.slice().sort((a,b)=>a.runDate.localeCompare(b.runDate))
  const filteredRuns = completedRuns.filter(s=>runCategoryFilter==='Все'||s.runCategory===runCategoryFilter)
  const chartRuns = filteredRuns.filter(s=>runMetric==='pace'?!!s.pace:runMetric==='avgHr'?!!s.avgHr:!!s.distance).slice(-8)
  const chartNumbers = chartRuns.map(s=>runMetric==='pace'?Number((s.pace||'').split(':')[0])*60+Number((s.pace||'').split(':')[1]||0):runMetric==='avgHr'?Number(s.avgHr):Number(s.distance))
  const chartMin = chartNumbers.length?Math.min(...chartNumbers):0
  const chartMax = chartNumbers.length?Math.max(...chartNumbers):1
  const chartY = (v:number) => 100-(runMetric==='pace'?(chartMax-v)/(chartMax-chartMin||1):(v-chartMin)/(chartMax-chartMin||1))*72
  const chartPoints = chartNumbers.map((v,i)=>`${chartNumbers.length===1?50:24+i*(252/(chartNumbers.length-1))},${chartY(v)}`).join(' ')
  const selected = sessions.filter(s=>s.date===selectedDate)
  const syncTable = async (table:string, rows:any[], conflict:string, idColumn:string, ids:number[]) => {
    if (!supabase || !user || !cloudReady) return false
    const { error: upsertError } = rows.length
      ? await supabase.from(table).upsert(rows, { onConflict: conflict })
      : { error: null }
    if (upsertError) throw upsertError
    let deletion = supabase.from(table).delete().eq('user_id', user.id)
    if (ids.length) deletion = deletion.not(idColumn, 'in', `(${ids.join(',')})`)
    const { error: deleteError } = await deletion
    if (deleteError) throw deleteError
    return true
  }
  const withCloudSave = async (key:string, action:()=>Promise<boolean>) => {
    
    if (!supabase || !user || !cloudReady) { setCloudStatus(user ? 'Ожидает синхронизации' : 'Локальный режим'); return }
    try {
      setCloudStatus('Сохраняем в облако…')
      await action()
      
      setCloudStatus('Все данные сохранены')
      setAuthMessage('')
    } catch (error:any) {
      setCloudStatus('Ошибка синхронизации')
      setAuthMessage(`Не удалось сохранить раздел «${key}»: ${error?.message || 'ошибка сети'}. Локальная копия сохранена.`)
    }
  }
  const saveSessionsCloud = (items:Session[]) => withCloudSave('calendar', async()=>{
    const rows=items.map(x=>({user_id:user!.id,id:x.id,session_date:x.date||localISODate(new Date()),day_of_week:x.day,kind:x.kind,title:x.title,planned:x.planned,done:x.done,recorded_at:x.recordedAt||null,run_category:x.runCategory||null,work_type:x.workType||null,duration_minutes:x.duration||null,distance_km:x.distance||null,pace:x.pace||null,avg_hr:x.avgHr||null,calories:x.calories||null,note:x.note||null,}))
    return syncTable('sessions',rows,'id','id',items.map(x=>x.id))
  })
  const saveRunningCloud = (items:RunningEntry[]) => withCloudSave('running', async()=>{
    const rows=items.map(x=>({user_id:user!.id,id:x.id,source_session_id:x.id,run_date:x.runDate,category:x.runCategory||null,work_type:x.workType||null,title:x.title,duration_minutes:x.duration||null,distance_km:x.distance||null,pace:x.pace||null,avg_hr:x.avgHr||null,calories:x.calories||null,note:x.note||null,}))
    return syncTable('running_history',rows,'id','id',items.map(x=>x.id))
  })
  const saveStrengthCloud = (items:StrengthWorkout[]) => withCloudSave('strength', async()=>{
    const rows=items.map(x=>({user_id:user!.id,id:x.id,workout_date:x.date.slice(0,10),template:x.template,title:x.title,exercises:x.exercises,}))
    return syncTable('strength_history',rows,'id','id',items.map(x=>x.id))
  })
  const saveDailyCloud = (starts:string[], logs:CycleLog[], currentWeight:string) => withCloudSave('daily', async()=>{
    const byDate=new Map<string,any>()
    for (const date of starts) byDate.set(date,{...(byDate.get(date)||{}),user_id:user!.id,entry_date:date,period_start:true})
    for (const log of logs) byDate.set(log.date,{...(byDate.get(log.date)||{}),user_id:user!.id,entry_date:log.date,energy:log.energy,symptoms:log.symptoms,notes:log.note||null,cycle_phase:log.phase||null,})
    const normalized=currentWeight.trim().replace(',','.')
    if (/^\d+(\.\d+)?$/.test(normalized)) {
      const date=localISODate(new Date())
      byDate.set(date,{...(byDate.get(date)||{}),user_id:user!.id,entry_date:date,weight_kg:Number(normalized)})
    }
    const rows=Array.from(byDate.values())
    // Merge with the existing date rows so a cycle edit never erases body metrics (or vice versa).
    const {data:existing,error}=await supabase!.from('daily_data').select('*').eq('user_id',user!.id)
    if(error) throw error
    const oldByDate=new Map((existing||[]).map((r:any)=>[r.entry_date,r]))
    const merged=rows.map((r:any)=>{
      const old:any=oldByDate.get(r.entry_date)||{}
      return {user_id:user!.id,entry_date:r.entry_date,weight_kg:r.weight_kg??old.weight_kg??null,waist_cm:old.waist_cm??null,hips_cm:old.hips_cm??null,sleep_hours:old.sleep_hours??null,energy:r.energy??old.energy??null,mood:old.mood??null,symptoms:r.symptoms??old.symptoms??[],cycle_phase:r.cycle_phase??old.cycle_phase??null,period_start:r.period_start??old.period_start??false,notes:r.notes??old.notes??null,}
    })
    const {error:upsertError}=merged.length?await supabase!.from('daily_data').upsert(merged,{onConflict:'user_id,entry_date'}):{error:null}
    if(upsertError) throw upsertError
    return true
  })
  const save = (next:Session[]) => {
    setSessions(next); localStorage.setItem('mal-v2-sessions',JSON.stringify(next)); void saveSessionsCloud(next)
  }
  const cycleDayForDate = (date:string) => {
    const starts = periodStarts.filter(d=>d<=date).sort()
    const start = starts[starts.length-1]
    if (!start) return null
    const a = new Date(`${start}T12:00:00`), b = new Date(`${date}T12:00:00`)
    return Math.floor((b.getTime()-a.getTime())/86400000)+1
  }
  const todayISO = localISODate(new Date())
  const currentCycleDay = cycleDayForDate(todayISO)
  const addPeriodStart = () => {
    const next=[...new Set([...periodStarts,periodDate])].sort()
    setPeriodStarts(next); localStorage.setItem('mal-v2-period-starts',JSON.stringify(next)); void saveDailyCloud(next,cycleLogs,weight)
  }
  const saveCycleLog = () => {
    const entry:CycleLog={id:Date.now(),date:cycleLogDate,energy:cycleEnergy,symptoms:cycleSymptoms,note:cycleNote,phase:cyclePhase}
    const next=[entry,...cycleLogs.filter(x=>x.date!==cycleLogDate)]
    setCycleLogs(next);localStorage.setItem('mal-v2-cycle-logs',JSON.stringify(next));void saveDailyCloud(periodStarts,next,weight);setCycleNote('')
  }
  const toggleSymptom = (value:string) => setCycleSymptoms(prev=>prev.includes(value)?prev.filter(x=>x!==value):[...prev,value])
  const addSession = () => {
    const runTitle=runCategory==='Работа'?`Работа · ${workType.toLowerCase()}`:runCategory==='Лёгкий'?'Лёгкий бег':'Длительный бег'
    const selectedDateObj=parseLocalDate(selectedDate)
    const edited=sessions.find(s=>s.id===editingSessionId)
    const updated:Session={...(edited||{} as Session),id:editingSessionId??Date.now(),day:(selectedDateObj.getDay()+6)%7,date:selectedDate,kind,title:title||(kind==='Бег'?runTitle:kind),runCategory:kind==='Бег'?runCategory:undefined,workType:kind==='Бег'&&runCategory==='Работа'?workType:undefined,planned:edited?.planned??true,done:edited?.done??false,recordedAt:edited?.recordedAt,duration:Number(duration)||undefined,distance:Number(distance)||undefined,pace:pace||undefined,avgHr:Number(hr)||undefined,calories:Number(cal)||undefined}
    const next=editingSessionId===null?[...sessions,updated]:sessions.map(s=>s.id===editingSessionId?updated:s)
    save(next)
    if (editingSessionId!==null && updated.kind==='Бег') {
      const historyNext=runningHistory.map(r=>r.id===updated.id?{...r,...updated,runDate:selectedDate,done:true}:r)
      if(historyNext.some(r=>r.id===updated.id)){setRunningHistory(historyNext);localStorage.setItem('mal-v2-running',JSON.stringify(historyNext));void saveRunningCloud(historyNext)}
    }
    setModal(false);setEditingSessionId(null);setTitle('');setDistance('');setPace('');setHr('');setCal('')
  }
  const editSession = (session:Session) => {
    const date=session.date||localISODate(new Date())
    setEditingSessionId(session.id);setSelectedDate(date);setWeekStart(localISODate(startOfWeek(parseLocalDate(date))))
    setKind(session.kind);setTitle(session.title);setRunCategory(session.runCategory||'Лёгкий');setWorkType(session.workType||'Интервалы')
    setDuration(String(session.duration??''));setDistance(String(session.distance??''));setPace(session.pace||'');setHr(String(session.avgHr??''));setCal(String(session.calories??''))
    setModal(true)
  }
  const toggleDone = (id:number) => {
    const target=sessions.find(s=>s.id===id); if(!target) return
    const completing=!target.done
    const next=sessions.map(s=>s.id===id?{...s,done:completing,recordedAt:completing?new Date().toISOString():undefined}:s)
    save(next)
    if(target.kind==='Бег' && completing) {
      // A completed calendar run is copied into its own history record.
      // Later calendar edits/unchecking/deleting must never remove that history entry.
      const updated=[...runningHistory.filter(r=>r.id!==target.id),{...target,done:true,recordedAt:new Date().toISOString(),runDate:target.date||localISODate(new Date())}]
      setRunningHistory(updated); localStorage.setItem('mal-v2-running',JSON.stringify(updated)); void saveRunningCloud(updated)
    }
  }
  const deleteSession = (id:number) => save(sessions.filter(s=>s.id!==id))
  const updateSet = (exerciseId:number,setId:number,patch:Partial<SetEntry>) => setDraftExercises(prev=>prev.map(ex=>ex.id===exerciseId?{...ex,sets:ex.sets.map(st=>st.id===setId?{...st,...patch}:st)}:ex))
  const loadPreviousWorkout = (value=template) => {
    const previous = strengthHistory.find(w=>w.template===value)
    if (!previous) { setNotice('Для этого шаблона пока нет сохранённой тренировки.'); return }
    setWorkoutTitle(previous.title)
    setDraftExercises(previous.exercises.map(ex=>({...ex,name:ex.name,id:Date.now()+Math.random(),sets:ex.sets.map(st=>({id:Date.now()+Math.random(),kg:st.kg,reps:st.reps,done:false}))})))
    setNotice('Подставили прошлые веса и повторы. Отметки выполнения сброшены — можно начинать!')
  }
  const changeTemplate = (value:WorkoutTemplateKey) => {
    setTemplate(value)
    const previous = strengthHistory.find(w=>w.template===value)
    if (previous) {
      setWorkoutTitle(previous.title)
      setDraftExercises(previous.exercises.map(ex=>({...ex,name:ex.name,id:Date.now()+Math.random(),sets:ex.sets.map(st=>({id:Date.now()+Math.random(),kg:st.kg,reps:st.reps,done:false}))})))
      setNotice('Загружены последние результаты этого шаблона. Можешь скорректировать их перед тренировкой.')
    } else {
      setWorkoutTitle(value==='lowerBody'?'Ноги и ягодицы':value==='upperBody'?'Спина, плечи, руки':'Общая силовая')
      setDraftExercises((workoutTemplates[value]||[]).map(makeExercise))
      setNotice('Это новый шаблон — добавь свои рабочие веса.')
    }
  }
  const saveStrengthWorkout = () => {
    const workout:StrengthWorkout={id:Date.now(),date:strengthDate,template,title:workoutTitle||template,exercises:draftExercises}
    const next=[workout,...strengthHistory]
    setStrengthHistory(next)
    localStorage.setItem('mal-v2-strength',JSON.stringify(next))
    void saveStrengthCloud(next)
    setNotice('Тренировка сохранена в дневник. Отличная работа!')
  }
  useEffect(() => {
    if (!supabase) { setCloudStatus('Локальный режим'); return }
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setAuthMessage(`Не удалось проверить вход: ${error.message}`)
      setUser(data.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null)
      setCloudReady(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !user) { setCloudReady(false); setCloudStatus('Локальный режим'); return }
    let cancelled=false
    const load=async()=>{
      setCloudStatus('Подключаем облако…')
      try {
        const [profile,sess,runs,strength,daily]=await Promise.all([
          supabase!.from('profiles').upsert({user_id:user!.id,email:user!.email||null,updated_at:new Date().toISOString()},{onConflict:'user_id'}),
          supabase!.from('sessions').select('*').eq('user_id',user!.id),
          supabase!.from('running_history').select('*').eq('user_id',user!.id).order('run_date',{ascending:true}),
          supabase!.from('strength_history').select('*').eq('user_id',user!.id).order('workout_date',{ascending:false}),
          supabase!.from('daily_data').select('*').eq('user_id',user!.id).order('entry_date',{ascending:true})
        ])
        for(const result of [profile,sess,runs,strength,daily]) if(result.error) throw result.error
        if(cancelled) return
        const cloudSessions=ensureSessionDates<Session>(normalizeIds((sess.data||[]).map((r:any)=>({id:r.id==null?NaN:Number(r.id),day:r.day_of_week,date:r.session_date,kind:r.kind,title:r.title,planned:r.planned,done:r.done,recordedAt:r.recorded_at||undefined,runCategory:r.run_category||undefined,workType:r.work_type||undefined,duration:r.duration_minutes||undefined,distance:r.distance_km==null?undefined:Number(r.distance_km),pace:r.pace||undefined,avgHr:r.avg_hr||undefined,calories:r.calories||undefined,note:r.note||undefined} as Session))))
        const cloudRuns=normalizeIds((runs.data||[]).map((r:any)=>({id:r.id==null?NaN:Number(r.id),day:0,date:r.run_date,kind:'Бег',done:true,planned:false,runDate:r.run_date,title:r.title,runCategory:r.category||undefined,workType:r.work_type||undefined,duration:r.duration_minutes||undefined,distance:r.distance_km==null?undefined:Number(r.distance_km),pace:r.pace||undefined,avgHr:r.avg_hr||undefined,calories:r.calories||undefined,note:r.note||undefined} as RunningEntry)))
        const cloudStrength=normalizeStrength((strength.data||[]).map((r:any)=>({id:r.id==null?NaN:Number(r.id),date:r.workout_date,template:r.template,title:r.title,exercises:r.exercises||[]} as StrengthWorkout)))
        const dailyRows=daily.data||[]
        const starts=dailyRows.filter((r:any)=>r.period_start).map((r:any)=>r.entry_date)
        const logs=dailyRows.filter((r:any)=>r.energy!=null||r.symptoms?.length||r.notes||r.cycle_phase).map((r:any)=>({id:Date.parse(r.entry_date),date:r.entry_date,energy:r.energy||3,symptoms:r.symptoms||[],note:r.notes||'',phase:r.cycle_phase||'Не отмечено'} as CycleLog))
        // Cloud is authoritative once the new tables have been populated; empty tables are seeded from local data once.
        const localSessions=normalizeIds(JSON.parse(localStorage.getItem('mal-v2-sessions')||'[]') as Session[])
        const localStrength=normalizeStrength(JSON.parse(localStorage.getItem('mal-v2-strength')||'[]') as StrengthWorkout[])
        const localRuns=normalizeIds(JSON.parse(localStorage.getItem('mal-v2-running')||'[]') as RunningEntry[])
        const localStarts=JSON.parse(localStorage.getItem('mal-v2-period-starts')||'[]') as string[]
        const localLogs=JSON.parse(localStorage.getItem('mal-v2-cycle-logs')||'[]') as CycleLog[]
        
        const useLocalSessions=!cloudSessions.length&&!!localSessions.length
        const useLocalStrength=!cloudStrength.length&&!!localStrength.length
        const useLocalRuns=!cloudRuns.length&&!!localRuns.length
        const finalSessions: Session[]=ensureSessionDates<Session>(useLocalSessions?localSessions!:cloudSessions)
        
        const finalStrength=useLocalStrength?localStrength!:cloudStrength
        const finalRuns=useLocalRuns?localRuns!:cloudRuns
        const useLocalStarts=!starts.length&&!!localStarts.length
        const useLocalLogs=!logs.length&&!!localLogs.length
        const finalStarts=useLocalStarts?localStarts!:starts
        const finalLogs=useLocalLogs?localLogs!:logs
        setSessions(finalSessions);localStorage.setItem('mal-v2-sessions',JSON.stringify(finalSessions))
        setStrengthHistory(finalStrength);localStorage.setItem('mal-v2-strength',JSON.stringify(finalStrength))
        setRunningHistory(finalRuns);localStorage.setItem('mal-v2-running',JSON.stringify(finalRuns))
        setPeriodStarts(finalStarts);localStorage.setItem('mal-v2-period-starts',JSON.stringify(finalStarts))
        setCycleLogs(finalLogs);localStorage.setItem('mal-v2-cycle-logs',JSON.stringify(finalLogs))
        const latestWeight=[...dailyRows].reverse().find((r:any)=>r.weight_kg!=null)
        if(latestWeight?.weight_kg!=null) setWeight(String(latestWeight.weight_kg))
        if(!cancelled) { setCloudReady(true);setCloudStatus('Облако синхронизировано');setAuthMessage('') }
        // Seed only tables that were empty in the cloud; never overwrite existing cloud history.
        if(useLocalSessions) void saveSessionsCloud(finalSessions)
        if(useLocalStrength) void saveStrengthCloud(finalStrength)
        if(useLocalRuns) void saveRunningCloud(finalRuns)
        if(useLocalStarts||useLocalLogs||!latestWeight) void saveDailyCloud(finalStarts,finalLogs,latestWeight?.weight_kg!=null?String(latestWeight.weight_kg):weight)
      } catch(error:any) { if(!cancelled){setCloudStatus('Ошибка облака');setAuthMessage(`Не удалось загрузить данные: ${error?.message||'ошибка сети'}`)} }
    }
    load()
    return ()=>{cancelled=true}
  },[user?.id])

  useEffect(()=>{ localStorage.setItem('mal-v2-strength-date',strengthDate); localStorage.setItem('mal-v2-weight',weight);localStorage.setItem('mal-v2-sessions',JSON.stringify(sessions));localStorage.setItem('mal-v2-period-starts',JSON.stringify(periodStarts));localStorage.setItem('mal-v2-cycle-logs',JSON.stringify(cycleLogs));localStorage.setItem('mal-v2-strength',JSON.stringify(strengthHistory));localStorage.setItem('mal-v2-running',JSON.stringify(runningHistory)) },[strengthDate,sessions,periodStarts,cycleLogs,strengthHistory,runningHistory])
  useEffect(()=>{
    if(!supabase||!user||!cloudReady) return
    const retry=()=>{
      
      
      
      
    }
    window.addEventListener('online',retry);retry();return()=>window.removeEventListener('online',retry)
  },[user?.id,cloudReady])
  useEffect(()=>{ if(supabase&&user&&cloudReady){const timer=window.setTimeout(()=>void saveDailyCloud(periodStarts,cycleLogs,weight),800);return()=>window.clearTimeout(timer)} },[weight])

  const sendMagicLink = async () => {
    if (!supabase || !authEmail.trim()) return
    setAuthMessage('Отправляем ссылку…')
    const { error } = await supabase.auth.signInWithOtp({ email: authEmail.trim(), options: { emailRedirectTo: window.location.origin } })
    setAuthMessage(error ? `Ошибка: ${error.message}` : 'Письмо отправлено. Открой его и перейди по ссылке для входа.')
  }
  const signOut = async () => { if (supabase) await supabase.auth.signOut(); setUser(null); setCloudReady(false); setCloudStatus('Локальный режим') }
  return <div className="app-shell">
    {menuOpen && <button className="sidebar-backdrop" type="button" aria-label="Закрыть меню" onClick={()=>setMenuOpen(false)}/>}
    <Sidebar tab={tab} open={menuOpen} onChange={setTab} onClose={()=>setMenuOpen(false)}/>
    <main className="main">
      <Topbar tab={tab} cloudReady={cloudReady} cloudStatus={cloudStatus} email={user?.email} onSignOut={signOut} onOpenMenu={()=>setMenuOpen(true)}/>
      {supabase && !user && <section className="panel auth-panel"><div className="panel-title"><div><h2>Подключить личный аккаунт</h2><p>Войди по ссылке из письма — пароль не нужен.</p></div><HeartPulse className="muted-icon" size={20}/></div><div className="auth-row"><input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="Твой email" aria-label="Email для входа"/><button className="primary" onClick={sendMagicLink} disabled={!authEmail.trim()}>Отправить ссылку</button></div>{authMessage && <p className="auth-message">{authMessage}</p>}<small className="auth-privacy">До входа дневник остаётся в этом браузере. После входа он будет связан с твоим личным аккаунтом Supabase.</small></section>}
      {user && <div className="account-strip">Вошла как <b>{user.email || 'личный аккаунт'}</b> · {cloudReady ? 'облачная синхронизация активна' : cloudStatus}</div>}
      {tab==='week' && <>
        <section className="welcome"><div><div className="eyebrow">{formatLocalDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toLocaleUpperCase('ru-RU')}</div><h1>Твоя активная неделя<span>.</span></h1><p>Не гонись за цифрами. Замечай, как много ты уже делаешь.</p></div><button className="primary" onClick={()=>setModal(true)}><Plus size={17}/> Добавить активность</button></section>
        <WeekCalendar sessions={sessions} selectedDate={selectedDate} weekStart={weekStart} onSelectDate={setSelectedDate} onChangeWeek={setWeekStart}/>
        <section className="run-rhythm"><div className="run-rhythm-heading"><div><span className="eyebrow">ТВОЙ БЕГОВОЙ РИТМ</span><h2>Три пробежки в неделю</h2><p>Три разные задачи — без лишней сложности.</p></div><Footprints size={22}/></div><div className="run-rhythm-grid"><div className="run-rhythm-item easy"><span>ПН</span><b>Лёгкий</b><small>Комфортное усилие</small></div><div className="run-rhythm-item quality"><span>ЧТ</span><b>Работа</b><small>Интервалы · отрезки · темпо</small></div><div className="run-rhythm-item long"><span>СБ</span><b>Длительный</b><small>Спокойная выносливость</small></div></div></section>
        <section className="stats-grid"><div className="stat-card"><div className="stat-icon green"><Activity size={19}/></div><div className="stat-name">Тренировки</div><strong>{completed.length}<small> / {weekSessions.length}</small></strong><div className="stat-foot">выполнено за неделю</div></div><div className="stat-card"><div className="stat-icon peach"><Footprints size={19}/></div><div className="stat-name">Беговая дистанция</div><strong>{totalKm.toFixed(1)} <small>км</small></strong><div className="stat-foot">суммарно за неделю</div></div><div className="stat-card"><div className="stat-icon lilac"><Clock3 size={19}/></div><div className="stat-name">Время активности</div><strong>{Math.floor(totalMins/60)}<small> ч </small>{totalMins%60}<small> мин</small></strong><div className="stat-foot">в движении</div></div><div className="stat-card"><div className="stat-icon rose"><HeartPulse size={19}/></div><div className="stat-name">Энергия</div><strong>{totalKcal.toLocaleString('ru-RU')} <small>ккал</small></strong><div className="stat-foot">по завершённым тренировкам</div></div></section>
        <section className="content-grid"><div className="panel schedule"><div className="panel-title"><div><h2>{formatLocalDate(parseLocalDate(selectedDate), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2><p>Запланированное и выполненное</p></div><button className="text-button" onClick={()=>setModal(true)}><CirclePlus size={16}/> Добавить</button></div>
          {selected.length===0?<div className="empty"><div className="empty-icon"><Leaf/></div><b>День свободен</b><p>Можно отдохнуть или добавить активность.</p><button className="outline" onClick={()=>setModal(true)}>Запланировать тренировку</button></div>:<div className="session-list">{selected.map(s=>{const I=iconFor(s.kind);return <div className={`session ${s.done?'finished':''}`} key={s.id}><div className="session-icon"><I size={19}/></div><div className="session-main"><div className="session-title">{s.title}</div><div className="session-meta">{s.kind==='Бег'?(s.runCategory||'Бег')+(s.workType?` · ${s.workType.toLowerCase()}`:''):s.kind} {s.duration?`· ${s.duration} мин`:''}{s.distance?` · ${s.distance} км`:''}</div>{s.done&&s.kind==='Бег'&&<div className="run-detail">{s.pace&&<span>Темп {s.pace}/км</span>}{s.avgHr&&<span>Пульс {s.avgHr}</span>}{s.calories&&<span>{s.calories} ккал</span>}</div>}</div><div className="session-actions"><button className={`check-btn ${s.done?'checked':''}`} onClick={()=>toggleDone(s.id)} title="Отметить выполнение">{s.done?<Check size={16}/>:<span/>}</button><button className="delete-btn" onClick={()=>editSession(s)} title="Редактировать" aria-label="Редактировать активность"><Pencil size={15}/></button><button className="delete-btn" onClick={()=>deleteSession(s.id)} title="Удалить"><Trash2 size={15}/></button></div></div>})}</div>}
        </div><div className="panel side-panel"><div className="panel-title"><div><h2>Маленькие итоги</h2><p>Что уже получилось</p></div><Sparkles size={19} className="muted-icon"/></div><div className="progress-line"><div className="progress-copy"><span>Выполнение плана</span><b>{weekSessions.length?Math.round(completed.length/weekSessions.length*100):0}%</b></div><div className="bar"><i style={{width:`${weekSessions.length?completed.length/weekSessions.length*100:0}%`}}/></div></div><div className="mini-divider"/><div className="tip"><div className="tip-icon"><Target size={18}/></div><div><b>Твой фокус</b><p>Сохраняй баланс между нагрузкой и восстановлением. Отдых — тоже часть прогресса.</p></div></div><div className="weight-box"><div><span>Текущий вес</span><small>Можно обновить вручную</small></div><div className="weight-input"><input value={weight} onChange={e=>setWeight(e.target.value)} aria-label="Вес в килограммах"/><b>кг</b></div></div></div></section>
      </>}
      {tab==='log' && <>
        <section className="welcome"><div><div className="eyebrow">СИЛОВОЙ ДНЕВНИК</div><h1>Тренировка в деталях<span>.</span></h1><p>Планируй подходы, фиксируй фактический вес и повторы — корректировать можно прямо по ходу занятия.</p></div></section>
        <div className="panel log-panel strength-builder">
          <div className="panel-title"><div><h2>Новая силовая тренировка</h2><p>План и факт хранятся вместе</p></div><span className="soft-tag">Зал</span></div>
          <div className="strength-top"><label>Шаблон тренировки<select value={template} onChange={e=>changeTemplate(e.target.value as WorkoutTemplateKey)}><option value="lowerBody">Низ тела</option><option value="upperBody">Верх тела</option><option value="fullBody">Full Body</option></select></label><label>Название<input value={workoutTitle} onChange={e=>setWorkoutTitle(e.target.value)} placeholder="Например, ноги и ягодицы"/></label><label>Дата тренировки<input type="date" value={strengthDate} onChange={e=>setStrengthDate(e.target.value)}/></label></div><div className="previous-workout-row"><div><b>Продолжить прогресс</b><small>{strengthHistory.some(w=>w.template===template)?'Загрузить веса и повторы из последней такой тренировки':'Когда сохранишь первую тренировку, здесь появятся прошлые результаты'}</small></div><button className="outline" onClick={()=>loadPreviousWorkout()} disabled={!strengthHistory.some(w=>w.template===template)}><Clock3 size={14}/> Взять прошлую</button></div>
          <div className="strength-exercises">{draftExercises.map((ex,index)=>{const previous=strengthHistory.flatMap(w=>w.exercises.map(e=>({date:w.date,name:e.name,sets:e.sets}))).find(e=>e.name===ex.name);return <div className="strength-exercise" key={ex.id}><div className="strength-ex-head"><div><span className="exercise-index">{String(index+1).padStart(2,'0')}</span><b>{exerciseLabel(ex.name)}</b>{previous&&<small>Предыдущий раз: {previous.sets.map(st=>`${st.kg||'—'} кг × ${st.reps||'—'}`).join(' · ')}</small>}</div><button className="delete-exercise" onClick={()=>setDraftExercises(prev=>prev.filter(item=>item.id!==ex.id))} aria-label="Удалить упражнение"><Trash2 size={15}/></button></div><div className="set-table"><div className="set-header"><span>Подход</span><span>Вес, кг</span><span>Повторы</span><span>Готово</span></div>{ex.sets.map((st,i)=><div className={`set-row ${st.done?'set-complete':''}`} key={st.id}><b>{i+1}</b><input aria-label={`Вес ${ex.name}, подход ${i+1}`} type="number" min="0" step="0.5" value={st.kg} onChange={e=>updateSet(ex.id,st.id,{kg:e.target.value})} placeholder="—"/><input aria-label={`Повторы ${ex.name}, подход ${i+1}`} type="number" min="0" value={st.reps} onChange={e=>updateSet(ex.id,st.id,{reps:e.target.value})} placeholder="—"/><button className={`set-check ${st.done?'checked':''}`} onClick={()=>updateSet(ex.id,st.id,{done:!st.done})} aria-label="Отметить подход">{st.done?<Check size={15}/>:null}</button></div>)}</div><button className="add-set" onClick={()=>setDraftExercises(prev=>prev.map(item=>item.id===ex.id?{...item,sets:[...item.sets,{id:Date.now()+Math.random(),kg:'',reps:'',done:false}]}:item))}><Plus size={14}/> Добавить подход</button></div>})}</div>
          <div className="add-exercise-row"><label>Добавить упражнение<select value={newExercise} onChange={e=>setNewExercise(e.target.value as typeof exerciseLibrary[number])}>{exerciseLibrary.map(name=><option key={name} value={name}>{exerciseLabel(name)}</option>)}</select></label><button className="outline" onClick={()=>setDraftExercises(prev=>[...prev,makeExercise(newExercise)])}><Plus size={15}/> Добавить</button></div>
          <div className="strength-footer"><span>{draftExercises.reduce((n,e)=>n+e.sets.length,0)} подходов · {draftExercises.reduce((n,e)=>n+e.sets.filter(st=>st.done).length,0)} выполнено</span><button className="primary" onClick={saveStrengthWorkout}><Check size={16}/> Сохранить тренировку</button></div>
          {notice&&<div className="notice">{notice}</div>}
        </div>
        <div className="panel"><div className="panel-title"><div><h2>История силовых</h2><p>Сохранённые тренировки и рабочие веса</p></div></div>{strengthHistory.length?strengthHistory.slice(0,8).map(w=><div className="strength-history" key={w.id}><div className="history-dot"/><div><b>{w.title}</b><small>{formatLocalDate(parseLocalDate(w.date),{day:'numeric',month:'long',year:'numeric'})} · {templateLabel(w.template)} · {w.exercises.length} упражнений</small><small>{w.exercises.map(e=>exerciseLabel(e.name)).join(' · ')}</small></div><span className="history-value">{w.exercises.reduce((n,e)=>n+e.sets.filter(st=>st.done).length,0)} подходов</span></div>):<p className="muted-text">Здесь появятся твои сохранённые силовые тренировки.</p>}</div>
      </>}
      {tab==='progress' && <><section className="welcome"><div><div className="eyebrow">ТВОЯ ДИНАМИКА</div><h1>Прогресс без спешки<span>.</span></h1><p>Смотри на тенденции, а не на отдельные цифры.</p></div></section><section className="stats-grid"><div className="stat-card"><div className="stat-icon green"><Activity size={19}/></div><div className="stat-name">Выполнено тренировок</div><strong>{completed.length}</strong><div className="stat-foot">за текущую неделю</div></div><div className="stat-card"><div className="stat-icon peach"><Footprints size={19}/></div><div className="stat-name">Бег</div><strong>{totalKm.toFixed(1)} <small>км</small></strong><div className="stat-foot">за текущую неделю</div></div><div className="stat-card"><div className="stat-icon lilac"><Clock3 size={19}/></div><div className="stat-name">Активное время</div><strong>{totalMins} <small>мин</small></strong><div className="stat-foot">за текущую неделю</div></div><div className="stat-card"><div className="stat-icon rose"><HeartPulse size={19}/></div><div className="stat-name">Калории</div><strong>{totalKcal}</strong><div className="stat-foot">если данные внесены</div></div></section><div className="panel"><div className="panel-title"><div><h2>Распределение активности</h2><p>По выполненным занятиям</p></div></div><div className="distribution">{kinds.map(k=>{const n=completed.filter(s=>s.kind===k).length;return <div className="dist-row" key={k}><span>{k}</span><div className="bar"><i style={{width:`${completed.length?n/completed.length*100:0}%`}}/></div><b>{n}</b></div>})}</div></div><section className="panel run-progress-panel"><div className="panel-title"><div><h2>История бега</h2><p>Три направления — один понятный прогресс</p></div><Footprints className="muted-icon" size={20}/></div><div className="run-filter-row"><div className="run-filter">{(['Все','Лёгкий','Работа','Длительный'] as const).map(value=><button key={value} className={runCategoryFilter===value?'selected':''} onClick={()=>setRunCategoryFilter(value)}>{value}</button>)}</div><div className="run-metric"><button className={runMetric==='pace'?'selected':''} onClick={()=>setRunMetric('pace')}>Темп</button><button className={runMetric==='avgHr'?'selected':''} onClick={()=>setRunMetric('avgHr')}>Пульс</button><button className={runMetric==='distance'?'selected':''} onClick={()=>setRunMetric('distance')}>Км</button></div></div><div className="run-chart-wrap">{chartRuns.length>=1?<><div className="run-chart-summary"><b>{runMetric==='pace'?'Темп, мин/км':runMetric==='avgHr'?'Средний пульс, уд/мин':'Дистанция, км'}</b><span>{chartRuns.length} тренировок</span></div><svg className="run-chart" viewBox="0 0 300 118" role="img" aria-label="График беговых тренировок"><line x1="20" y1="100" x2="276" y2="100"/><line x1="20" y1="28" x2="276" y2="28"/><polyline points={chartPoints} fill="none" stroke="#82a487" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{chartNumbers.map((v,i)=><circle key={i} cx={chartNumbers.length===1?50:24+i*(252/(chartNumbers.length-1))} cy={chartY(v)} r="4" fill="#fff" stroke="#739879" strokeWidth="2"/> )}</svg><div className="run-chart-labels"><span>{chartRuns[0]?.runDate?new Date(`${chartRuns[0].runDate}T12:00:00`).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):'Раньше'}</span><span>{chartRuns[chartRuns.length-1]?.runDate?new Date(`${chartRuns[chartRuns.length-1].runDate}T12:00:00`).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):'Последняя'}</span></div><div className="run-chart-note">{runMetric==='pace'?'Для темпа меньшее значение означает более быстрый бег.':runMetric==='avgHr'?'Сравнивай пульс при похожем темпе и условиях.':'Смотри, как меняется привычная дистанция.'}</div></>:<div className="run-empty"><div className="empty-icon"><Footprints size={21}/></div><b>Пока недостаточно данных для графика</b><p>Отметь выполненными хотя бы две пробежки с заполненным темпом, пульсом или дистанцией.</p></div>}</div><div className="run-history-list">{filteredRuns.length?filteredRuns.slice().reverse().slice(0,10).map(run=><div className="run-history-item" key={run.id}><div className={`run-history-mark ${run.runCategory==='Работа'?'quality':run.runCategory==='Длительный'?'long':''}`}><Footprints size={16}/></div><div className="run-history-main"><b>{run.title}</b><small>{run.runDate?new Date(`${run.runDate}T12:00:00`).toLocaleDateString('ru-RU',{day:'numeric',month:'long'}):'Дата не указана'} · {run.runCategory||'Бег'}{run.workType?` · ${run.workType}`:''}{run.runDate&&cycleDayForDate(run.runDate)?` · день цикла ${cycleDayForDate(run.runDate)}`:''}</small></div><div className="run-history-values"><b>{run.distance?`${run.distance} км`:'—'}</b><small>{run.pace?`${run.pace} /км`:run.avgHr?`${run.avgHr} уд/мин`:''}</small></div></div>):<p className="muted-text">В этой категории пока нет выполненных пробежек.</p>}</div></section><div className="panel"><div className="panel-title"><div><h2>Что будем отслеживать дальше</h2><p>Постепенно расширим аналитику</p></div></div><div className="feature-grid"><div><Dumbbell/><b>Силовые показатели</b><small>Рабочие веса, повторы, объём нагрузки</small></div><div><Footprints/><b>Беговая форма</b><small>Темп, пульс и дистанция в динамике</small></div><div><HeartPulse/><b>Восстановление</b><small>Самочувствие, сон и пульс</small></div></div></div></>}
      {tab==='cycle' && <>
        <section className="welcome"><div><div className="eyebrow">CYCLE & PERFORMANCE</div><h1>Цикл и самочувствие<span>.</span></h1><p>Сопоставляй тренировки с тем, как ты себя чувствуешь. Без шаблонов и обязательных 28 дней.</p></div></section>
        <section className="cycle-current panel">
          <div className="panel-title"><div><h2>Текущий цикл</h2><p>День считается от последней отмеченной даты начала менструации</p></div><HeartPulse className="muted-icon" size={21}/></div>
          <div className="cycle-day-display"><strong>{currentCycleDay ?? '—'}</strong><span>{currentCycleDay ? `день цикла` : 'дата начала не указана'}</span></div>
          <div className="cycle-date-row"><label>Первый день менструации<input type="date" value={periodDate} onChange={e=>setPeriodDate(e.target.value)}/></label><button className="primary" onClick={addPeriodStart}><Plus size={15}/> Записать начало</button></div>
          <p className="cycle-disclaimer">Мы не прогнозируем овуляцию и фазы по усреднённому календарю. При нерегулярном цикле день просто считается от последней фактически записанной даты. Если месячные не начались, счётчик продолжится — это не ошибка.</p>
        </section>
        <section className="panel cycle-log-panel">
          <div className="panel-title"><div><h2>Ежедневное самочувствие</h2><p>Короткая заметка поможет объяснить изменения в тренировках</p></div><Leaf className="muted-icon" size={20}/></div>
          <div className="cycle-form-grid"><label>Дата записи<input type="date" value={cycleLogDate} onChange={e=>setCycleLogDate(e.target.value)}/></label><label>Фаза (по желанию)<select value={cyclePhase} onChange={e=>setCyclePhase(e.target.value)}><option>Не отмечено</option><option>Менструация</option><option>Фолликулярная</option><option>Овуляторная</option><option>Лютеиновая</option><option>Не уверена</option></select></label></div>
          <div className="cycle-energy"><b>Энергия и готовность к нагрузке</b><div>{[1,2,3,4,5].map(n=><button key={n} className={cycleEnergy===n?'selected':''} onClick={()=>setCycleEnergy(n)}>{n}</button>)}</div><small>1 — очень низкая · 5 — отличная</small></div>
          <div className="cycle-symptoms"><b>Что замечаешь сегодня?</b><div>{['Усталость','Хорошая энергия','Мигрень / головная боль','Вздутие','Болезненность груди','Спазмы','Нарушение сна','Приливы / жар','Низкое настроение','Повышенный аппетит','Хорошее самочувствие'].map(x=><button key={x} className={cycleSymptoms.includes(x)?'selected':''} onClick={()=>toggleSymptom(x)}>{x}</button>)}</div></div>
          <label className="cycle-note-label">Заметка<textarea value={cycleNote} onChange={e=>setCycleNote(e.target.value)} placeholder="Например: ноги тяжелее обычного, бег дался сложнее…" rows={3}/></label>
          <button className="primary" onClick={saveCycleLog}><Check size={16}/> Сохранить самочувствие</button>
        </section>
        <section className="panel"><div className="panel-title"><div><h2>История цикла</h2><p>Фактические даты начала и дневник наблюдений</p></div></div>
          {periodStarts.length?periodStarts.slice().reverse().map(d=><div className="cycle-history-row" key={d}><span className="history-dot"/><div><b>Начало менструации</b><small>{new Date(`${d}T12:00:00`).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}</small></div><strong>День 1</strong></div>):<p className="muted-text">Добавь дату начала, чтобы приложение могло считать день цикла.</p>}
          {cycleLogs.length>0&&<><div className="mini-divider"/><h3 className="cycle-subheading">Последние записи самочувствия</h3>{cycleLogs.slice(0,8).map(x=><div className="cycle-history-row" key={x.id}><span className="history-dot"/><div><b>{new Date(`${x.date}T12:00:00`).toLocaleDateString('ru-RU',{day:'numeric',month:'long'})} · энергия {x.energy}/5</b><small>{x.symptoms.join(' · ')||'Симптомы не отмечены'}{x.note?` · ${x.note}`:''}</small></div><strong>{cycleDayForDate(x.date)?`ДЦ ${cycleDayForDate(x.date)}`:'—'}</strong></div>)}</>}
        </section>
        <div className="cycle-disclaimer-bottom">Это дневник наблюдений, а не медицинский прогноз. Связи между циклом и спортивными результатами будем показывать только по твоим фактическим записям — без предположений о том, как ты «должна» себя чувствовать в определённый день.</div>
      </>}
      <footer className="footer"><span>MY ACTIVE LIFE</span><span>Твой ритм. Твой прогресс.</span></footer>
    </main>
    {modal&&<div className="modal-backdrop" onClick={()=>setModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">{editingSessionId===null?'НОВАЯ ЗАПИСЬ':'РЕДАКТИРОВАНИЕ'}</div><h2>{editingSessionId===null?'Добавить активность':'Изменить активность'}</h2></div><button className="close" onClick={()=>{setModal(false);setEditingSessionId(null)}}>×</button></div><label>Тип активности<select value={kind} onChange={e=>setKind(e.target.value as Kind)}>{kinds.map(k=><option key={k}>{k}</option>)}</select></label>{kind==='Бег'&&<><label>Категория бега<select value={runCategory} onChange={e=>{const v=e.target.value as RunCategory;setRunCategory(v);setTitle('')}}><option>Лёгкий</option><option>Длительный</option><option>Работа</option></select></label>{runCategory==='Работа'&&<label>Вид работы<select value={workType} onChange={e=>{setWorkType(e.target.value as WorkType);setTitle('')}}><option>Интервалы</option><option>Отрезки</option><option>Темповый бег</option></select></label>}</>}<label>Название (необязательно)<input value={title} onChange={e=>setTitle(e.target.value)} placeholder={kind==='Бег'?(runCategory==='Работа'?`Работа · ${workType.toLowerCase()}`:runCategory==='Лёгкий'?'Лёгкий бег':'Длительный бег'):'Например, тренировка в зале'}/></label><div className="form-two"><label>Длительность, мин<input type="number" value={duration} onChange={e=>setDuration(e.target.value)}/></label>{kind==='Бег'?<label>Дистанция, км<input type="number" step="0.1" value={distance} onChange={e=>setDistance(e.target.value)} placeholder="7.5"/></label>:<label>Калории<input type="number" value={cal} onChange={e=>setCal(e.target.value)} placeholder="необязательно"/></label>}</div>{kind==='Бег'&&<div className="form-three"><label>Темп мин/км<input value={pace} onChange={e=>setPace(e.target.value)} placeholder="8:30"/></label><label>Пульс ср.<input type="number" value={hr} onChange={e=>setHr(e.target.value)} placeholder="140"/></label><label>Калории<input type="number" value={cal} onChange={e=>setCal(e.target.value)} placeholder="—"/></label></div>}<div className="modal-actions"><button className="outline" onClick={()=>{setModal(false);setEditingSessionId(null)}}>Отмена</button><button className="primary" onClick={addSession}><Check size={16}/> {editingSessionId===null?'Сохранить в план':'Сохранить изменения'}</button></div><p className="modal-hint">После тренировки отметь её выполненной — фактические данные можно будет скорректировать.</p></div></div>}
  </div>
}
export default App
