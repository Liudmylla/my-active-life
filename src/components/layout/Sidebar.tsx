import { Activity, CalendarDays, ChartNoAxesCombined, HeartPulse, Leaf, Sparkles, X } from 'lucide-react'
import type { AppTab } from '../../types'
import { useI18n } from '../../i18n'
import LanguageSwitcher from './LanguageSwitcher'

type Props = { tab: AppTab; open: boolean; email?: string; onChange: (tab: AppTab) => void; onClose: () => void }

export default function Sidebar({ tab, open, email, onChange, onClose }: Props) {
  const { t } = useI18n()
  const go = (next: AppTab) => { onChange(next); onClose() }
  const items: { key: AppTab; icon: typeof Activity; label: string }[] = [
    { key: 'week', icon: CalendarDays, label: t.nav.week },
    { key: 'log', icon: Activity, label: t.nav.log },
    { key: 'progress', icon: ChartNoAxesCombined, label: t.nav.progress },
    { key: 'cycle', icon: HeartPulse, label: t.nav.cycle },
  ]
  return <aside className={`sidebar${open ? ' open' : ''}`}>
    <div className="brand"><div className="brand-mark"><Leaf size={21}/></div><div><b>my active life</b><small>{t.nav.brandTag}</small></div><button className="sidebar-close" type="button" aria-label={t.nav.closeMenu} onClick={onClose}><X size={18}/></button></div>
    <div className="side-label">{t.nav.space}</div>
    {items.map(({ key, icon: Icon, label }) => <button key={key} className={`nav-item ${tab === key ? 'active' : ''}`} onClick={() => go(key)}><Icon size={18}/> {label}</button>)}
    <div className="side-bottom">
      <LanguageSwitcher/>
      <div className="quote-card"><Sparkles size={17}/><p>{t.nav.quote}</p><small>{t.nav.quoteSub}</small></div>
      <div className="profile"><div className="avatar">{(email?.[0] || 'A').toUpperCase()}</div><div><b>{t.nav.profile}</b><small>{email || t.nav.profileSub}</small></div></div>
    </div>
  </aside>
}
