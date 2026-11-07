import { cache } from 'react'
import { auth } from '@/auth'
import { db } from '@/lib/db/prisma'

type LegacySessionShape = {
  id: string
  userId: string
  expiresAt: Date
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    roles: Array<{
      role: {
        slug: string
      }
    }>
  }
}

export const getCurrentSession = cache(async (): Promise<LegacySessionShape | null> => {
  const session = await auth()

  if (!session?.user?.id || !session.user.email) {
    return null
  }

  // Reject tokens issued before a password change, role change, or status
  // change. JWT sessions otherwise stay valid until cookie expiry.
  const storedUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      sessionVersion: true,
      status: true,
    },
  })

  if (
    !storedUser ||
    storedUser.status === 'SUSPENDED' ||
    storedUser.status === 'ARCHIVED' ||
    storedUser.sessionVersion !== session.user.sessionVersion
  ) {
    return null
  }

  return {
    id: `jwt:${session.user.id}`,
    userId: session.user.id,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    user: {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName ?? '',
      lastName: session.user.lastName ?? '',
      roles: (session.user.roleSlugs ?? []).map((slug) => ({
        role: { slug },
      })),
    },
  }
})

export async function getCurrentUser() {
  const session = await getCurrentSession()
  return session?.user ?? null
}
