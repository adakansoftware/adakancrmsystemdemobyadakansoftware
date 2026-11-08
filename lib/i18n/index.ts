import { en } from './dictionaries/en'
import { tr, type Dictionary, type TranslationKey } from './dictionaries/tr'
import type { Locale } from './config'

export type { Dictionary, TranslationKey }

export type Translator = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string

export const dictionaries: Record<Locale, Dictionary> = { tr, en }

// `createT` returns a translator with `{param}` interpolation.
export function createT(dict: Dictionary): Translator {
  return (key, params) => {
    const template = dict[key]

    if (!params) {
      return template
    }

    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match,
    )
  }
}

// Server actions / zod messages carry translation keys. If the message is a
// known key, translate it; otherwise pass the raw string through (fallback
// safety for anything not yet keyed).
export function translateMessage(t: Translator, message: string): string {
  return message in tr ? t(message as TranslationKey) : message
}
