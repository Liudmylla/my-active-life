import { useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound } from 'lucide-react'
import type { Auth } from '../../state/useAuth'
import type { CloudStatus } from '../../types'
import { useI18n } from '../../i18n'

type Props = { auth: Auth; cloudReady: boolean; cloudStatus: CloudStatus; errorMessage?: string }

export default function AccountStrip({ auth, cloudReady, cloudStatus, errorMessage }: Props) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setMessage(t.auth.passwordTooShort); return }
    setBusy(true)
    const result = await auth.setPassword(password)
    setBusy(false)
    if (result.ok) { setMessage(t.auth.passwordSaved); setPassword(''); setOpen(false) }
    else setMessage(t.auth.error(result.error))
  }

  return <div className="account-strip">
    <div className="account-line">
      <span>{t.cloud.signedInAs} <b>{auth.user?.email || t.cloud.personalAccount}</b> · {cloudReady && cloudStatus !== 'error' ? t.cloud.syncActive : t.cloud.status[cloudStatus]}</span>
      <button type="button" className="text-button" onClick={() => { setOpen(!open); setMessage('') }}><KeyRound size={14}/> {t.auth.setPasswordToggle}</button>
    </div>
    {open && <form className="password-form" onSubmit={submit}>
      <label>{t.auth.setPasswordTitle}<input type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t.auth.passwordPlaceholder} minLength={6}/></label>
      <button className="primary" type="submit" disabled={busy}>{t.auth.setPasswordSave}</button>
      <small>{t.auth.setPasswordHint}</small>
    </form>}
    {message && <p className="auth-message" role="status">{message}</p>}
    {errorMessage && <p className="sync-error" role="alert">{errorMessage}</p>}
  </div>
}
