import { DEFAULT_LOCALE, localeToIntl, type Locale } from '@/lib/i18n/config'
import { createT, dictionaries } from '@/lib/i18n'

export function formatCurrency(value: number, currency = 'TRY', locale: Locale = DEFAULT_LOCALE) {
  return new Intl.NumberFormat(localeToIntl(locale), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCompact(value: number, locale: Locale = DEFAULT_LOCALE) {
  return new Intl.NumberFormat(localeToIntl(locale), {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatDate(
  value: Date | string | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat(localeToIntl(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(typeof value === 'string' ? new Date(value) : value)
}

export function formatDateTime(
  value: Date | string | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat(localeToIntl(locale), {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(typeof value === 'string' ? new Date(value) : value)
}

export function formatRelativeDate(
  value: Date | string | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
) {
  const t = createT(dictionaries[locale])

  if (!value) {
    return t('common.none')
  }

  const date = typeof value === 'string' ? new Date(value) : value
  const diffMs = date.getTime() - Date.now()
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (Math.abs(diffHours) < 24) {
    if (diffHours === 0) {
      return t('common.today')
    }

    return diffHours > 0
      ? t('common.hoursLater', { count: diffHours })
      : t('common.hoursAgo', { count: Math.abs(diffHours) })
  }

  if (Math.abs(diffDays) < 7) {
    return diffDays > 0
      ? t('common.daysLater', { count: diffDays })
      : t('common.daysAgo', { count: Math.abs(diffDays) })
  }

  return formatDate(date, locale)
}

export function toNumber(value: { toNumber(): number } | number | null | undefined) {
  if (value == null) {
    return 0
  }

  return typeof value === 'number' ? value : value.toNumber()
}
