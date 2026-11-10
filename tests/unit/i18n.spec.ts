import { describe, expect, it } from 'vitest'
import {
  createT,
  dictionaries,
  translateMessage,
  type Translator,
} from '@/lib/i18n'
import { createEnumLabels } from '@/lib/i18n/enums'
import { DEFAULT_LOCALE, isLocale, localeToIntl } from '@/lib/i18n/config'
import { displayStageName, isSystemStage } from '@/lib/i18n/stages'

describe('dictionary parity', () => {
  it('keeps every TR key present in EN and vice versa', () => {
    const trKeys = Object.keys(dictionaries.tr).sort()
    const enKeys = Object.keys(dictionaries.en).sort()

    expect(enKeys).toEqual(trKeys)
    expect(trKeys.length).toBeGreaterThan(500)
  })

  it('does not ship empty translations', () => {
    for (const [key, value] of Object.entries(dictionaries.tr)) {
      expect(value.length, `empty TR value for ${key}`).toBeGreaterThan(0)
    }

    for (const [key, value] of Object.entries(dictionaries.en)) {
      expect(value.length, `empty EN value for ${key}`).toBeGreaterThan(0)
    }
  })
})

describe('createT', () => {
  const t = createT(dictionaries.tr)

  it('returns the raw template without params', () => {
    expect(t('common.save')).toBe('Kaydet')
  })

  it('interpolates numeric params', () => {
    expect(t('common.hoursAgo', { count: 5 })).toBe('5 saat once')
  })

  it('keeps unknown placeholders intact', () => {
    expect(t('common.recordsFound', { other: 1 })).toBe('{count} kayit bulundu')
  })
})

describe('translateMessage', () => {
  const t = createT(dictionaries.tr)

  it('translates known keys', () => {
    expect(translateMessage(t, 'validation.passwordsDoNotMatch')).toBe('Sifreler eslesmiyor')
  })

  it('passes unknown strings through unchanged', () => {
    expect(translateMessage(t, 'raw error text')).toBe('raw error text')
  })
})

describe('locale config', () => {
  it('recognizes supported locales', () => {
    expect(isLocale('tr')).toBe(true)
    expect(isLocale('en')).toBe(true)
    expect(isLocale('de')).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })

  it('maps locales to Intl tags with TR as default', () => {
    expect(DEFAULT_LOCALE).toBe('tr')
    expect(localeToIntl('tr')).toBe('tr-TR')
    expect(localeToIntl('en')).toBe('en-US')
  })
})

describe('enum labels', () => {
  it('builds localized label maps for every locale', () => {
    for (const locale of ['tr', 'en'] as const) {
      const t: Translator = createT(dictionaries[locale])
      const labels = createEnumLabels(t)

      expect(labels.dealStatus.WON).toBe(t('enum.dealStatus.WON'))
      expect(labels.taskStatus.TODO).toBe(t('enum.taskStatus.TODO'))
      expect(Object.keys(labels.leadSource)).toHaveLength(8)
    }
  })
})

describe('stage display names', () => {
  const t = createT(dictionaries.tr)

  it('detects untouched seeded stages', () => {
    expect(isSystemStage({ name: 'Teklif', key: 'proposal' })).toBe(true)
  })

  it('keeps user-edited stage names', () => {
    expect(isSystemStage({ name: 'Ozel Asama', key: 'proposal' })).toBe(false)
    expect(isSystemStage({ name: 'Teklif' })).toBe(false)
  })

  it('translates seeded stages and passes custom names through', () => {
    expect(displayStageName({ name: 'Teklif', key: 'proposal' }, t)).toBe(t('stage.proposal'))
    expect(displayStageName({ name: 'Ozel Asama', key: 'proposal' }, t)).toBe('Ozel Asama')
    expect(displayStageName({ name: 'Serbest' }, t)).toBe('Serbest')
  })
})
