import type { TranslationKey, Translator } from './index'

// Keys of the default deal pipeline seeded by `lib/crm/bootstrap.ts`.
export const SYSTEM_STAGE_KEYS = [
  'new-opportunity',
  'discovery',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const

export type SystemStageKey = (typeof SYSTEM_STAGE_KEYS)[number]

// Exact stage names written by `lib/crm/bootstrap.ts`. Display translation
// applies ONLY while the DB name still equals the seeded value; user edits
// always win.
export const SEEDED_STAGE_NAMES: Record<SystemStageKey, string> = {
  'new-opportunity': 'Yeni Fırsat',
  discovery: 'Görüşme',
  proposal: 'Teklif',
  negotiation: 'Pazarlık',
  won: 'Kazanıldı',
  lost: 'Kaybedildi',
}

export type StageLike = {
  name: string
  key?: string | null
}

export function isSystemStage(stage: StageLike): stage is StageLike & { key: SystemStageKey } {
  const key = stage.key
  if (key == null || !(SYSTEM_STAGE_KEYS as readonly string[]).includes(key)) {
    return false
  }

  return stage.name === SEEDED_STAGE_NAMES[key as SystemStageKey]
}

export function displayStageName(stage: StageLike, t: Translator): string {
  return isSystemStage(stage)
    ? t(`stage.${stage.key}` as TranslationKey)
    : stage.name
}
