import { useRef, useState } from 'react'
import { Check, Clock3, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import type { Session, StrengthWorkout, WorkoutTemplateKey } from '../../types'
import type { StrengthEditor } from '../../state/useStrengthEditor'
import { exerciseLibrary, workoutTemplateKeys } from '../../constants/activities'
import { completedSets } from '../../domain/records'
import { useI18n } from '../../i18n'

type Props = { editor: StrengthEditor; history: StrengthWorkout[]; sessions: Session[] }

const HISTORY_PREVIEW = 8

export default function StrengthDiary({ editor, history, sessions }: Props) {
  const { t, formatDate, exerciseLabel, templateLabel, workoutTitle } = useI18n()
  const [newExercise, setNewExercise] = useState<string>(exerciseLibrary[0])
  const [showAll, setShowAll] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const { draft } = editor
  const editing = draft.workoutId != null
  const editedWorkout = editing ? history.find(w => w.id === draft.workoutId) : undefined
  const sorted = history.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
  const visible = showAll ? sorted : sorted.slice(0, HISTORY_PREVIEW)
  const totalSets = draft.exercises.reduce((n, e) => n + e.sets.length, 0)
  const doneSets = draft.exercises.reduce((n, e) => n + e.sets.filter(st => st.done).length, 0)
  const longDate = (date: string) => formatDate(date, { day: 'numeric', month: 'long', year: 'numeric' })

  const open = (workout: StrengthWorkout) => {
    editor.openWorkout(workout)
    editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const remove = (workout: StrengthWorkout) => { if (window.confirm(t.strength.confirmDelete)) editor.remove(workout.id) }
  const linkLabel = (w: StrengthWorkout) => w.calendarSessionId == null ? t.strength.notLinked
    : sessions.find(s => s.id === w.calendarSessionId)?.done ? t.strength.linkedDone : t.strength.linkedPlanned

  return <>
    <section className="welcome"><div><div className="eyebrow">{t.strength.eyebrow}</div><h1>{t.strength.title}<span>.</span></h1><p>{t.strength.subtitle}</p></div></section>
    <div className="panel log-panel strength-builder" ref={editorRef}>
      <div className="panel-title">
        <div><h2>{editing ? t.strength.editWorkout : t.strength.newWorkout}</h2><p>{t.strength.panelSubtitle}</p></div>
        {editing || draft.calendarSessionId != null
          ? <button className="outline" type="button" onClick={editor.startNew}><RotateCcw size={14}/> {t.strength.startNew}</button>
          : <span className="soft-tag">{t.strength.gym}</span>}
      </div>
      {editing && <div className="notice editing-notice">{t.strength.editingBanner(editedWorkout ? workoutTitle(editedWorkout) : workoutTitle(draft), longDate(editedWorkout?.date ?? draft.date))}</div>}
      {!editing && draft.calendarSessionId != null && <div className="notice">{t.strength.fromPlan(formatDate(draft.date, { day: 'numeric', month: 'long' }))}</div>}
      <div className="strength-top">
        <label>{t.strength.template}<select value={draft.template} onChange={e => editor.changeTemplate(e.target.value as WorkoutTemplateKey)}>{workoutTemplateKeys.map(k => <option key={k} value={k}>{templateLabel(k)}</option>)}</select></label>
        <label>{t.strength.name}<input value={draft.title} onChange={e => editor.setTitle(e.target.value)} placeholder={t.defaultTitles[draft.template]}/></label>
        <label>{t.strength.date}<input type="date" value={draft.date} onChange={e => editor.setDate(e.target.value)}/></label>
      </div>
      <div className="previous-workout-row">
        <div><b>{t.strength.continueTitle}</b><small>{editor.hasPrevious ? t.strength.continueHint : t.strength.continueEmpty}</small></div>
        <button className="outline" onClick={editor.loadPrevious} disabled={!editor.hasPrevious}><Clock3 size={14}/> {t.strength.takePrevious}</button>
      </div>
      <div className="strength-exercises">{draft.exercises.map((ex, index) => {
        const previous = editor.previousSets(ex.name)
        const label = exerciseLabel(ex.name)
        return <div className="strength-exercise" key={ex.id}>
          <div className="strength-ex-head">
            <div>
              <span className="exercise-index">{String(index + 1).padStart(2, '0')}</span><b>{label}</b>
              {previous && <small>{t.strength.previousTime(previous.map(st => `${st.kg || '—'} ${t.common.kg} × ${st.reps || '—'}`).join(' · '))}</small>}
            </div>
            <button className="delete-exercise" onClick={() => editor.removeExercise(ex.id)} aria-label={t.strength.removeExercise}><Trash2 size={15}/></button>
          </div>
          <div className="set-table">
            <div className="set-header"><span>{t.strength.set}</span><span>{t.strength.weight}</span><span>{t.strength.reps}</span><span>{t.strength.done}</span></div>
            {ex.sets.map((st, i) => <div className={`set-row ${st.done ? 'set-complete' : ''}`} key={st.id}>
              <b>{i + 1}</b>
              <input aria-label={t.strength.weightAria(label, i + 1)} type="number" min="0" step="0.5" inputMode="decimal" value={st.kg} onChange={e => editor.updateSet(ex.id, st.id, { kg: e.target.value })} placeholder="—"/>
              <input aria-label={t.strength.repsAria(label, i + 1)} type="number" min="0" inputMode="numeric" value={st.reps} onChange={e => editor.updateSet(ex.id, st.id, { reps: e.target.value })} placeholder="—"/>
              <button className={`set-check ${st.done ? 'checked' : ''}`} onClick={() => editor.updateSet(ex.id, st.id, { done: !st.done })} aria-label={t.strength.markSet} aria-pressed={st.done}>{st.done ? <Check size={15}/> : null}</button>
            </div>)}
          </div>
          <button className="add-set" onClick={() => editor.addSet(ex.id)}><Plus size={14}/> {t.strength.addSet}</button>
        </div>
      })}</div>
      <div className="add-exercise-row">
        <label>{t.strength.addExercise}<select value={newExercise} onChange={e => setNewExercise(e.target.value)}>{exerciseLibrary.map(name => <option key={name} value={name}>{exerciseLabel(name)}</option>)}</select></label>
        <button className="outline" onClick={() => editor.addExercise(newExercise)}><Plus size={15}/> {t.common.add}</button>
      </div>
      <div className="strength-footer">
        <span>{t.strength.footer(totalSets, doneSets)}</span>
        <button className="primary" onClick={editor.save}><Check size={16}/> {editing ? t.strength.saveChanges : t.strength.save}</button>
      </div>
      {editor.notice && <div className="notice" role="status">{t.strength.notices[editor.notice]}</div>}
    </div>
    <div className="panel">
      <div className="panel-title"><div><h2>{t.strength.historyTitle}</h2><p>{t.strength.historySubtitle}</p></div></div>
      {sorted.length ? <>
        {visible.map(w => <div className={`strength-history ${w.id === draft.workoutId ? 'active' : ''}`} key={w.id}>
          <div className="history-dot"/>
          <button type="button" className="history-open" onClick={() => open(w)} aria-label={`${t.common.edit}: ${workoutTitle(w)}`}>
            <b>{workoutTitle(w)}{w.id === draft.workoutId && <span className="soft-tag inline-tag">{t.strength.editing}</span>}</b>
            <small>{longDate(w.date)} · {templateLabel(w.template)} · {t.strength.exercisesCount(w.exercises.length)}</small>
            <small>{w.exercises.map(e => exerciseLabel(e.name)).join(' · ')}</small>
            <small>{linkLabel(w)}</small>
          </button>
          <div className="history-side">
            <span className="history-value">{t.strength.setsCount(completedSets(w))}</span>
            <div className="history-actions">
              <button className="delete-btn" type="button" onClick={() => open(w)} title={t.common.edit} aria-label={t.common.edit}><Pencil size={15}/></button>
              <button className="delete-btn" type="button" onClick={() => remove(w)} title={t.common.delete} aria-label={t.common.delete}><Trash2 size={15}/></button>
            </div>
          </div>
        </div>)}
        {sorted.length > HISTORY_PREVIEW && <button type="button" className="text-button show-more" onClick={() => setShowAll(!showAll)}>{showAll ? t.common.showLess : t.common.showAll(sorted.length)}</button>}
      </> : <p className="muted-text">{t.strength.historyEmpty}</p>}
    </div>
  </>
}
