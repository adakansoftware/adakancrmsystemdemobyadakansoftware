export const LOCALES = ['tr', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'tr'

export const LOCALE_COOKIE = 'crm_locale'

export function isLocale(value: string | undefined | null): value is Locale {
  return (LOCALES as readonly string[]).includes(value as Locale)
}

export function localeToIntl(locale: Locale): string {
  return locale === 'tr' ? 'tr-TR' : 'en-US'
}
