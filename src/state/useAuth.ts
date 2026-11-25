import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../supabase'

export type AuthUser = { id: string; email?: string }
export type AuthResult = { ok: true; needsConfirmation?: boolean } | { ok: false; error: string }

const toUser = (user?: User | null): AuthUser | null => user ? { id: user.id, email: user.email } : null
const fail = (error: { message: string }): AuthResult => ({ ok: false, error: error.message })

/**
 * Supabase keeps the session (with a refresh token) in localStorage, so a user
 * stays signed in on this device until they sign out. Email links/codes are
 * only needed for the first sign-in or when no password has been set.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [checking, setChecking] = useState(Boolean(supabase))
  const [sessionError, setSessionError] = useState('')

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setSessionError(error.message)
      setUser(toUser(data.session?.user))
      setChecking(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(prev => {
        const next = toUser(session?.user)
        return prev?.id === next?.id && prev?.email === next?.email ? prev : next
      })
    })
    return () => subscription.unsubscribe()
  }, [])

  const signInWithPassword = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { ok: false, error: '' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? fail(error) : { ok: true }
  }

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { ok: false, error: '' }
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
    if (error) return fail(error)
    return { ok: true, needsConfirmation: !data.session }
  }

  /** Sends an email containing both a magic link and a one-time code (depending on the Supabase email template). */
  const sendEmailCode = async (email: string): Promise<AuthResult> => {
    if (!supabase) return { ok: false, error: '' }
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    return error ? fail(error) : { ok: true }
  }

  const verifyEmailCode = async (email: string, token: string): Promise<AuthResult> => {
    if (!supabase) return { ok: false, error: '' }
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    return error ? fail(error) : { ok: true }
  }

  const setPassword = async (password: string): Promise<AuthResult> => {
    if (!supabase) return { ok: false, error: '' }
    const { error } = await supabase.auth.updateUser({ password })
    return error ? fail(error) : { ok: true }
  }

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
  }

  return { user, checking, sessionError, enabled: Boolean(supabase), signInWithPassword, signUp, sendEmailCode, verifyEmailCode, setPassword, signOut }
}

export type Auth = ReturnType<typeof useAuth>
