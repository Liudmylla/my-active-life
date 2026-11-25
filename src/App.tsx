import { useState } from 'react'
import type { AppTab, RunningEntry, Session } from './types'
import type { SessionDraft } from './state/useJournal'
import { useAuth } from './state/useAuth'
import { useJournal } from './state/useJournal'
import { useStrengthEditor } from './state/useStrengthEditor'
import { useI18n } from './i18n'
import { addDays, daysBetween, localISODate, parseLocalDate, startOfWeek } from './utils/dates'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import AuthPanel from './components/auth/AuthPanel'
import AccountStrip from './components/auth/AccountStrip'
import SessionModal from './components/session/SessionModal'
import type { SessionModalMode } from './components/session/SessionModal'
import WeekView from './components/views/WeekView'
import StrengthDiary from './components/views/StrengthDiary'
import ProgressView from './components/views/ProgressView'
import CycleView from './components/views/CycleView'

type ModalState = { mode: SessionModalMode; initial: SessionDraft; sessionId: number | null; run?: RunningEntry }

const draftFrom = (s: Session, date: string): SessionDraft => ({
  kind: s.kind, date, title: s.title, runCategory: s.runCategory, workType: s.workType,
  duration: s.duration, distance: s.distance, pace: s.pace, avgHr: s.avgHr, calories: s.calories, waterTemp: s.waterTemp,
})

function App() {
  const { t } = useI18n()
  const auth = useAuth()
  const journal = useJournal(auth.user)
  const strengthEditor = useStrengthEditor(journal)
  const [tab, setTab] = useState<AppTab>('week')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(localISODate(new Date()))
  const [weekStart, setWeekStart] = useState(localISODate(startOfWeek(new Date())))
  const [modal, setModal] = useState<ModalState | null>(null)

  const weekEnd = localISODate(addDays(parseLocalDate(weekStart), 6))
  const weekSessions = journal.sessions.filter(s => !!s.date && s.date >= weekStart && s.date <= weekEnd)
  const cycleDayForDate = (date: string) => {
    const start = journal.periodStarts.filter(d => d <= date).sort().pop()
    return start ? daysBetween(start, date) + 1 : null
  }

  const openNew = () => setModal({ mode: 'new', sessionId: null, initial: { kind: 'run', date: selectedDate, title: '', runCategory: 'easy', duration: 45 } })
  const openEdit = (session: Session) => {
    const date = session.date || localISODate(new Date())
    setSelectedDate(date)
    setWeekStart(localISODate(startOfWeek(parseLocalDate(date))))
    setModal({ mode: 'edit', sessionId: session.id, initial: draftFrom(session, date) })
  }
  const openRun = (run: RunningEntry) => setModal({ mode: 'run', sessionId: null, run, initial: draftFrom(run, run.runDate) })
  const saveModal = (draft: SessionDraft) => {
    if (!modal) return
    if (modal.mode === 'run' && modal.run) journal.actions.updateRun({ ...modal.run, ...draft, kind: 'run', title: draft.title.trim(), runDate: draft.date })
    else {
      journal.actions.saveSession(draft, modal.sessionId)
      setSelectedDate(draft.date)
      setWeekStart(localISODate(startOfWeek(parseLocalDate(draft.date))))
    }
    setModal(null)
  }
  const openStrength = (session: Session) => { strengthEditor.openPlanned(session); setTab('log') }
  const cloudErrorMessage = journal.cloudError
    ? journal.cloudError.section === 'load'
      ? t.cloud.loadFailed(journal.cloudError.message || t.common.networkError)
      : t.cloud.saveFailed(t.cloud.sections[journal.cloudError.section], journal.cloudError.message || t.common.networkError)
    : undefined

  return <div className="app-shell">
    {menuOpen && <button className="sidebar-backdrop" type="button" aria-label={t.nav.closeMenu} onClick={() => setMenuOpen(false)}/>}
    <Sidebar tab={tab} open={menuOpen} email={auth.user?.email} onChange={setTab} onClose={() => setMenuOpen(false)}/>
    <main className="main">
      <Topbar tab={tab} cloudReady={journal.cloudReady} cloudStatus={journal.cloudStatus} email={auth.user?.email} onSignOut={auth.signOut} onOpenMenu={() => setMenuOpen(true)}/>
      {auth.enabled && !auth.checking && !auth.user && <AuthPanel auth={auth}/>}
      {auth.user && <AccountStrip auth={auth} cloudReady={journal.cloudReady} cloudStatus={journal.cloudStatus} errorMessage={cloudErrorMessage}/>}
      {tab === 'week' && <WeekView journal={journal} weekSessions={weekSessions} selectedDate={selectedDate} weekStart={weekStart} onSelectDate={setSelectedDate} onChangeWeek={setWeekStart} onAdd={openNew} onEdit={openEdit} onOpenStrength={openStrength}/>}
      {tab === 'log' && <StrengthDiary editor={strengthEditor} history={journal.strength} sessions={journal.sessions}/>}
      {tab === 'progress' && <ProgressView journal={journal} weekSessions={weekSessions} cycleDayForDate={cycleDayForDate} onEditRun={openRun}/>}
      {tab === 'cycle' && <CycleView journal={journal} cycleDayForDate={cycleDayForDate}/>}
      <footer className="footer"><span>{t.footer.brand}</span><span>{t.footer.motto}</span></footer>
    </main>
    {modal && <SessionModal key={`${modal.mode}-${modal.sessionId ?? modal.run?.id ?? 'new'}`} mode={modal.mode} initial={modal.initial} onSave={saveModal} onClose={() => setModal(null)}/>}
  </div>
}

export default App
