import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cookies } from 'next/headers'
import { getI18n, getLocale } from '@/lib/i18n/server'

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T): T => fn,
  }
})

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

function cookieStore(value: string | undefined) {
  return {
    get: (name: string) => (name === 'crm_locale' ? { value } : undefined),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getLocale', () => {
  it('returns the cookie locale when valid', async () => {
    vi.mocked(cookies).mockResolvedValue(cookieStore('en') as never)

    expect(await getLocale()).toBe('en')
  })

  it('falls back to the default locale', async () => {
    vi.mocked(cookies).mockResolvedValue(cookieStore(undefined) as never)

    expect(await getLocale()).toBe('tr')
  })

  it('ignores unknown locale values', async () => {
    vi.mocked(cookies).mockResolvedValue(cookieStore('klingon') as never)

    expect(await getLocale()).toBe('tr')
  })
})

describe('getI18n', () => {
  it('pairs the locale with its translator', async () => {
    vi.mocked(cookies).mockResolvedValue(cookieStore('tr') as never)

    const { locale, t } = await getI18n()

    expect(locale).toBe('tr')
    expect(t('common.unassigned')).toBe('Atanmamis')
  })
})
