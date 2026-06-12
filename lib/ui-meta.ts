import type {
  ActivityType,
  DealStatus,
  LeadSource,
  LeadStatus,
  LeadTemperature,
  TaskPriority,
  TaskStatus,
} from '@prisma/client'

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'info'

export const leadSourceLabels: Record<LeadSource, string> = {
  WEBSITE: 'Website',
  REFERRAL: 'Referans',
  WHATSAPP: 'WhatsApp',
  PHONE: 'Telefon',
  EMAIL: 'E-posta',
  SOCIAL: 'Sosyal Medya',
  EVENT: 'Etkinlik',
  MANUAL: 'Manuel',
}

export const leadStatusLabels: Record<LeadStatus, string> = {
  OPEN: 'Açık',
  QUALIFIED: 'Nitelikli',
  DISQUALIFIED: 'Uygun Değil',
  CONVERTED: 'Dönüştü',
  LOST: 'Kaybedildi',
}

export const leadStatusMeta: Record<LeadStatus, { variant: BadgeVariant }> = {
  OPEN: { variant: 'info' },
  QUALIFIED: { variant: 'success' },
  DISQUALIFIED: { variant: 'secondary' },
  CONVERTED: { variant: 'success' },
  LOST: { variant: 'destructive' },
}

export const leadTemperatureLabels: Record<LeadTemperature, string> = {
  COLD: 'Soğuk',
  WARM: 'Ilık',
  HOT: 'Sıcak',
}

export const dealStatusLabels: Record<DealStatus, string> = {
  OPEN: 'Açık',
  WON: 'Kazanıldı',
  LOST: 'Kaybedildi',
  ABANDONED: 'Vazgeçildi',
}

export const dealStatusMeta: Record<DealStatus, { variant: BadgeVariant }> = {
  OPEN: { variant: 'info' },
  WON: { variant: 'success' },
  LOST: { variant: 'destructive' },
  ABANDONED: { variant: 'secondary' },
}

export const taskStatusLabels: Record<TaskStatus, string> = {
  TODO: 'Bekliyor',
  IN_PROGRESS: 'Devam Ediyor',
  BLOCKED: 'Blokeli',
  DONE: 'Tamamlandı',
  CANCELED: 'İptal Edildi',
}

export const taskStatusMeta: Record<TaskStatus, { variant: BadgeVariant }> = {
  TODO: { variant: 'secondary' },
  IN_PROGRESS: { variant: 'info' },
  BLOCKED: { variant: 'warning' },
  DONE: { variant: 'success' },
  CANCELED: { variant: 'destructive' },
}

export const taskPriorityLabels: Record<TaskPriority, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Normal',
  HIGH: 'Yüksek',
  URGENT: 'Acil',
}

export const priorityMeta: Record<TaskPriority, { variant: BadgeVariant }> = {
  LOW: { variant: 'secondary' },
  MEDIUM: { variant: 'info' },
  HIGH: { variant: 'warning' },
  URGENT: { variant: 'destructive' },
}

export const activityTypeMeta: Record<
  ActivityType,
  { label: string; variant: BadgeVariant; dot: string }
> = {
  CALL: { label: 'Arama', variant: 'success', dot: 'bg-success' },
  EMAIL: { label: 'E-posta', variant: 'info', dot: 'bg-chart-1' },
  MEETING: { label: 'Toplantı', variant: 'info', dot: 'bg-chart-2' },
  NOTE: { label: 'Not', variant: 'secondary', dot: 'bg-muted-foreground' },
  TASK: { label: 'Görev', variant: 'warning', dot: 'bg-warning' },
  STATUS_CHANGE: { label: 'Durum', variant: 'warning', dot: 'bg-chart-4' },
  STAGE_CHANGE: { label: 'Aşama', variant: 'warning', dot: 'bg-chart-5' },
  COMMENT: { label: 'Yorum', variant: 'secondary', dot: 'bg-secondary' },
  SYSTEM: { label: 'Sistem', variant: 'outline', dot: 'bg-primary' },
}
