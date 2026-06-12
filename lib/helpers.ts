export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
}

export function matchesQuery(values: Array<string | number>, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR')

  if (!normalizedQuery) {
    return true
  }

  return values.some((value) =>
    String(value).toLocaleLowerCase('tr-TR').includes(normalizedQuery),
  )
}
