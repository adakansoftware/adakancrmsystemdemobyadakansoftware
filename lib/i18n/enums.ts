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
import type { Translator } from './index'

export type EnumLabels = {
  leadSource: Record<LeadSource, string>
  leadStatus: Record<LeadStatus, string>
  leadTemperature: Record<LeadTemperature, string>
  dealStatus: Record<DealStatus, string>
  taskStatus: Record<TaskStatus, string>
  taskPriority: Record<TaskPriority, string>
  activityType: Record<ActivityType, string>
  companyStatus: Record<CompanyStatus, string>
}

// Same-shaped records as the removed `lib/ui-meta.ts` label maps, so usage
// sites migrate mechanically.
export function createEnumLabels(t: Translator): EnumLabels {
  return {
    leadSource: {
      WEBSITE: t('enum.leadSource.WEBSITE'),
      REFERRAL: t('enum.leadSource.REFERRAL'),
      WHATSAPP: t('enum.leadSource.WHATSAPP'),
      PHONE: t('enum.leadSource.PHONE'),
      EMAIL: t('enum.leadSource.EMAIL'),
      SOCIAL: t('enum.leadSource.SOCIAL'),
      EVENT: t('enum.leadSource.EVENT'),
      MANUAL: t('enum.leadSource.MANUAL'),
    },
    leadStatus: {
      OPEN: t('enum.leadStatus.OPEN'),
      QUALIFIED: t('enum.leadStatus.QUALIFIED'),
      DISQUALIFIED: t('enum.leadStatus.DISQUALIFIED'),
      CONVERTED: t('enum.leadStatus.CONVERTED'),
      LOST: t('enum.leadStatus.LOST'),
    },
    leadTemperature: {
      COLD: t('enum.leadTemperature.COLD'),
      WARM: t('enum.leadTemperature.WARM'),
      HOT: t('enum.leadTemperature.HOT'),
    },
    dealStatus: {
      OPEN: t('enum.dealStatus.OPEN'),
      WON: t('enum.dealStatus.WON'),
      LOST: t('enum.dealStatus.LOST'),
      ABANDONED: t('enum.dealStatus.ABANDONED'),
    },
    taskStatus: {
      TODO: t('enum.taskStatus.TODO'),
      IN_PROGRESS: t('enum.taskStatus.IN_PROGRESS'),
      BLOCKED: t('enum.taskStatus.BLOCKED'),
      DONE: t('enum.taskStatus.DONE'),
      CANCELED: t('enum.taskStatus.CANCELED'),
    },
    taskPriority: {
      LOW: t('enum.taskPriority.LOW'),
      MEDIUM: t('enum.taskPriority.MEDIUM'),
      HIGH: t('enum.taskPriority.HIGH'),
      URGENT: t('enum.taskPriority.URGENT'),
    },
    activityType: {
      CALL: t('enum.activityType.CALL'),
      EMAIL: t('enum.activityType.EMAIL'),
      MEETING: t('enum.activityType.MEETING'),
      NOTE: t('enum.activityType.NOTE'),
      TASK: t('enum.activityType.TASK'),
      STATUS_CHANGE: t('enum.activityType.STATUS_CHANGE'),
      STAGE_CHANGE: t('enum.activityType.STAGE_CHANGE'),
      COMMENT: t('enum.activityType.COMMENT'),
      SYSTEM: t('enum.activityType.SYSTEM'),
    },
    companyStatus: {
      ACTIVE: t('enum.companyStatus.ACTIVE'),
      PROSPECT: t('enum.companyStatus.PROSPECT'),
      INACTIVE: t('enum.companyStatus.INACTIVE'),
      ARCHIVED: t('enum.companyStatus.ARCHIVED'),
    },
  }
}
