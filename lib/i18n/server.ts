import { cache } from 'react'
import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './config'
import { createT, dictionaries, type Translator } from './index'

export const getLocale = cache(async (): Promise<Locale> => {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
})

export async function getI18n(): Promise<{ locale: Locale; t: Translator }> {
  const locale = await getLocale()
  return { locale, t: createT(dictionaries[locale]) }
}
