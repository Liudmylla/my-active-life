import { Activity, Check, CirclePlus, Clock3, Footprints, HeartPulse, Leaf, Pencil, Plus, Sparkles, Target, Trash2 } from 'lucide-react'
import type { Session } from '../../types'
import type { Journal } from '../../state/useJournal'
import { iconFor, isStrengthKind } from '../../constants/activities'
import { useI18n } from '../../i18n'
import WeekCalendar from '../calendar/WeekCalendar'

type Props = {
  journal: Journal
  weekSessions: Session[]
  selectedDate: string
  weekStart: string
  onSelectDate: (date: string) => void
  onChangeWeek: (date: string) => void
  onAdd: () => void
  onEdit: (session: Session) => void
  onOpenStrength: (session: Session) => void
}

export default function WeekView({ journal, weekSessions, selectedDate, weekStart, onSelectDate, onChangeWeek, onAdd, onEdit, onOpenStrength }: Props) {
  const { t, formatDate, formatNumber, sessionTitle } = useI18n()
  const completed = weekSessions.filter(s => s.done)
  const totalKm = completed.reduce((a, s) => a + (s.distance || 0), 0)
  const totalMins = completed.reduce((a, s) => a + (s.duration || 0), 0)
  const totalKcal = completed.reduce((a, s) => a + (s.calories || 0), 0)
  const completion = weekSessions.length ? completed.length / weekSessions.length * 100 : 0
  const selected = journal.sessions.filter(s => s.date === selectedDate)
  const hasSavedWorkout = (id: number) => journal.strength.some(w => w.calendarSessionId === id)
  const remove = (id: number) => { if (window.confirm(t.week.confirmDelete)) journal.actions.deleteSession(id) }

  return <>
    <section className="welcome">
      <div>
        <div className="eyebrow">{formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toLocaleUpperCase(t.locale)}</div>
        <h1>{t.week.title}<span>.</span></h1><p>{t.week.subtitle}</p>
      </div>
      <button className="primary" onClick={onAdd}><Plus size={17}/> {t.week.addActivity}</button>
    </section>
    <WeekCalendar sessions={journal.sessions} selectedDate={selectedDate} weekStart={weekStart} onSelectDate={onSelectDate} onChangeWeek={onChangeWeek}/>
    <section className="run-rhythm">
      <div className="run-rhythm-heading"><div><span className="eyebrow">{t.week.rhythmEyebrow}</span><h2>{t.week.rhythmTitle}</h2><p>{t.week.rhythmSubtitle}</p></div><Footprints size={22}/></div>
      <div className="run-rhythm-grid">
        <div className="run-rhythm-item easy"><span>{t.calendar.weekdays[0].toUpperCase()}</span><b>{t.runCategories.easy}</b><small>{t.week.rhythmEasy}</small></div>
        <div className="run-rhythm-item quality"><span>{t.calendar.weekdays[3].toUpperCase()}</span><b>{t.runCategories.quality}</b><small>{t.week.rhythmQuality}</small></div>
        <div className="run-rhythm-item long"><span>{t.calendar.weekdays[5].toUpperCase()}</span><b>{t.runCategories.long}</b><small>{t.week.rhythmLong}</small></div>
      </div>
    </section>
    <section className="stats-grid">
      <div className="stat-card"><div className="stat-icon green"><Activity size={19}/></div><div className="stat-name">{t.week.statWorkouts}</div><strong>{completed.length}<small> / {weekSessions.length}</small></strong><div className="stat-foot">{t.week.statWorkoutsFoot}</div></div>
      <div className="stat-card"><div className="stat-icon peach"><Footprints size={19}/></div><div className="stat-name">{t.week.statDistance}</div><strong>{totalKm.toFixed(1)} <small>{t.common.km}</small></strong><div className="stat-foot">{t.week.statDistanceFoot}</div></div>
      <div className="stat-card"><div className="stat-icon lilac"><Clock3 size={19}/></div><div className="stat-name">{t.week.statTime}</div><strong>{Math.floor(totalMins / 60)}<small> {t.common.hours} </small>{totalMins % 60}<small> {t.common.min}</small></strong><div className="stat-foot">{t.week.statTimeFoot}</div></div>
      <div className="stat-card"><div className="stat-icon rose"><HeartPulse size={19}/></div><div className="stat-name">{t.week.statEnergy}</div><strong>{formatNumber(totalKcal)} <small>{t.common.kcal}</small></strong><div className="stat-foot">{t.week.statEnergyFoot}</div></div>
    </section>
    <section className="content-grid">
      <div className="panel schedule">
        <div className="panel-title">
          <div><h2>{formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2><p>{t.week.daySubtitle}</p></div>
          <button className="text-button" onClick={onAdd}><CirclePlus size={16}/> {t.common.add}</button>
        </div>
        {selected.length === 0
          ? <div className="empty"><div className="empty-icon"><Leaf/></div><b>{t.week.emptyTitle}</b><p>{t.week.emptyText}</p><button className="outline" onClick={onAdd}>{t.week.planWorkout}</button></div>
          : <div className="session-list">{selected.map(s => {
            const Icon = iconFor(s.kind)
            const kindLabel = s.kind === 'run' ? t.runCategories[s.runCategory ?? 'easy'] + (s.workType ? ` · ${t.workTypes[s.workType].toLowerCase()}` : '') : t.kinds[s.kind]
            return <div className={`session ${s.done ? 'finished' : ''}`} key={s.id}>
              <div className="session-icon"><Icon size={19}/></div>
              <div className="session-main">
                <div className="session-title">{sessionTitle(s)}</div>
                <div className="session-meta">{kindLabel}{s.duration ? ` · ${s.duration} ${t.common.min}` : ''}{s.distance ? ` · ${s.distance} ${t.common.km}` : ''}</div>
                {s.done && s.kind === 'run' && <div className="run-detail">{s.pace && <span>{t.week.pace(s.pace)}</span>}{s.avgHr && <span>{t.week.hr(s.avgHr)}</span>}{s.calories && <span>{s.calories} {t.common.kcal}</span>}</div>}
              </div>
              <div className="session-actions">
                {isStrengthKind(s.kind) && <button className="outline" onClick={() => onOpenStrength(s)} title={t.week.fillTitle}>{hasSavedWorkout(s.id) ? t.week.openDiary : t.week.fill}</button>}
                <button className={`check-btn ${s.done ? 'checked' : ''}`} onClick={() => journal.actions.toggleDone(s.id)} title={t.week.markDone} aria-label={t.week.markDone} aria-pressed={s.done}>{s.done ? <Check size={16}/> : <span/>}</button>
                <button className="delete-btn" onClick={() => onEdit(s)} title={t.common.edit} aria-label={t.common.edit}><Pencil size={15}/></button>
                <button className="delete-btn" onClick={() => remove(s.id)} title={t.common.delete} aria-label={t.common.delete}><Trash2 size={15}/></button>
              </div>
            </div>
          })}</div>}
      </div>
      <div className="panel side-panel">
        <div className="panel-title"><div><h2>{t.week.summaryTitle}</h2><p>{t.week.summarySubtitle}</p></div><Sparkles size={19} className="muted-icon"/></div>
        <div className="progress-line"><div className="progress-copy"><span>{t.week.planCompletion}</span><b>{Math.round(completion)}%</b></div><div className="bar"><i style={{ width: `${completion}%` }}/></div></div>
        <div className="mini-divider"/>
        <div className="tip"><div className="tip-icon"><Target size={18}/></div><div><b>{t.week.focusTitle}</b><p>{t.week.focusText}</p></div></div>
        <div className="weight-box">
          <div><span>{t.week.weight}</span><small>{t.week.weightHint}</small></div>
          <div className="weight-input"><input inputMode="decimal" value={journal.weight} onChange={e => journal.actions.updateWeight(e.target.value)} aria-label={t.week.weightLabel} placeholder="—"/><b>{t.common.kg}</b></div>
        </div>
      </div>
    </section>
  </>
}
