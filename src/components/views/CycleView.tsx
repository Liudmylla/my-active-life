import { useState } from 'react'
import { Check, HeartPulse, Leaf, Plus } from 'lucide-react'
import type { CyclePhase } from '../../types'
import type { Journal } from '../../state/useJournal'
import { cyclePhases, symptoms } from '../../constants/activities'
import { useI18n } from '../../i18n'
import { localISODate } from '../../utils/dates'

type Props = { journal: Journal; cycleDayForDate: (date: string) => number | null }

export default function CycleView({ journal, cycleDayForDate }: Props) {
  const { t, formatDate, symptomLabel } = useI18n()
  const today = localISODate(new Date())
  const [periodDate, setPeriodDate] = useState(today)
  const [logDate, setLogDate] = useState(today)
  const [energy, setEnergy] = useState(3)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [phase, setPhase] = useState<CyclePhase>('none')
  const [note, setNote] = useState('')
  const currentCycleDay = cycleDayForDate(today)
  const recentLogs = journal.cycleLogs.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)

  const toggleSymptom = (value: string) => setSelectedSymptoms(prev => prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value])
  const saveLog = () => {
    journal.actions.saveCycleLog({ date: logDate, energy, symptoms: selectedSymptoms, note, phase })
    setNote('')
  }

  return <>
    <section className="welcome"><div><div className="eyebrow">CYCLE & PERFORMANCE</div><h1>{t.cycle.title}<span>.</span></h1><p>{t.cycle.subtitle}</p></div></section>
    <section className="cycle-current panel">
      <div className="panel-title"><div><h2>{t.cycle.current}</h2><p>{t.cycle.currentSubtitle}</p></div><HeartPulse className="muted-icon" size={21}/></div>
      <div className="cycle-day-display"><strong>{currentCycleDay ?? '—'}</strong><span>{currentCycleDay ? t.cycle.dayOfCycle : t.cycle.noStart}</span></div>
      <div className="cycle-date-row">
        <label>{t.cycle.firstDay}<input type="date" value={periodDate} onChange={e => setPeriodDate(e.target.value)}/></label>
        <button className="primary" onClick={() => journal.actions.addPeriodStart(periodDate)}><Plus size={15}/> {t.cycle.recordStart}</button>
      </div>
      <p className="cycle-disclaimer">{t.cycle.disclaimer}</p>
    </section>
    <section className="panel cycle-log-panel">
      <div className="panel-title"><div><h2>{t.cycle.dailyTitle}</h2><p>{t.cycle.dailySubtitle}</p></div><Leaf className="muted-icon" size={20}/></div>
      <div className="cycle-form-grid">
        <label>{t.cycle.logDate}<input type="date" value={logDate} onChange={e => setLogDate(e.target.value)}/></label>
        <label>{t.cycle.phase}<select value={phase} onChange={e => setPhase(e.target.value as CyclePhase)}>{cyclePhases.map(p => <option key={p} value={p}>{t.phases[p]}</option>)}</select></label>
      </div>
      <div className="cycle-energy"><b>{t.cycle.energy}</b><div>{[1, 2, 3, 4, 5].map(n => <button key={n} className={energy === n ? 'selected' : ''} onClick={() => setEnergy(n)} aria-pressed={energy === n}>{n}</button>)}</div><small>{t.cycle.energyScale}</small></div>
      <div className="cycle-symptoms"><b>{t.cycle.symptomsTitle}</b><div>{symptoms.map(x => <button key={x} className={selectedSymptoms.includes(x) ? 'selected' : ''} onClick={() => toggleSymptom(x)} aria-pressed={selectedSymptoms.includes(x)}>{t.symptoms[x]}</button>)}</div></div>
      <label className="cycle-note-label">{t.cycle.note}<textarea value={note} onChange={e => setNote(e.target.value)} placeholder={t.cycle.notePlaceholder} rows={3}/></label>
      <button className="primary" onClick={saveLog}><Check size={16}/> {t.cycle.saveLog}</button>
    </section>
    <section className="panel">
      <div className="panel-title"><div><h2>{t.cycle.historyTitle}</h2><p>{t.cycle.historySubtitle}</p></div></div>
      {journal.periodStarts.length
        ? journal.periodStarts.slice().reverse().map(d => <div className="cycle-history-row" key={d}><span className="history-dot"/><div><b>{t.cycle.periodStart}</b><small>{formatDate(d, { day: 'numeric', month: 'long', year: 'numeric' })}</small></div><strong>{t.cycle.day1}</strong></div>)
        : <p className="muted-text">{t.cycle.historyEmpty}</p>}
      {recentLogs.length > 0 && <>
        <div className="mini-divider"/>
        <h3 className="cycle-subheading">{t.cycle.recentLogs}</h3>
        {recentLogs.map(x => {
          const day = cycleDayForDate(x.date)
          return <div className="cycle-history-row" key={x.id}>
            <span className="history-dot"/>
            <div><b>{formatDate(x.date, { day: 'numeric', month: 'long' })} · {t.cycle.energyValue(x.energy)}</b><small>{x.symptoms.map(symptomLabel).join(' · ') || t.cycle.noSymptoms}{x.note ? ` · ${x.note}` : ''}</small></div>
            <strong>{day ? t.cycle.cycleDayShort(day) : '—'}</strong>
          </div>
        })}
      </>}
    </section>
    <div className="cycle-disclaimer-bottom">{t.cycle.bottomDisclaimer}</div>
  </>
}
