import type {
  ActivityType,
  CompanyStatus,
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

export type NamedEntityOption = {
  id: string
  name: string
}

export type LeadOption = {
  id: string
  title: string
}

export type PipelineOption = {
  id: string
  name: string
  stages: Array<{ id: string; name: string }>
}

export type QuickCreateKind = 'company' | 'contact' | 'lead' | 'deal' | 'task'

export type QuickCreateOptions = {
  users: UserOption[]
  companies: NamedEntityOption[]
  contacts: NamedEntityOption[]
  leads: LeadOption[]
  pipelines: PipelineOption[]
}

export type GlobalSearchResultItem = {
  id: string
  title: string
  subtitle: string
  href: string
  kind: 'company' | 'contact' | 'lead' | 'deal' | 'task'
}

export type EntityNoteViewModel = {
  id: string
  title: string | null
  body: string
  isPinned: boolean
  createdAt: Date
  authorName: string
}

export type EntityActivityViewModel = {
  id: string
  type: ActivityType
  subject: string
  description: string | null
  occurredAt: Date
  actorName: string
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
  email: string
  phone: string
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
  assignee: string
  assigneeInitials: string
}

export type ContactRow = {
  id: string
  companyId?: string | null
  ownerId?: string | null
  firstName: string
  lastName: string
  name: string
  company: string
  city: string
  industry: string
  jobTitle: string
  email: string
  phone: string
  mobilePhone: string
  owner: string
  lastActivityAt: Date | null
  lastActivitySubject: string
  relatedDealValue: number
  notes: EntityNoteViewModel[]
  activities: EntityActivityViewModel[]
}

export type CompanyRow = {
  id: string
  name: string
  legalName: string
  email: string
  phone: string
  website: string
  sector: string
  status: CompanyStatus
  city: string
  country: string
  addressLine1: string
  employeeCount: number | null
  ownerId?: string | null
  owner: string
  relatedCustomers: number
  activeDeals: number
  totalValue: number
  notes: EntityNoteViewModel[]
  activities: EntityActivityViewModel[]
}
