import type {
  DealStatus,
  LeadSource,
  LeadStatus,
  LeadTemperature,
  TaskPriority,
  TaskStatus,
} from '@prisma/client'

export const leadStatuses = [
  'OPEN',
  'QUALIFIED',
  'DISQUALIFIED',
  'CONVERTED',
  'LOST',
] as const satisfies readonly LeadStatus[]

export const dealStatuses = ['OPEN', 'WON', 'LOST', 'ABANDONED'] as const satisfies readonly DealStatus[]

export const taskStatuses = [
  'TODO',
  'IN_PROGRESS',
  'BLOCKED',
  'DONE',
  'CANCELED',
] as const satisfies readonly TaskStatus[]

export type UserOption = {
  id: string
  name: string
}

export type LeadRow = {
  id: string
  title: string
  company: string
  contact: string
  source: LeadSource
  temperature: LeadTemperature
  status: LeadStatus
  estimatedValue: number
  ownerId?: string | null
  owner: string
  stage: string
}

export type DealStageOption = {
  id: string
  name: string
  isClosed: boolean
  isWon: boolean
}

export type DealRow = {
  id: string
  title: string
  company: string
  contact: string
  amount: number
  currency: string
  status: DealStatus
  probability: number
  expectedCloseAt: Date | null
  ownerId?: string | null
  owner: string
  ownerInitials: string
  stage: string
  stageId: string
  pipelineId: string
  availableStages: DealStageOption[]
}

export type TaskRow = {
  id: string
  title: string
  related: string
  priority: TaskPriority
  status: TaskStatus
  dueAt: Date | null
  assigneeId?: string | null
  assigneeInitials: string
}
