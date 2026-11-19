import { Activity, CalendarDays, ChartNoAxesCombined, HeartPulse, Leaf, Sparkles, X } from 'lucide-react'
import type { AppTab } from '../../types'

type Props = { tab: AppTab; open: boolean; onChange: (tab: AppTab) => void; onClose: () => void }

export default function Sidebar({ tab, open, onChange, onClose }: Props) {
  const go = (next: AppTab) => { onChange(next); onClose() }
  return <aside className={`sidebar${open ? ' open' : ''}`}>
    <div className="brand"><div className="brand-mark"><Leaf size={21}/></div><div><b>my active life</b><small>PERSONAL JOURNAL</small></div><button className="sidebar-close" type="button" aria-label="Закрыть меню" onClick={onClose}><X size={18}/></button></div>
    <div className="side-label">МОЁ ПРОСТРАНСТВО</div>
    <button className={`nav-item ${tab === 'week' ? 'active' : ''}`} onClick={() => go('week')}><CalendarDays size={18}/> Моя неделя</button>
    <button className={`nav-item ${tab === 'log' ? 'active' : ''}`} onClick={() => go('log')}><Activity size={18}/> Дневник</button>
    <button className={`nav-item ${tab === 'progress' ? 'active' : ''}`} onClick={() => go('progress')}><ChartNoAxesCombined size={18}/> Прогресс</button>
    <button className={`nav-item ${tab === 'cycle' ? 'active' : ''}`} onClick={() => go('cycle')}><HeartPulse size={18}/> Цикл и самочувствие</button>
    <div className="side-bottom"><div className="quote-card"><Sparkles size={17}/><p>Регулярность важнее идеальности.</p><small>Твой ритм — твои правила</small></div><div className="profile"><div className="avatar">A</div><div><b>Мой профиль</b><small>Личный дневник</small></div></div></div>
  </aside>
}
