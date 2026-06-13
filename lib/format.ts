export function formatCurrency(value: number, currency = 'TRY') {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(typeof value === 'string' ? new Date(value) : value)
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(typeof value === 'string' ? new Date(value) : value)
}

export function formatRelativeDate(value: Date | string | null | undefined) {
  if (!value) {
    return 'Henuz yok'
  }

  const date = typeof value === 'string' ? new Date(value) : value
  const diffMs = date.getTime() - Date.now()
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (Math.abs(diffHours) < 24) {
    if (diffHours === 0) {
      return 'Bugun'
    }

    return diffHours > 0 ? `${diffHours} saat sonra` : `${Math.abs(diffHours)} saat once`
  }

  if (Math.abs(diffDays) < 7) {
    return diffDays > 0 ? `${diffDays} gun sonra` : `${Math.abs(diffDays)} gun once`
  }

  return formatDate(date)
}

export function toNumber(value: { toNumber(): number } | number | null | undefined) {
  if (value == null) {
    return 0
  }

  return typeof value === 'number' ? value : value.toNumber()
}
