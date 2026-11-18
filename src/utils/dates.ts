export const localISODate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export const parseLocalDate = (value: string): Date => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

export const startOfWeek = (date: Date): Date => {
  const result = new Date(date)
  result.setHours(12, 0, 0, 0)
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7))
  return result
}

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const formatLocalDate = (date: Date, options: Intl.DateTimeFormatOptions): string =>
  date.toLocaleDateString('ru-RU', options)

export const formatWeek = (monday: Date): string => {
  const sunday = addDays(monday, 6)
  return `${formatLocalDate(monday, { day: 'numeric', month: 'short' })} — ${formatLocalDate(sunday, { day: 'numeric', month: 'short' })}`
}

/** Assign a real local calendar date to legacy weekday-only entries. */
export const ensureSessionDates = <T extends { day: number; date?: string }>(items: T[]): T[] => {
  const monday = startOfWeek(new Date())
  return items.map(item => item.date ? item : ({ ...item, date: localISODate(addDays(monday, Math.max(0, Math.min(6, item.day)))) } as T))
}
