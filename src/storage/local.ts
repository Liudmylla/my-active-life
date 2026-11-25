import type { CloudSection } from '../types'

export const storageKeys = {
  sessions: 'mal-v2-sessions',
  strength: 'mal-v2-strength',
  running: 'mal-v2-running',
  periodStarts: 'mal-v2-period-starts',
  cycleLogs: 'mal-v2-cycle-logs',
  weight: 'mal-v2-weight',
  strengthDate: 'mal-v2-strength-date',
  strengthDraft: 'mal-v2-strength-draft',
  pending: 'mal-v2-pending-sync',
  language: 'mal-language',
} as const

export const readJSON = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw == null ? fallback : JSON.parse(raw) as T
  } catch {
    return fallback
  }
}
export const writeJSON = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage full or disabled */ }
}
/** Sections whose last cloud save failed; retried on reconnect and preferred over cloud on next load. */
export const pendingSections = {
  all: (): CloudSection[] => readJSON<CloudSection[]>(storageKeys.pending, []),
  has: (section: CloudSection) => pendingSections.all().includes(section),
  add: (section: CloudSection) => writeJSON(storageKeys.pending, Array.from(new Set([...pendingSections.all(), section]))),
  remove: (section: CloudSection) => writeJSON(storageKeys.pending, pendingSections.all().filter(s => s !== section)),
}
