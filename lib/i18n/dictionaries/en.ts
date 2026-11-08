import type { Dictionary } from './tr'

// Must mirror every key in `tr.ts` (compile error on key drift).
export const en: Dictionary = {
  // common
  'common.none': 'Not yet',
  'common.today': 'Today',
  'common.hoursLater': 'in {count} hours',
  'common.hoursAgo': '{count} hours ago',
  'common.daysLater': 'in {count} days',
  'common.daysAgo': '{count} days ago',
  'common.switchLanguage': 'Switch language',

  // nav
  'nav.dashboard': 'Dashboard',
  'nav.leads': 'Leads',
  'nav.musteriler': 'Customers',
  'nav.firmalar': 'Companies',
  'nav.anlasmalar': 'Deals',
  'nav.pipeline': 'Pipeline',
  'nav.gorevler': 'Tasks',
  'nav.takvim': 'Calendar',
  'nav.teklifler': 'Proposals',
  'nav.raporlar': 'Reports',
  'nav.ayarlar': 'Settings',

  // sidebar
  'sidebar.subtitle': 'Business Management',
  'sidebar.menu': 'Menu',
  'sidebar.statusTitle': 'Operations status',
  'sidebar.statusText': 'Core CRM modules are active and connected to the database.',

  // enum.leadSource
  'enum.leadSource.WEBSITE': 'Website',
  'enum.leadSource.REFERRAL': 'Referral',
  'enum.leadSource.WHATSAPP': 'WhatsApp',
  'enum.leadSource.PHONE': 'Phone',
  'enum.leadSource.EMAIL': 'Email',
  'enum.leadSource.SOCIAL': 'Social Media',
  'enum.leadSource.EVENT': 'Event',
  'enum.leadSource.MANUAL': 'Manual',

  // enum.leadStatus
  'enum.leadStatus.OPEN': 'Open',
  'enum.leadStatus.QUALIFIED': 'Qualified',
  'enum.leadStatus.DISQUALIFIED': 'Disqualified',
  'enum.leadStatus.CONVERTED': 'Converted',
  'enum.leadStatus.LOST': 'Lost',

  // enum.leadTemperature
  'enum.leadTemperature.COLD': 'Cold',
  'enum.leadTemperature.WARM': 'Warm',
  'enum.leadTemperature.HOT': 'Hot',

  // enum.dealStatus
  'enum.dealStatus.OPEN': 'Open',
  'enum.dealStatus.WON': 'Won',
  'enum.dealStatus.LOST': 'Lost',
  'enum.dealStatus.ABANDONED': 'Abandoned',

  // enum.taskStatus
  'enum.taskStatus.TODO': 'To Do',
  'enum.taskStatus.IN_PROGRESS': 'In Progress',
  'enum.taskStatus.BLOCKED': 'Blocked',
  'enum.taskStatus.DONE': 'Done',
  'enum.taskStatus.CANCELED': 'Cancelled',

  // enum.taskPriority
  'enum.taskPriority.LOW': 'Low',
  'enum.taskPriority.MEDIUM': 'Medium',
  'enum.taskPriority.HIGH': 'High',
  'enum.taskPriority.URGENT': 'Urgent',

  // enum.activityType
  'enum.activityType.CALL': 'Call',
  'enum.activityType.EMAIL': 'Email',
  'enum.activityType.MEETING': 'Meeting',
  'enum.activityType.NOTE': 'Note',
  'enum.activityType.TASK': 'Task',
  'enum.activityType.STATUS_CHANGE': 'Status',
  'enum.activityType.STAGE_CHANGE': 'Stage',
  'enum.activityType.COMMENT': 'Comment',
  'enum.activityType.SYSTEM': 'System',

  // stage
  'stage.new-opportunity': 'New Opportunity',
  'stage.discovery': 'Discovery',
  'stage.proposal': 'Proposal',
  'stage.negotiation': 'Negotiation',
  'stage.won': 'Won',
  'stage.lost': 'Lost',
}
