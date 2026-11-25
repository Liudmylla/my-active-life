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
  pendingDeletes: 'mal-v2-pending-deletes',
  syncedIds: 'mal-v2-synced-ids',
  language: 'mal-language',
} as const

export type RecordSection = Exclude<CloudSection, 'daily'>

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

const idSets = (key: string) => {
  const read = () => readJSON<Partial<Record<RecordSection, number[]>>>(key, {})
  const write = (section: RecordSection, ids: number[]) => writeJSON(key, { ...read(), [section]: Array.from(new Set(ids)) })
  return {
    known: (section: RecordSection) => read()[section] !== undefined,
    all: (section: RecordSection) => read()[section] ?? [],
    set: write,
    add: (section: RecordSection, ids: number[]) => write(section, [...(read()[section] ?? []), ...ids]),
    remove: (section: RecordSection, ids: number[]) => {
      const drop = new Set(ids)
      write(section, (read()[section] ?? []).filter(id => !drop.has(id)))
    },
  }
}
/** Ids the user deleted on this device that still have to be removed from the cloud. */
export const pendingDeletes = idSets(storageKeys.pendingDeletes)
/**
 * Ids known to exist in the cloud. A local record that was synced but is missing
 * from the cloud was deleted on another device, so it must not be re-uploaded.
 */
export const syncedIds = idSets(storageKeys.syncedIds)
