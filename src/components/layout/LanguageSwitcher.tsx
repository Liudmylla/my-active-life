import { Languages } from 'lucide-react'
import { languages, useI18n } from '../../i18n'
import type { Language } from '../../i18n'

export default function LanguageSwitcher() {
  const { t, language, setLanguage } = useI18n()
  return <div className="language-switcher" role="group" aria-label={t.nav.language}>
    <Languages size={15}/>
    {(Object.keys(languages) as Language[]).map(code =>
      <button key={code} type="button" className={language === code ? 'selected' : ''} aria-pressed={language === code} title={languages[code].languageName} onClick={() => setLanguage(code)}>
        {code.toUpperCase()}
      </button>)}
  </div>
}
