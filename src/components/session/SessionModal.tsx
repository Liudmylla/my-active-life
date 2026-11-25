import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Check } from 'lucide-react'
import type { Kind, RunCategory, WorkType } from '../../types'
import type { SessionDraft } from '../../state/useJournal'
import { activityKinds, runCategories, workTypes } from '../../constants/activities'
import { useI18n } from '../../i18n'

export type SessionModalMode = 'new' | 'edit' | 'run'
type Props = { mode: SessionModalMode; initial: SessionDraft; onSave: (draft: SessionDraft) => void; onClose: () => void }

const toNumber = (value: string) => {
  const n = Number(value.replace(',', '.'))
  return value.trim() && Number.isFinite(n) && n > 0 ? n : undefined
}
const toText = (value?: number) => value == null ? '' : String(value)

export default function SessionModal({ mode, initial, onSave, onClose }: Props) {
  const { t, sessionTitle } = useI18n()
  const [kind, setKind] = useState<Kind>(initial.kind)
  const [date, setDate] = useState(initial.date)
  const [title, setTitle] = useState(initial.title)
  const [runCategory, setRunCategory] = useState<RunCategory>(initial.runCategory ?? 'easy')
  const [workType, setWorkType] = useState<WorkType>(initial.workType ?? 'intervals')
  const [duration, setDuration] = useState(toText(initial.duration))
  const [distance, setDistance] = useState(toText(initial.distance))
  const [pace, setPace] = useState(initial.pace ?? '')
  const [hr, setHr] = useState(toText(initial.avgHr))
  const [calories, setCalories] = useState(toText(initial.calories))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const isRun = kind === 'run'
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      kind, date, title,
      runCategory: isRun ? runCategory : undefined,
      workType: isRun && runCategory === 'quality' ? workType : undefined,
      duration: toNumber(duration),
      distance: isRun ? toNumber(distance) : undefined,
      pace: isRun ? pace.trim() || undefined : undefined,
      avgHr: isRun ? toNumber(hr) : undefined,
      calories: toNumber(calories),
    })
  }
  const heading = mode === 'new' ? t.sessionModal.newTitle : mode === 'run' ? t.sessionModal.editRunTitle : t.sessionModal.editTitle
  const placeholder = isRun ? sessionTitle({ title: '', kind, runCategory, workType }) : t.sessionModal.titlePlaceholder

  return <div className="modal-backdrop" onClick={onClose}>
    <form className="modal" role="dialog" aria-modal="true" aria-label={heading} onClick={e => e.stopPropagation()} onSubmit={submit}>
      <div className="modal-head">
        <div><div className="eyebrow">{mode === 'new' ? t.sessionModal.newEyebrow : t.sessionModal.editEyebrow}</div><h2>{heading}</h2></div>
        <button type="button" className="close" aria-label={t.common.close} onClick={onClose}>×</button>
      </div>
      <div className="form-two">
        {mode !== 'run' && <label>{t.sessionModal.kind}<select value={kind} onChange={e => setKind(e.target.value as Kind)}>{activityKinds.map(k => <option key={k} value={k}>{t.kinds[k]}</option>)}</select></label>}
        <label>{t.sessionModal.date}<input type="date" value={date} onChange={e => setDate(e.target.value)} required/></label>
      </div>
      {isRun && <div className="form-two">
        <label>{t.sessionModal.runCategory}<select value={runCategory} onChange={e => setRunCategory(e.target.value as RunCategory)}>{runCategories.map(c => <option key={c} value={c}>{t.runCategories[c]}</option>)}</select></label>
        {runCategory === 'quality' && <label>{t.sessionModal.workType}<select value={workType} onChange={e => setWorkType(e.target.value as WorkType)}>{workTypes.map(w => <option key={w} value={w}>{t.workTypes[w]}</option>)}</select></label>}
      </div>}
      <label>{t.sessionModal.title}<input value={title} onChange={e => setTitle(e.target.value)} placeholder={placeholder}/></label>
      <div className="form-two">
        <label>{t.sessionModal.duration}<input type="number" min="0" inputMode="numeric" value={duration} onChange={e => setDuration(e.target.value)}/></label>
        {isRun
          ? <label>{t.sessionModal.distance}<input type="number" min="0" step="0.1" inputMode="decimal" value={distance} onChange={e => setDistance(e.target.value)} placeholder="7.5"/></label>
          : <label>{t.sessionModal.calories}<input type="number" min="0" value={calories} onChange={e => setCalories(e.target.value)} placeholder={t.sessionModal.optional}/></label>}
      </div>
      {isRun && <div className="form-three">
        <label>{t.sessionModal.pace}<input value={pace} onChange={e => setPace(e.target.value)} placeholder="8:30" pattern="\d{1,2}:\d{2}"/></label>
        <label>{t.sessionModal.hr}<input type="number" min="0" value={hr} onChange={e => setHr(e.target.value)} placeholder="140"/></label>
        <label>{t.sessionModal.calories}<input type="number" min="0" value={calories} onChange={e => setCalories(e.target.value)} placeholder="—"/></label>
      </div>}
      <div className="modal-actions">
        <button type="button" className="outline" onClick={onClose}>{t.common.cancel}</button>
        <button type="submit" className="primary"><Check size={16}/> {mode === 'new' ? t.sessionModal.saveNew : t.sessionModal.saveEdit}</button>
      </div>
      {mode !== 'run' && <p className="modal-hint">{t.sessionModal.hint}</p>}
    </form>
  </div>
}
