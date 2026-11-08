import type {
  ActivityType,
  DealStatus,
  LeadStatus,
  TaskPriority,
  TaskStatus,
} from '@prisma/client'

// Label maps moved to `lib/i18n/enums.ts` (locale-aware); only visual meta
// (badge variants, dots) lives here.
export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'info'

export const leadStatusMeta: Record<LeadStatus, { variant: BadgeVariant }> = {
  OPEN: { variant: 'info' },
  QUALIFIED: { variant: 'success' },
  DISQUALIFIED: { variant: 'secondary' },
  CONVERTED: { variant: 'success' },
  LOST: { variant: 'destructive' },
}

export const dealStatusMeta: Record<DealStatus, { variant: BadgeVariant }> = {
  OPEN: { variant: 'info' },
  WON: { variant: 'success' },
  LOST: { variant: 'destructive' },
  ABANDONED: { variant: 'secondary' },
}

export const taskStatusMeta: Record<TaskStatus, { variant: BadgeVariant }> = {
  TODO: { variant: 'secondary' },
  IN_PROGRESS: { variant: 'info' },
  BLOCKED: { variant: 'warning' },
  DONE: { variant: 'success' },
  CANCELED: { variant: 'destructive' },
}

export const priorityMeta: Record<TaskPriority, { variant: BadgeVariant }> = {
  LOW: { variant: 'secondary' },
  MEDIUM: { variant: 'info' },
  HIGH: { variant: 'warning' },
  URGENT: { variant: 'destructive' },
}

export const activityTypeMeta: Record<ActivityType, { variant: BadgeVariant; dot: string }> = {
  CALL: { variant: 'success', dot: 'bg-success' },
  EMAIL: { variant: 'info', dot: 'bg-chart-1' },
  MEETING: { variant: 'info', dot: 'bg-chart-2' },
  NOTE: { variant: 'secondary', dot: 'bg-muted-foreground' },
  TASK: { variant: 'warning', dot: 'bg-warning' },
  STATUS_CHANGE: { variant: 'warning', dot: 'bg-chart-4' },
  STAGE_CHANGE: { variant: 'warning', dot: 'bg-chart-5' },
  COMMENT: { variant: 'secondary', dot: 'bg-secondary' },
  SYSTEM: { variant: 'outline', dot: 'bg-primary' },
}
