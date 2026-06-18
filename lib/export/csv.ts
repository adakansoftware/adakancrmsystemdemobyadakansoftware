const CSV_FORMULA_PREFIXES = ['=', '+', '-', '@', '\t']

export function csvEscape(value: unknown) {
  const text = String(value ?? '')
  const normalized =
    CSV_FORMULA_PREFIXES.some((prefix) => text.startsWith(prefix)) ? `'${text}` : text

  return `"${normalized.replaceAll('"', '""')}"`
}

export function toCsv(headers: string[], rows: Array<Array<unknown>>) {
  return [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => row.map(csvEscape).join(',')),
  ].join('\n')
}
