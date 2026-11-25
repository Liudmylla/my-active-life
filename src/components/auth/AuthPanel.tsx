import { useState } from 'react'
import type { FormEvent } from 'react'
import { HeartPulse } from 'lucide-react'
import type { Auth, AuthResult } from '../../state/useAuth'
import { useI18n } from '../../i18n'

type Mode = 'password' | 'code'

export default function AuthPanel({ auth }: { auth: Auth }) {
  const { t } = useI18n()
  const [mode, setMode] = useState<Mode>('password')
  const [signUp, setSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(auth.sessionError ? t.auth.sessionError(auth.sessionError) : '')

  const trimmedEmail = email.trim()
  const run = async (pending: string, action: () => Promise<AuthResult>, onSuccess?: (result: AuthResult & { ok: true }) => string) => {
    setBusy(true)
    setMessage(pending)
    const result = await action()
    setBusy(false)
    if (result.ok) setMessage(onSuccess?.(result) ?? '')
    else setMessage(t.auth.error(result.error || t.common.networkError))
  }

  const submitPassword = (e: FormEvent) => {
    e.preventDefault()
    if (!trimmedEmail || password.length < 6) { setMessage(t.auth.passwordTooShort); return }
    if (signUp) void run(t.auth.checking, () => auth.signUp(trimmedEmail, password), r => r.needsConfirmation ? t.auth.confirmEmail : '')
    else void run(t.auth.checking, () => auth.signInWithPassword(trimmedEmail, password))
  }
  const sendCode = () => {
    if (!trimmedEmail) return
    void run(t.auth.sending, () => auth.sendEmailCode(trimmedEmail), () => { setCodeSent(true); return t.auth.codeSent })
  }
  const submitCode = (e: FormEvent) => {
    e.preventDefault()
    if (!codeSent) { sendCode(); return }
    if (code.trim()) void run(t.auth.checking, () => auth.verifyEmailCode(trimmedEmail, code.trim()))
  }
  const switchMode = (next: Mode) => { setMode(next); setMessage('') }

  return <section className="panel auth-panel">
    <div className="panel-title"><div><h2>{t.auth.title}</h2><p>{t.auth.subtitle}</p></div><HeartPulse className="muted-icon" size={20}/></div>
    <div className="auth-tabs" role="tablist">
      <button type="button" role="tab" aria-selected={mode === 'password'} className={mode === 'password' ? 'selected' : ''} onClick={() => switchMode('password')}>{t.auth.modePassword}</button>
      <button type="button" role="tab" aria-selected={mode === 'code'} className={mode === 'code' ? 'selected' : ''} onClick={() => switchMode('code')}>{t.auth.modeCode}</button>
    </div>
    {mode === 'password'
      ? <form className="auth-form" onSubmit={submitPassword}>
        <label>{t.auth.email}<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.auth.emailPlaceholder} required/></label>
        <label>{t.auth.password}<input type="password" autoComplete={signUp ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={t.auth.passwordPlaceholder} minLength={6} required/></label>
        <button className="primary" type="submit" disabled={busy || !trimmedEmail}>{signUp ? t.auth.signUp : t.auth.signIn}</button>
        <p className="auth-switch">{signUp ? t.auth.haveAccount : t.auth.noAccount} <button type="button" className="text-button inline" onClick={() => { setSignUp(!signUp); setMessage('') }}>{signUp ? t.auth.signIn : t.auth.signUp}</button></p>
      </form>
      : <form className="auth-form" onSubmit={submitCode}>
        <label>{t.auth.email}<input type="email" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setCodeSent(false) }} placeholder={t.auth.emailPlaceholder} required/></label>
        {codeSent && <label>{t.auth.codeLabel}<input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value.replace(/\s/g, ''))} placeholder={t.auth.codePlaceholder} maxLength={10}/></label>}
        <div className="auth-actions">
          <button className="primary" type="submit" disabled={busy || !trimmedEmail}>{codeSent ? t.auth.verifyCode : t.auth.sendCode}</button>
          {codeSent && <button className="outline" type="button" disabled={busy} onClick={sendCode}>{t.auth.resendCode}</button>}
        </div>
        <small className="auth-privacy">{t.auth.codeHint}</small>
      </form>}
    {message && <p className="auth-message" role="status">{message}</p>}
    <small className="auth-privacy">{t.auth.privacy}</small>
  </section>
}
