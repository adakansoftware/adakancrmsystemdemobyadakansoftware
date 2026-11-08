import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'

export function asDecimal(value: number | null | undefined) {
  return value == null ? null : new Prisma.Decimal(value)
}

export function successResult(id: string) {
  return { id }
}

export function revalidateCrmPaths() {
  for (const path of [
    '/',
    '/musteriler',
    '/firmalar',
    '/leads',
    '/anlasmalar',
    '/pipeline',
    '/gorevler',
    '/takvim',
  ]) {
    revalidatePath(path)
  }
}
