import { useState } from 'react'
import { Activity, Clock3, Dumbbell, Footprints, HeartPulse, Pencil, Trash2 } from 'lucide-react'
import type { RunCategory, RunningEntry, Session } from '../../types'
import type { Journal } from '../../state/useJournal'
import { activityKinds, runCategories } from '../../constants/activities'
import { paceToSeconds } from '../../domain/records'
import { useI18n } from '../../i18n'

type Metric = 'pace' | 'avgHr' | 'distance'
type Props = { journal: Journal; weekSessions: Session[]; cycleDayForDate: (date: string) => number | null; onEditRun: (run: RunningEntry) => void }

const metricValue = (run: RunningEntry, metric: Metric) =>
  metric === 'pace' ? paceToSeconds(run.pace) : metric === 'avgHr' ? Number(run.avgHr) : Number(run.distance)

export default function ProgressView({ journal, weekSessions, cycleDayForDate, onEditRun }: Props) {
  const { t, formatDate, sessionTitle } = useI18n()
  const [filter, setFilter] = useState<'all' | RunCategory>('all')
  const [metric, setMetric] = useState<Metric>('pace')
  const completed = weekSessions.filter(s => s.done)
  const totalKm = completed.reduce((a, s) => a + (s.distance || 0), 0)
  const totalMins = completed.reduce((a, s) => a + (s.duration || 0), 0)
  const totalKcal = completed.reduce((a, s) => a + (s.calories || 0), 0)

  const runs = journal.runs.slice().sort((a, b) => a.runDate.localeCompare(b.runDate))
  const filtered = runs.filter(r => filter === 'all' || r.runCategory === filter)
  const chartRuns = filtered.filter(r => Number.isFinite(metricValue(r, metric)) && metricValue(r, metric) > 0).slice(-8)
  const values = chartRuns.map(r => metricValue(r, metric))
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 1
  const x = (i: number) => values.length === 1 ? 50 : 24 + i * (252 / (values.length - 1))
  // Lower pace is better, so the pace axis is inverted.
  const y = (v: number) => 100 - (metric === 'pace' ? (max - v) : (v - min)) / (max - min || 1) * 72
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const shortDate = (date?: string) => date ? formatDate(date, { day: 'numeric', month: 'short' }) : ''
  const removeRun = (id: number) => { if (window.confirm(t.progress.confirmDeleteRun)) journal.actions.deleteRun(id) }

  return <>
    <section className="welcome"><div><div className="eyebrow">{t.progress.eyebrow}</div><h1>{t.progress.title}<span>.</span></h1><p>{t.progress.subtitle}</p></div></section>
    <section className="stats-grid">
      <div className="stat-card"><div className="stat-icon green"><Activity size={19}/></div><div className="stat-name">{t.progress.completed}</div><strong>{completed.length}</strong><div className="stat-foot">{t.progress.currentWeek}</div></div>
      <div className="stat-card"><div className="stat-icon peach"><Footprints size={19}/></div><div className="stat-name">{t.progress.run}</div><strong>{totalKm.toFixed(1)} <small>{t.common.km}</small></strong><div className="stat-foot">{t.progress.currentWeek}</div></div>
      <div className="stat-card"><div className="stat-icon lilac"><Clock3 size={19}/></div><div className="stat-name">{t.progress.activeTime}</div><strong>{totalMins} <small>{t.common.min}</small></strong><div className="stat-foot">{t.progress.currentWeek}</div></div>
      <div className="stat-card"><div className="stat-icon rose"><HeartPulse size={19}/></div><div className="stat-name">{t.progress.calories}</div><strong>{totalKcal}</strong><div className="stat-foot">{t.progress.caloriesFoot}</div></div>
    </section>
    <div className="panel">
      <div className="panel-title"><div><h2>{t.progress.distribution}</h2><p>{t.progress.distributionSubtitle}</p></div></div>
      <div className="distribution">{activityKinds.map(k => {
        const n = completed.filter(s => s.kind === k).length
        return <div className="dist-row" key={k}><span>{t.kinds[k]}</span><div className="bar"><i style={{ width: `${completed.length ? n / completed.length * 100 : 0}%` }}/></div><b>{n}</b></div>
      })}</div>
    </div>
    <section className="panel run-progress-panel">
      <div className="panel-title"><div><h2>{t.progress.runHistory}</h2><p>{t.progress.runHistorySubtitle}</p></div><Footprints className="muted-icon" size={20}/></div>
      <div className="run-filter-row">
        <div className="run-filter">
          <button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>{t.progress.all}</button>
          {runCategories.map(c => <button key={c} className={filter === c ? 'selected' : ''} onClick={() => setFilter(c)}>{t.runCategories[c]}</button>)}
        </div>
        <div className="run-metric">
          <button className={metric === 'pace' ? 'selected' : ''} onClick={() => setMetric('pace')}>{t.progress.metricPace}</button>
          <button className={metric === 'avgHr' ? 'selected' : ''} onClick={() => setMetric('avgHr')}>{t.progress.metricHr}</button>
          <button className={metric === 'distance' ? 'selected' : ''} onClick={() => setMetric('distance')}>{t.progress.metricDistance}</button>
        </div>
      </div>
      <div className="run-chart-wrap">{chartRuns.length >= 1 ? <>
        <div className="run-chart-summary"><b>{metric === 'pace' ? t.progress.chartPace : metric === 'avgHr' ? t.progress.chartHr : t.progress.chartDistance}</b><span>{t.progress.chartCount(chartRuns.length)}</span></div>
        <svg className="run-chart" viewBox="0 0 300 118" role="img" aria-label={t.progress.chartAria}>
          <line x1="20" y1="100" x2="276" y2="100"/><line x1="20" y1="28" x2="276" y2="28"/>
          <polyline points={points} fill="none" stroke="#917caa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          {values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="4" fill="#fff" stroke="#846d9e" strokeWidth="2"/>)}
        </svg>
        <div className="run-chart-labels"><span>{shortDate(chartRuns[0]?.runDate)}</span><span>{shortDate(chartRuns[chartRuns.length - 1]?.runDate)}</span></div>
        <div className="run-chart-note">{metric === 'pace' ? t.progress.notePace : metric === 'avgHr' ? t.progress.noteHr : t.progress.noteDistance}</div>
      </> : <div className="run-empty"><div className="empty-icon"><Footprints size={21}/></div><b>{t.progress.emptyTitle}</b><p>{t.progress.emptyText}</p></div>}</div>
      <div className="run-history-list">{filtered.length ? filtered.slice().reverse().slice(0, 10).map(run => {
        const cycleDay = run.runDate ? cycleDayForDate(run.runDate) : null
        return <div className="run-history-item" key={run.id}>
          <div className={`run-history-mark ${run.runCategory === 'quality' ? 'quality' : run.runCategory === 'long' ? 'long' : ''}`}><Footprints size={16}/></div>
          <button type="button" className="run-history-main history-open" onClick={() => onEditRun(run)}>
            <b>{sessionTitle(run)}</b>
            <small>{run.runDate ? formatDate(run.runDate, { day: 'numeric', month: 'long' }) : t.progress.noDate} · {t.runCategories[run.runCategory ?? 'easy']}{run.workType ? ` · ${t.workTypes[run.workType]}` : ''}{cycleDay ? ` · ${t.progress.cycleDay(cycleDay)}` : ''}</small>
          </button>
          <div className="run-history-values"><b>{run.distance ? `${run.distance} ${t.common.km}` : '—'}</b><small>{run.pace ? `${run.pace} ${t.common.perKm}` : run.avgHr ? `${run.avgHr} ${t.common.bpm}` : ''}</small></div>
          <div className="history-actions">
            <button className="delete-btn" type="button" onClick={() => onEditRun(run)} title={t.common.edit} aria-label={t.common.edit}><Pencil size={14}/></button>
            <button className="delete-btn" type="button" onClick={() => removeRun(run.id)} title={t.common.delete} aria-label={t.common.delete}><Trash2 size={14}/></button>
          </div>
        </div>
      }) : <p className="muted-text">{t.progress.noRuns}</p>}</div>
    </section>
    <div className="panel">
      <div className="panel-title"><div><h2>{t.progress.nextTitle}</h2><p>{t.progress.nextSubtitle}</p></div></div>
      <div className="feature-grid">
        <div><Dumbbell/><b>{t.progress.nextStrength}</b><small>{t.progress.nextStrengthText}</small></div>
        <div><Footprints/><b>{t.progress.nextRun}</b><small>{t.progress.nextRunText}</small></div>
        <div><HeartPulse/><b>{t.progress.nextRecovery}</b><small>{t.progress.nextRecoveryText}</small></div>
      </div>
    </div>
  </>
}
