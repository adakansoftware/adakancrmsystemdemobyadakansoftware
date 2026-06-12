import { db } from '@/lib/db/prisma'
import { SYSTEM_ROLE_DEFINITIONS } from '@/lib/auth/constants'

export async function ensureSystemRoles() {
  await Promise.all(
    SYSTEM_ROLE_DEFINITIONS.map((role) =>
      db.role.upsert({
        where: {
          slug: role.slug,
        },
        update: {
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
        },
        create: role,
      }),
    ),
  )
}
