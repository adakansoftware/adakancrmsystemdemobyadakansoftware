import { createHash, randomBytes } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { cache } from 'react'
import { db } from '@/lib/db/prisma'
import { SESSION_COOKIE_NAME, SESSION_TTL_MS } from '@/lib/auth/constants'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(userId: string) {
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  const headerStore = await headers()

  await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress: headerStore.get('x-forwarded-for') ?? undefined,
      userAgent: headerStore.get('user-agent') ?? undefined,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (rawToken) {
    await db.session.deleteMany({
      where: {
        tokenHash: hashToken(rawToken),
      },
    })
  }

  cookieStore.delete(SESSION_COOKIE_NAME)
}

export const getCurrentSession = cache(async () => {
  const cookieStore = await cookies()
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!rawToken) {
    return null
  }

  const session = await db.session.findUnique({
    where: {
      tokenHash: hashToken(rawToken),
    },
    include: {
      user: {
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  })

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await db.session.delete({
        where: {
          id: session.id,
        },
      })
    }

    cookieStore.delete(SESSION_COOKIE_NAME)
    return null
  }

  await db.session.update({
    where: {
      id: session.id,
    },
    data: {
      lastSeenAt: new Date(),
    },
  })

  return session
})

export async function getCurrentUser() {
  const session = await getCurrentSession()
  return session?.user ?? null
}
