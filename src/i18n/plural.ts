type Forms = { one: string; few?: string; many?: string; other: string }

/** Returns `(n, forms) => "n word"` using the CLDR plural rules of the locale. */
export const makePlural = (locale: string) => {
  const rules = new Intl.PluralRules(locale)
  return (n: number, forms: Forms) => {
    const category = rules.select(n) as keyof Forms
    return `${n} ${forms[category] ?? forms.other}`
  }
}
