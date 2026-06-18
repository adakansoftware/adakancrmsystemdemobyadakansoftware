import { PrismaClient } from '@prisma/client'
import { env } from '@/lib/env'

declare global {
  var __prisma__: PrismaClient | undefined
}

export const db =
  global.__prisma__ ??
  new PrismaClient({
    log: env.isDevelopment ? ['error', 'warn'] : ['error'],
  })

if (!env.isProduction) {
  global.__prisma__ = db
}
