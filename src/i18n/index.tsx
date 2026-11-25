import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, StrengthWorkout } from '../types'
import { storageKeys } from '../storage/local'
import { ru } from './locales/ru'
import type { Messages } from './locales/ru'
import { fr } from './locales/fr'

export const languages = { ru, fr } satisfies Record<string, Messages>
export type Language = keyof typeof languages

const isLanguage = (value: unknown): value is Language => typeof value === 'string' && value in languages
const detectLanguage = (): Language => {
  const saved = localStorage.getItem(storageKeys.language)
  if (isLanguage(saved)) return saved
  return navigator.languages?.some(l => l.toLowerCase().startsWith('fr')) ? 'fr' : 'ru'
}

const createHelpers = (t: Messages) => ({
  t,
  formatDate: (date: Date | string, options: Intl.DateTimeFormatOptions) => {
    const value = typeof date === 'string' ? new Date(`${date.slice(0, 10)}T12:00:00`) : date
    return value.toLocaleDateString(t.locale, options)
  },
  formatNumber: (n: number) => n.toLocaleString(t.locale),
  exerciseLabel: (key: string) => (t.exercises as Record<string, string>)[key] ?? key,
  templateLabel: (key: string) => (t.templates as Record<string, string>)[key] ?? key,
  symptomLabel: (key: string) => (t.symptoms as Record<string, string>)[key] ?? key,
  /** Custom title if the user typed one, otherwise a default in the current language. */
  sessionTitle: (s: Pick<Session, 'title' | 'kind' | 'runCategory' | 'workType'>) => {
    if (s.title) return s.title
    if (s.kind === 'run') {
      const category = s.runCategory ?? 'easy'
      return category === 'quality' ? t.defaultTitles.quality(t.workTypes[s.workType ?? 'intervals']) : t.defaultTitles[category]
    }
    if (s.kind === 'strengthLower') return t.defaultTitles.lowerBody
    if (s.kind === 'strengthUpper') return t.defaultTitles.upperBody
    if (s.kind === 'fullBody') return t.defaultTitles.fullBody
    return t.kinds[s.kind]
  },
  workoutTitle: (w: Pick<StrengthWorkout, 'title' | 'template'>) => w.title || t.defaultTitles[w.template],
})

type I18nValue = ReturnType<typeof createHelpers> & { language: Language; setLanguage: (language: Language) => void }
const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(detectLanguage)
  useEffect(() => {
    localStorage.setItem(storageKeys.language, language)
    document.documentElement.lang = language
  }, [language])
  const value = useMemo(() => ({ ...createHelpers(languages[language]), language, setLanguage }), [language])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>')
  return value
}
