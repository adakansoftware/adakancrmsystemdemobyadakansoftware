// Source of truth for the Dictionary type. Turkish values are lifted verbatim
// from the previous hardcoded strings (ASCII-stripped) so the default render
// stays byte-identical. `en.ts` must define the exact same key set.
export const tr = {
  // common
  'common.none': 'Henuz yok',
  'common.today': 'Bugun',
  'common.hoursLater': '{count} saat sonra',
  'common.hoursAgo': '{count} saat once',
  'common.daysLater': '{count} gun sonra',
  'common.daysAgo': '{count} gun once',
  'common.switchLanguage': 'Dili degistir',

  // nav
  'nav.dashboard': 'Dashboard',
  'nav.leads': 'Leads',
  'nav.musteriler': 'Musteriler',
  'nav.firmalar': 'Firmalar',
  'nav.anlasmalar': 'Anlasmalar',
  'nav.pipeline': 'Pipeline',
  'nav.gorevler': 'Gorevler',
  'nav.takvim': 'Takvim',
  'nav.teklifler': 'Teklifler',
  'nav.raporlar': 'Raporlar',
  'nav.ayarlar': 'Ayarlar',
} as const

export type Dictionary = { [K in keyof typeof tr]: string }

export type TranslationKey = keyof Dictionary
