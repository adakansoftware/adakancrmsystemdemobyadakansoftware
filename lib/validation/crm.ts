import { z } from 'zod'

const cuidOrUuid = z.string().min(1)
const nullableId = cuidOrUuid.nullish()
const nullableText = z.string().trim().min(1).nullish()

export const userStatusSchema = z.enum([
  'ACTIVE',
  'INVITED',
  'SUSPENDED',
  'ARCHIVED',
])

export const companyStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'PROSPECT',
  'ARCHIVED',
])

export const leadStatusSchema = z.enum([
  'OPEN',
  'QUALIFIED',
  'DISQUALIFIED',
  'CONVERTED',
  'LOST',
])

export const leadSourceSchema = z.enum([
  'WEBSITE',
  'REFERRAL',
  'WHATSAPP',
  'PHONE',
  'EMAIL',
  'SOCIAL',
  'EVENT',
  'MANUAL',
])

export const leadTemperatureSchema = z.enum(['COLD', 'WARM', 'HOT'])

export const dealStatusSchema = z.enum(['OPEN', 'WON', 'LOST', 'ABANDONED'])

export const taskStatusSchema = z.enum([
  'TODO',
  'IN_PROGRESS',
  'BLOCKED',
  'DONE',
  'CANCELED',
])

export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

export const activityTypeSchema = z.enum([
  'CALL',
  'EMAIL',
  'MEETING',
  'NOTE',
  'TASK',
  'STATUS_CHANGE',
  'STAGE_CHANGE',
  'COMMENT',
  'SYSTEM',
])

export const pipelineEntityTypeSchema = z.enum(['LEAD', 'DEAL'])

export const roleSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(100),
  description: nullableText,
  isSystem: z.boolean().optional(),
})

export const userSchema = z.object({
  email: z.email(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  passwordHash: z.string().min(20),
  avatarUrl: z.url().nullish(),
  timezone: z.string().trim().min(1).max(100).optional(),
  locale: z.string().trim().min(2).max(20).optional(),
  status: userStatusSchema.optional(),
  roleIds: z.array(cuidOrUuid).default([]),
})

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
})

export const userRoleAssignmentSchema = z.object({
  userId: cuidOrUuid,
  roleId: cuidOrUuid,
})

export const setupSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.email(),
  password: z.string().min(8).max(128),
})

export const companySchema = z.object({
  name: z.string().trim().min(2).max(160),
  legalName: nullableText,
  slug: nullableText,
  taxNumber: nullableText,
  website: z.url().nullish(),
  email: z.email().nullish(),
  phone: nullableText,
  industry: nullableText,
  employeeCount: z.number().int().nonnegative().nullish(),
  status: companyStatusSchema.optional(),
  country: nullableText,
  city: nullableText,
  addressLine1: nullableText,
  addressLine2: nullableText,
  postalCode: nullableText,
  ownerId: nullableId,
})

export const contactSchema = z.object({
  companyId: nullableId,
  ownerId: nullableId,
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  jobTitle: nullableText,
  email: z.email().nullish(),
  phone: nullableText,
  mobilePhone: nullableText,
  isPrimary: z.boolean().optional(),
  linkedinUrl: z.url().nullish(),
})

export const pipelineSchema = z.object({
  name: z.string().trim().min(2).max(100),
  key: z.string().trim().min(2).max(100),
  description: nullableText,
  entityType: pipelineEntityTypeSchema,
  isDefault: z.boolean().optional(),
  createdById: nullableId,
})

export const stageSchema = z.object({
  pipelineId: cuidOrUuid,
  createdById: nullableId,
  name: z.string().trim().min(2).max(100),
  key: z.string().trim().min(2).max(100),
  position: z.number().int().nonnegative(),
  probability: z.number().int().min(0).max(100).optional(),
  colorHex: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .nullish(),
  isClosed: z.boolean().optional(),
  isWon: z.boolean().optional(),
})

export const updatePipelineSchema = pipelineSchema.partial().extend({
  id: cuidOrUuid,
})

export const updateStageSchema = stageSchema.partial().extend({
  id: cuidOrUuid,
})

export const pipelineQuerySchema = z.object({
  pipelineId: nullableId,
})

export const moveDealSchema = z.object({
  dealId: cuidOrUuid,
  toPipelineId: cuidOrUuid,
  toStageId: cuidOrUuid,
  note: nullableText,
})

export const trackDealValueSchema = z.object({
  dealId: cuidOrUuid,
  amount: z.number().nonnegative(),
  reason: nullableText,
})

export const leadSchema = z.object({
  companyId: nullableId,
  contactId: nullableId,
  ownerId: nullableId,
  pipelineId: cuidOrUuid,
  stageId: cuidOrUuid,
  title: z.string().trim().min(2).max(160),
  description: nullableText,
  email: z.email().nullish(),
  phone: nullableText,
  status: leadStatusSchema.optional(),
  source: leadSourceSchema.optional(),
  temperature: leadTemperatureSchema.optional(),
  estimatedValue: z.number().nonnegative().nullish(),
  currency: z.string().trim().length(3).optional(),
  expectedCloseAt: z.coerce.date().nullish(),
})

export const dealSchema = z.object({
  companyId: nullableId,
  contactId: nullableId,
  ownerId: nullableId,
  pipelineId: cuidOrUuid,
  stageId: cuidOrUuid,
  title: z.string().trim().min(2).max(160),
  description: nullableText,
  status: dealStatusSchema.optional(),
  amount: z.number().nonnegative(),
  currency: z.string().trim().length(3).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expectedCloseAt: z.coerce.date().nullish(),
  lostReason: nullableText,
})

export const taskSchema = z.object({
  companyId: nullableId,
  contactId: nullableId,
  leadId: nullableId,
  dealId: nullableId,
  assigneeId: nullableId,
  creatorId: nullableId,
  title: z.string().trim().min(2).max(160),
  description: nullableText,
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueAt: z.coerce.date().nullish(),
})

export const activitySchema = z.object({
  actorId: nullableId,
  companyId: nullableId,
  contactId: nullableId,
  leadId: nullableId,
  dealId: nullableId,
  taskId: nullableId,
  type: activityTypeSchema,
  subject: z.string().trim().min(2).max(160),
  description: nullableText,
  metadata: z.record(z.string(), z.unknown()).nullish(),
  occurredAt: z.coerce.date().optional(),
})

export const noteSchema = z.object({
  authorId: nullableId,
  companyId: nullableId,
  contactId: nullableId,
  leadId: nullableId,
  dealId: nullableId,
  taskId: nullableId,
  title: nullableText,
  body: z.string().trim().min(1),
  isPinned: z.boolean().optional(),
})

export const updateCompanySchema = companySchema.partial().extend({
  id: cuidOrUuid,
})

export const updateContactSchema = contactSchema.partial().extend({
  id: cuidOrUuid,
})

export const updateLeadSchema = leadSchema.partial().extend({
  id: cuidOrUuid,
})

export const updateDealSchema = dealSchema.partial().extend({
  id: cuidOrUuid,
})

export const updateTaskSchema = taskSchema.partial().extend({
  id: cuidOrUuid,
})

export const updateNoteSchema = noteSchema.partial().extend({
  id: cuidOrUuid,
})

export const deleteEntitySchema = z.object({
  id: cuidOrUuid,
})

export const timelineFilterSchema = z
  .object({
    companyId: nullableId,
    contactId: nullableId,
    leadId: nullableId,
    dealId: nullableId,
    taskId: nullableId,
    limit: z.number().int().positive().max(100).optional(),
  })
  .refine(
    (value) =>
      Boolean(
        value.companyId ||
          value.contactId ||
          value.leadId ||
          value.dealId ||
          value.taskId,
      ),
    {
      message: 'At least one timeline target is required',
      path: ['companyId'],
    },
  )
