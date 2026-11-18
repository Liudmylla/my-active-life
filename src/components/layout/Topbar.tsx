import { Menu } from 'lucide-react'
import type { AppTab } from '../../types'

type Props = { tab: AppTab; cloudReady: boolean; cloudStatus: string; email?: string; onSignOut: () => void }
const labels: Record<AppTab, string> = { week: 'НЕДЕЛЯ', log: 'ДНЕВНИК', progress: 'ПРОГРЕСС', cycle: 'ЦИКЛ' }

export default function Topbar({ tab, cloudReady, cloudStatus, email, onSignOut }: Props) {
  return <header className="topbar"><button className="mobile-menu"><Menu size={21}/></button><div className="breadcrumb">МОЯ АКТИВНОСТЬ <span>/</span> {labels[tab]}</div><div className="top-right"><span className={`cloud-status ${cloudReady ? 'connected' : ''}`}><span/> {cloudStatus}</span>{email ? <button className="text-button" onClick={onSignOut}>Выйти</button> : <span className="avatar small">A</span>}</div></header>
}
