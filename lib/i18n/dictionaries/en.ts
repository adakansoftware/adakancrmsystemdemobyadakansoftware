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
}
