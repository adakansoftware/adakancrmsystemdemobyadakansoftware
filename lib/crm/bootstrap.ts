import { db } from '@/lib/db/prisma'
import { SYSTEM_ROLE_DEFINITIONS } from '@/lib/auth/constants'

const DEFAULT_DEAL_PIPELINE_KEY = 'default-deals'

const DEFAULT_DEAL_STAGES: Array<{
  key: string
  name: string
  position: number
  probability: number
  isClosed?: boolean
  isWon?: boolean
}> = [
  {
    key: 'new-opportunity',
    name: 'Yeni Fırsat',
    position: 0,
    probability: 10,
  },
  {
    key: 'discovery',
    name: 'Görüşme',
    position: 1,
    probability: 25,
  },
  {
    key: 'proposal',
    name: 'Teklif',
    position: 2,
    probability: 50,
  },
  {
    key: 'negotiation',
    name: 'Pazarlık',
    position: 3,
    probability: 75,
  },
  {
    key: 'won',
    name: 'Kazanıldı',
    position: 4,
    probability: 100,
    isClosed: true,
    isWon: true,
  },
  {
    key: 'lost',
    name: 'Kaybedildi',
    position: 5,
    probability: 0,
    isClosed: true,
    isWon: false,
  },
] as const

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

export async function ensureDefaultDealPipeline(createdById?: string | null) {
  const pipeline = await db.pipeline.upsert({
    where: {
      key: DEFAULT_DEAL_PIPELINE_KEY,
    },
    update: {
      name: 'Ana Satış Pipeline',
      description: 'Varsayılan anlaşma pipeline akışı',
      entityType: 'DEAL',
      isDefault: true,
      archivedAt: null,
    },
    create: {
      name: 'Ana Satış Pipeline',
      key: DEFAULT_DEAL_PIPELINE_KEY,
      description: 'Varsayılan anlaşma pipeline akışı',
      entityType: 'DEAL',
      isDefault: true,
      createdById: createdById ?? undefined,
    },
  })

  await Promise.all(
    DEFAULT_DEAL_STAGES.map((stage) =>
      db.stage.upsert({
        where: {
          pipelineId_key: {
            pipelineId: pipeline.id,
            key: stage.key,
          },
        },
        update: {
          name: stage.name,
          position: stage.position,
          probability: stage.probability,
          isClosed: stage.isClosed ?? false,
          isWon: stage.isWon ?? false,
        },
        create: {
          pipelineId: pipeline.id,
          createdById: createdById ?? undefined,
          key: stage.key,
          name: stage.name,
          position: stage.position,
          probability: stage.probability,
          isClosed: stage.isClosed ?? false,
          isWon: stage.isWon ?? false,
        },
      }),
    ),
  )

  return pipeline
}
