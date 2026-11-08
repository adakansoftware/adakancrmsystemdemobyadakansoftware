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

  // sidebar
  'sidebar.subtitle': 'Isletme Yonetimi',
  'sidebar.menu': 'Menu',
  'sidebar.statusTitle': 'Operasyon durumu',
  'sidebar.statusText': 'Temel CRM modulleri aktif ve veritabanina bagli calisiyor.',

  // enum.leadSource
  'enum.leadSource.WEBSITE': 'Website',
  'enum.leadSource.REFERRAL': 'Referans',
  'enum.leadSource.WHATSAPP': 'WhatsApp',
  'enum.leadSource.PHONE': 'Telefon',
  'enum.leadSource.EMAIL': 'E-posta',
  'enum.leadSource.SOCIAL': 'Sosyal Medya',
  'enum.leadSource.EVENT': 'Etkinlik',
  'enum.leadSource.MANUAL': 'Manuel',

  // enum.leadStatus
  'enum.leadStatus.OPEN': 'Acik',
  'enum.leadStatus.QUALIFIED': 'Nitelikli',
  'enum.leadStatus.DISQUALIFIED': 'Uygun Degil',
  'enum.leadStatus.CONVERTED': 'Donustu',
  'enum.leadStatus.LOST': 'Kaybedildi',

  // enum.leadTemperature
  'enum.leadTemperature.COLD': 'Soguk',
  'enum.leadTemperature.WARM': 'Ilik',
  'enum.leadTemperature.HOT': 'Sicak',

  // enum.dealStatus
  'enum.dealStatus.OPEN': 'Acik',
  'enum.dealStatus.WON': 'Kazanildi',
  'enum.dealStatus.LOST': 'Kaybedildi',
  'enum.dealStatus.ABANDONED': 'Vazgecildi',

  // enum.taskStatus
  'enum.taskStatus.TODO': 'Bekliyor',
  'enum.taskStatus.IN_PROGRESS': 'Devam Ediyor',
  'enum.taskStatus.BLOCKED': 'Blokeli',
  'enum.taskStatus.DONE': 'Tamamlandi',
  'enum.taskStatus.CANCELED': 'Iptal Edildi',

  // enum.taskPriority
  'enum.taskPriority.LOW': 'Dusuk',
  'enum.taskPriority.MEDIUM': 'Normal',
  'enum.taskPriority.HIGH': 'Yuksek',
  'enum.taskPriority.URGENT': 'Acil',

  // enum.activityType
  'enum.activityType.CALL': 'Arama',
  'enum.activityType.EMAIL': 'E-posta',
  'enum.activityType.MEETING': 'Toplanti',
  'enum.activityType.NOTE': 'Not',
  'enum.activityType.TASK': 'Gorev',
  'enum.activityType.STATUS_CHANGE': 'Durum',
  'enum.activityType.STAGE_CHANGE': 'Asama',
  'enum.activityType.COMMENT': 'Yorum',
  'enum.activityType.SYSTEM': 'Sistem',

  // stage (seeded pipeline stages; DB names carry diacritics)
  'stage.new-opportunity': 'Yeni Fırsat',
  'stage.discovery': 'Görüşme',
  'stage.proposal': 'Teklif',
  'stage.negotiation': 'Pazarlık',
  'stage.won': 'Kazanıldı',
  'stage.lost': 'Kaybedildi',
} as const

export type Dictionary = { [K in keyof typeof tr]: string }

export type TranslationKey = keyof Dictionary
