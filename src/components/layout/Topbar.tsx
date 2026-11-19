import { Menu } from 'lucide-react'
import type { AppTab } from '../../types'

type Props = { tab: AppTab; cloudReady: boolean; cloudStatus: string; email?: string; onSignOut: () => void; onOpenMenu: () => void }
const labels: Record<AppTab, string> = { week: 'НЕДЕЛЯ', log: 'ДНЕВНИК', progress: 'ПРОГРЕСС', cycle: 'ЦИКЛ' }

export default function Topbar({ tab, cloudReady, cloudStatus, email, onSignOut, onOpenMenu }: Props) {
  return <header className="topbar"><button className="mobile-menu" type="button" aria-label="Открыть меню" onClick={onOpenMenu}><Menu size={21}/></button><div className="breadcrumb">МОЯ АКТИВНОСТЬ <span>/</span> {labels[tab]}</div><div className="top-right"><span className={`cloud-status ${cloudReady ? 'connected' : ''}`}><span/> {cloudStatus}</span>{email ? <button className="text-button" onClick={onSignOut}>Выйти</button> : <span className="avatar small">A</span>}</div></header>
}
