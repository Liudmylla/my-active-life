import { Menu } from 'lucide-react'
import type { AppTab, CloudStatus } from '../../types'
import { useI18n } from '../../i18n'

type Props = { tab: AppTab; cloudReady: boolean; cloudStatus: CloudStatus; email?: string; onSignOut: () => void; onOpenMenu: () => void }

export default function Topbar({ tab, cloudReady, cloudStatus, email, onSignOut, onOpenMenu }: Props) {
  const { t } = useI18n()
  return <header className="topbar">
    <button className="mobile-menu" type="button" aria-label={t.nav.openMenu} onClick={onOpenMenu}><Menu size={21}/></button>
    <div className="breadcrumb">{t.breadcrumb.root} <span>/</span> {t.breadcrumb[tab]}</div>
    <div className="top-right">
      <span className={`cloud-status ${cloudReady ? 'connected' : ''}`}><span/> {t.cloud.status[cloudStatus]}</span>
      {email ? <button className="text-button" onClick={onSignOut}>{t.auth.signOut}</button> : <span className="avatar small">A</span>}
    </div>
  </header>
}
