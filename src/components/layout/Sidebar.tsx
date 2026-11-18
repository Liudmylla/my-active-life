import { Activity, CalendarDays, ChartNoAxesCombined, HeartPulse, Leaf, Sparkles } from 'lucide-react'
import type { AppTab } from '../../types'

type Props = { tab: AppTab; onChange: (tab: AppTab) => void }

export default function Sidebar({ tab, onChange }: Props) {
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark"><Leaf size={21}/></div><div><b>my active life</b><small>PERSONAL JOURNAL</small></div></div>
    <div className="side-label">МОЁ ПРОСТРАНСТВО</div>
    <button className={`nav-item ${tab === 'week' ? 'active' : ''}`} onClick={() => onChange('week')}><CalendarDays size={18}/> Моя неделя</button>
    <button className={`nav-item ${tab === 'log' ? 'active' : ''}`} onClick={() => onChange('log')}><Activity size={18}/> Дневник</button>
    <button className={`nav-item ${tab === 'progress' ? 'active' : ''}`} onClick={() => onChange('progress')}><ChartNoAxesCombined size={18}/> Прогресс</button>
    <button className={`nav-item ${tab === 'cycle' ? 'active' : ''}`} onClick={() => onChange('cycle')}><HeartPulse size={18}/> Цикл и самочувствие</button>
    <div className="side-bottom"><div className="quote-card"><Sparkles size={17}/><p>Регулярность важнее идеальности.</p><small>Твой ритм — твои правила</small></div><div className="profile"><div className="avatar">A</div><div><b>Мой профиль</b><small>Личный дневник</small></div></div></div>
  </aside>
}
