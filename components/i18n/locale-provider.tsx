'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Locale } from '@/lib/i18n/config'
import { createT, dictionaries, type Translator } from '@/lib/i18n'

type I18nContextValue = {
  locale: Locale
  t: Translator
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18nContextValue>(
    () => ({ locale, t: createT(dictionaries[locale]) }),
    [locale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error('useI18n must be used within a LocaleProvider')
  }

  return context
}
