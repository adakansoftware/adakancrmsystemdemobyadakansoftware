export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'info'

export type LeadStatus =
  | 'Yeni'
  | 'Görüşüldü'
  | 'Teklif Verildi'
  | 'Kazanıldı'
  | 'Kaybedildi'

export type LeadSource = 'Website' | 'WhatsApp' | 'Referans' | 'Telefon'

export const leadStatuses: LeadStatus[] = [
  'Yeni',
  'Görüşüldü',
  'Teklif Verildi',
  'Kazanıldı',
  'Kaybedildi',
]

export const leadSources: LeadSource[] = [
  'Website',
  'WhatsApp',
  'Referans',
  'Telefon',
]

export type Lead = {
  id: string
  name: string
  company: string
  phone: string
  email: string
  status: LeadStatus
  source: LeadSource
  value: number
  owner: string
  createdAt: string
}

export const leads: Lead[] = [
  { id: 'L-1042', name: 'Caner Aydın', company: 'Aydın Hafriyat', phone: '+90 532 411 22 18', email: 'caner@aydinhafriyat.com', status: 'Yeni', source: 'Website', value: 145000, owner: 'Elif Yılmaz', createdAt: '2026-06-10' },
  { id: 'L-1041', name: 'Selin Korkmaz', company: 'Estetik Clinic İstanbul', phone: '+90 533 219 87 65', email: 'selin@estetikclinic.com', status: 'Görüşüldü', source: 'WhatsApp', value: 38000, owner: 'Zeynep Kaya', createdAt: '2026-06-09' },
  { id: 'L-1040', name: 'Okan Yıldız', company: 'Yıldız Emlak', phone: '+90 542 778 11 09', email: 'okan@yildizemlak.com', status: 'Teklif Verildi', source: 'Referans', value: 92000, owner: 'Burak Demir', createdAt: '2026-06-08' },
  { id: 'L-1039', name: 'Deniz Arslan', company: 'Arslan Oto Servis', phone: '+90 555 330 44 71', email: 'deniz@arslanoto.com', status: 'Kazanıldı', source: 'Telefon', value: 27500, owner: 'Mert Şahin', createdAt: '2026-06-07' },
  { id: 'L-1038', name: 'Gül Şen', company: 'Şen Güzellik Salonu', phone: '+90 538 901 23 45', email: 'gul@senguzellik.com', status: 'Kaybedildi', source: 'WhatsApp', value: 15000, owner: 'Ayşe Çelik', createdAt: '2026-06-06' },
  { id: 'L-1037', name: 'Tolga Erdoğan', company: 'Erdoğan İnşaat', phone: '+90 530 654 32 10', email: 'tolga@erdogansaat.com', status: 'Yeni', source: 'Website', value: 320000, owner: 'Elif Yılmaz', createdAt: '2026-06-05' },
  { id: 'L-1036', name: 'Nazlı Aksoy', company: 'Aksoy Ajans', phone: '+90 544 112 56 78', email: 'nazli@aksoyajans.com', status: 'Görüşüldü', source: 'Referans', value: 64000, owner: 'Zeynep Kaya', createdAt: '2026-06-04' },
  { id: 'L-1035', name: 'Emre Polat', company: 'Polat Dental Klinik', phone: '+90 537 445 89 12', email: 'emre@polatdental.com', status: 'Teklif Verildi', source: 'Telefon', value: 47000, owner: 'Burak Demir', createdAt: '2026-06-03' },
  { id: 'L-1034', name: 'Buse Doğan', company: 'Doğan Gayrimenkul', phone: '+90 531 778 90 34', email: 'buse@dogangm.com', status: 'Yeni', source: 'WhatsApp', value: 110000, owner: 'Ayşe Çelik', createdAt: '2026-06-02' },
  { id: 'L-1033', name: 'Kerem Öztürk', company: 'Öztürk Hafriyat', phone: '+90 546 223 17 88', email: 'kerem@ozturkhafriyat.com', status: 'Kazanıldı', source: 'Website', value: 215000, owner: 'Mert Şahin', createdAt: '2026-06-01' },
  { id: 'L-1032', name: 'Pınar Yalçın', company: 'Yalçın Estetik', phone: '+90 535 667 22 41', email: 'pinar@yalcinestetik.com', status: 'Görüşüldü', source: 'Telefon', value: 29000, owner: 'Zeynep Kaya', createdAt: '2026-05-31' },
  { id: 'L-1031', name: 'Hakan Çetin', company: 'Çetin Reklam Ajansı', phone: '+90 549 100 55 66', email: 'hakan@cetinreklam.com', status: 'Teklif Verildi', source: 'Referans', value: 78000, owner: 'Elif Yılmaz', createdAt: '2026-05-30' },
]

export const leadStatusMeta: Record<LeadStatus, { variant: BadgeVariant }> = {
  Yeni: { variant: 'info' },
  Görüşüldü: { variant: 'secondary' },
  'Teklif Verildi': { variant: 'warning' },
  Kazanıldı: { variant: 'success' },
  Kaybedildi: { variant: 'destructive' },
}

export type Customer = {
  id: string
  name: string
  company: string
  email: string
  phone: string
  city: string
  tags: string[]
  totalValue: number
  lastInteraction: string
  owner: string
  notes: string
}

export const customers: Customer[] = [
  { id: 'C-501', name: 'Caner Aydın', company: 'Aydın Hafriyat', email: 'caner@aydinhafriyat.com', phone: '+90 532 411 22 18', city: 'Kocaeli', tags: ['Hafriyat', 'Kurumsal'], totalValue: 485000, lastInteraction: '2 saat önce', owner: 'Elif Yılmaz', notes: 'Yeni şantiye için ek kazı talebi konuşuldu. Sözleşme yenileme Temmuz ayında.' },
  { id: 'C-502', name: 'Selin Korkmaz', company: 'Estetik Clinic İstanbul', email: 'selin@estetikclinic.com', phone: '+90 533 219 87 65', city: 'İstanbul', tags: ['Klinik', 'VIP'], totalValue: 162000, lastInteraction: 'Dün', owner: 'Zeynep Kaya', notes: 'Sosyal medya yönetimi paketiyle ilgileniyor. Demo planlandı.' },
  { id: 'C-503', name: 'Okan Yıldız', company: 'Yıldız Emlak', email: 'okan@yildizemlak.com', phone: '+90 542 778 11 09', city: 'Ankara', tags: ['Emlak'], totalValue: 240000, lastInteraction: '3 gün önce', owner: 'Burak Demir', notes: 'Portföy yönetim modülü demosu olumlu geçti.' },
  { id: 'C-504', name: 'Deniz Arslan', company: 'Arslan Oto Servis', email: 'deniz@arslanoto.com', phone: '+90 555 330 44 71', city: 'İzmir', tags: ['Oto Servis', 'Bakım'], totalValue: 87500, lastInteraction: '1 hafta önce', owner: 'Mert Şahin', notes: 'Periyodik bakım hatırlatma otomasyonu kuruldu.' },
  { id: 'C-505', name: 'Gül Şen', company: 'Şen Güzellik Salonu', email: 'gul@senguzellik.com', phone: '+90 538 901 23 45', city: 'Bursa', tags: ['Güzellik'], totalValue: 54000, lastInteraction: '2 hafta önce', owner: 'Ayşe Çelik', notes: 'Randevu modülü için fiyat teklifi bekliyor.' },
  { id: 'C-506', name: 'Tolga Erdoğan', company: 'Erdoğan İnşaat', email: 'tolga@erdogansaat.com', phone: '+90 530 654 32 10', city: 'Antalya', tags: ['İnşaat', 'Kurumsal'], totalValue: 620000, lastInteraction: '4 saat önce', owner: 'Elif Yılmaz', notes: 'Yeni proje için kapsamlı teklif hazırlanıyor.' },
  { id: 'C-507', name: 'Nazlı Aksoy', company: 'Aksoy Ajans', email: 'nazli@aksoyajans.com', phone: '+90 544 112 56 78', city: 'İstanbul', tags: ['Ajans'], totalValue: 134000, lastInteraction: 'Dün', owner: 'Zeynep Kaya', notes: 'Aylık raporlama paketine geçiş görüşülüyor.' },
  { id: 'C-508', name: 'Emre Polat', company: 'Polat Dental Klinik', email: 'emre@polatdental.com', phone: '+90 537 445 89 12', city: 'Eskişehir', tags: ['Klinik'], totalValue: 96000, lastInteraction: '5 gün önce', owner: 'Burak Demir', notes: 'Hasta takip sistemi entegrasyonu tamamlandı.' },
]

export type Company = {
  id: string
  name: string
  sector: string
  city: string
  owner: string
  relatedCustomers: number
  activeDeals: number
  totalValue: number
}

export const companies: Company[] = [
  { id: 'F-201', name: 'Aydın Hafriyat', sector: 'Hafriyat', city: 'Kocaeli', owner: 'Elif Yılmaz', relatedCustomers: 4, activeDeals: 3, totalValue: 485000 },
  { id: 'F-202', name: 'Estetik Clinic İstanbul', sector: 'Sağlık / Klinik', city: 'İstanbul', owner: 'Zeynep Kaya', relatedCustomers: 2, activeDeals: 2, totalValue: 162000 },
  { id: 'F-203', name: 'Yıldız Emlak', sector: 'Gayrimenkul', city: 'Ankara', owner: 'Burak Demir', relatedCustomers: 6, activeDeals: 4, totalValue: 240000 },
  { id: 'F-204', name: 'Arslan Oto Servis', sector: 'Otomotiv', city: 'İzmir', owner: 'Mert Şahin', relatedCustomers: 3, activeDeals: 1, totalValue: 87500 },
  { id: 'F-205', name: 'Şen Güzellik Salonu', sector: 'Güzellik ve Bakım', city: 'Bursa', owner: 'Ayşe Çelik', relatedCustomers: 2, activeDeals: 1, totalValue: 54000 },
  { id: 'F-206', name: 'Erdoğan İnşaat', sector: 'İnşaat', city: 'Antalya', owner: 'Elif Yılmaz', relatedCustomers: 8, activeDeals: 5, totalValue: 620000 },
  { id: 'F-207', name: 'Aksoy Ajans', sector: 'Reklam ve Ajans', city: 'İstanbul', owner: 'Zeynep Kaya', relatedCustomers: 3, activeDeals: 2, totalValue: 134000 },
  { id: 'F-208', name: 'Polat Dental Klinik', sector: 'Sağlık / Klinik', city: 'Eskişehir', owner: 'Burak Demir', relatedCustomers: 2, activeDeals: 1, totalValue: 96000 },
]

export type DealStage =
  | 'Yeni Fırsat'
  | 'Görüşme'
  | 'Teklif'
  | 'Pazarlık'
  | 'Kazanıldı'
  | 'Kaybedildi'

export type Priority = 'Düşük' | 'Normal' | 'Yüksek' | 'Acil'

export type Deal = {
  id: string
  title: string
  company: string
  amount: number
  owner: string
  ownerInitials: string
  dueDate: string
  priority: Priority
  lastActivity: string
  stage: DealStage
}

export const dealStages: DealStage[] = [
  'Yeni Fırsat',
  'Görüşme',
  'Teklif',
  'Pazarlık',
  'Kazanıldı',
  'Kaybedildi',
]

export const deals: Deal[] = [
  { id: 'D-301', title: 'Şantiye kazı sözleşmesi', company: 'Aydın Hafriyat', amount: 145000, owner: 'Elif Yılmaz', ownerInitials: 'EY', dueDate: '20 Haz', priority: 'Yüksek', lastActivity: '2 saat önce arandı', stage: 'Yeni Fırsat' },
  { id: 'D-302', title: 'Sosyal medya yönetimi', company: 'Estetik Clinic İstanbul', amount: 38000, owner: 'Zeynep Kaya', ownerInitials: 'ZK', dueDate: '18 Haz', priority: 'Normal', lastActivity: 'Dün e-posta', stage: 'Görüşme' },
  { id: 'D-303', title: 'Portföy yönetim modülü', company: 'Yıldız Emlak', amount: 92000, owner: 'Burak Demir', ownerInitials: 'BD', dueDate: '22 Haz', priority: 'Yüksek', lastActivity: 'Teklif gönderildi', stage: 'Teklif' },
  { id: 'D-304', title: 'Bakım otomasyon paketi', company: 'Arslan Oto Servis', amount: 27500, owner: 'Mert Şahin', ownerInitials: 'MŞ', dueDate: '15 Haz', priority: 'Acil', lastActivity: 'Pazarlık görüşmesi', stage: 'Pazarlık' },
  { id: 'D-305', title: 'Yıllık CRM lisansı', company: 'Erdoğan İnşaat', amount: 320000, owner: 'Elif Yılmaz', ownerInitials: 'EY', dueDate: '25 Haz', priority: 'Yüksek', lastActivity: 'Demo tamamlandı', stage: 'Görüşme' },
  { id: 'D-306', title: 'Randevu modülü kurulumu', company: 'Şen Güzellik Salonu', amount: 15000, owner: 'Ayşe Çelik', ownerInitials: 'AÇ', dueDate: '12 Haz', priority: 'Düşük', lastActivity: 'Teklif reddedildi', stage: 'Kaybedildi' },
  { id: 'D-307', title: 'Web sitesi yenileme', company: 'Aksoy Ajans', amount: 64000, owner: 'Zeynep Kaya', ownerInitials: 'ZK', dueDate: '28 Haz', priority: 'Normal', lastActivity: 'Toplantı planlandı', stage: 'Yeni Fırsat' },
  { id: 'D-308', title: 'Hasta takip entegrasyonu', company: 'Polat Dental Klinik', amount: 47000, owner: 'Burak Demir', ownerInitials: 'BD', dueDate: '19 Haz', priority: 'Normal', lastActivity: 'Sözleşme imzalandı', stage: 'Kazanıldı' },
  { id: 'D-309', title: 'Reklam kampanya yönetimi', company: 'Çetin Reklam Ajansı', amount: 78000, owner: 'Elif Yılmaz', ownerInitials: 'EY', dueDate: '30 Haz', priority: 'Yüksek', lastActivity: 'Teklif inceleniyor', stage: 'Teklif' },
  { id: 'D-310', title: 'Hafriyat filo takibi', company: 'Öztürk Hafriyat', amount: 215000, owner: 'Mert Şahin', ownerInitials: 'MŞ', dueDate: '24 Haz', priority: 'Yüksek', lastActivity: 'Sözleşme imzalandı', stage: 'Kazanıldı' },
  { id: 'D-311', title: 'Estetik paket otomasyonu', company: 'Yalçın Estetik', amount: 29000, owner: 'Zeynep Kaya', ownerInitials: 'ZK', dueDate: '21 Haz', priority: 'Normal', lastActivity: 'İlk görüşme yapıldı', stage: 'Görüşme' },
  { id: 'D-312', title: 'Gayrimenkul ilan modülü', company: 'Doğan Gayrimenkul', amount: 110000, owner: 'Ayşe Çelik', ownerInitials: 'AÇ', dueDate: '27 Haz', priority: 'Yüksek', lastActivity: 'Fiyat pazarlığı', stage: 'Pazarlık' },
]

export const dealStageMeta: Record<DealStage, { dot: string; accent: string }> =
  {
    'Yeni Fırsat': { dot: 'bg-chart-5', accent: 'border-l-chart-5' },
    Görüşme: { dot: 'bg-chart-1', accent: 'border-l-chart-1' },
    Teklif: { dot: 'bg-chart-3', accent: 'border-l-chart-3' },
    Pazarlık: { dot: 'bg-warning', accent: 'border-l-warning' },
    Kazanıldı: { dot: 'bg-success', accent: 'border-l-success' },
    Kaybedildi: { dot: 'bg-destructive', accent: 'border-l-destructive' },
  }

export const priorityMeta: Record<Priority, { variant: BadgeVariant }> = {
  Düşük: { variant: 'secondary' },
  Normal: { variant: 'info' },
  Yüksek: { variant: 'warning' },
  Acil: { variant: 'destructive' },
}

export type TaskStatus = 'Bekliyor' | 'Devam Ediyor' | 'Tamamlandı'

export type Task = {
  id: string
  title: string
  related: string
  priority: Priority
  status: TaskStatus
  dueDate: string
  assignee: string
  assigneeInitials: string
}

export const tasks: Task[] = [
  { id: 'T-901', title: 'Aydın Hafriyat sözleşme yenileme araması', related: 'Aydın Hafriyat', priority: 'Yüksek', status: 'Bekliyor', dueDate: '12 Haz 2026', assignee: 'Elif Yılmaz', assigneeInitials: 'EY' },
  { id: 'T-902', title: 'Estetik Clinic demo sunumu hazırla', related: 'Estetik Clinic İstanbul', priority: 'Normal', status: 'Devam Ediyor', dueDate: '13 Haz 2026', assignee: 'Zeynep Kaya', assigneeInitials: 'ZK' },
  { id: 'T-903', title: 'Yıldız Emlak teklifini revize et', related: 'Yıldız Emlak', priority: 'Yüksek', status: 'Devam Ediyor', dueDate: '14 Haz 2026', assignee: 'Burak Demir', assigneeInitials: 'BD' },
  { id: 'T-904', title: 'Arslan Oto fatura tahsilatı', related: 'Arslan Oto Servis', priority: 'Acil', status: 'Bekliyor', dueDate: '11 Haz 2026', assignee: 'Mert Şahin', assigneeInitials: 'MŞ' },
  { id: 'T-905', title: 'Şen Güzellik randevu modülü eğitimi', related: 'Şen Güzellik Salonu', priority: 'Düşük', status: 'Tamamlandı', dueDate: '09 Haz 2026', assignee: 'Ayşe Çelik', assigneeInitials: 'AÇ' },
  { id: 'T-906', title: 'Erdoğan İnşaat saha ziyareti planla', related: 'Erdoğan İnşaat', priority: 'Yüksek', status: 'Bekliyor', dueDate: '16 Haz 2026', assignee: 'Elif Yılmaz', assigneeInitials: 'EY' },
  { id: 'T-907', title: 'Aksoy Ajans aylık rapor gönder', related: 'Aksoy Ajans', priority: 'Normal', status: 'Tamamlandı', dueDate: '08 Haz 2026', assignee: 'Zeynep Kaya', assigneeInitials: 'ZK' },
  { id: 'T-908', title: 'Polat Dental entegrasyon testi', related: 'Polat Dental Klinik', priority: 'Normal', status: 'Devam Ediyor', dueDate: '15 Haz 2026', assignee: 'Burak Demir', assigneeInitials: 'BD' },
]

export const taskStatusMeta: Record<TaskStatus, { variant: BadgeVariant }> = {
  Bekliyor: { variant: 'secondary' },
  'Devam Ediyor': { variant: 'info' },
  Tamamlandı: { variant: 'success' },
}

export type QuoteStatus =
  | 'Taslak'
  | 'Gönderildi'
  | 'Kabul Edildi'
  | 'Reddedildi'

export type Quote = {
  id: string
  customer: string
  company: string
  amount: number
  status: QuoteStatus
  createdAt: string
  validUntil: string
}

export const quotes: Quote[] = [
  { id: 'TEK-2026-058', customer: 'Caner Aydın', company: 'Aydın Hafriyat', amount: 145000, status: 'Gönderildi', createdAt: '08 Haz 2026', validUntil: '22 Haz 2026' },
  { id: 'TEK-2026-057', customer: 'Okan Yıldız', company: 'Yıldız Emlak', amount: 92000, status: 'Kabul Edildi', createdAt: '06 Haz 2026', validUntil: '20 Haz 2026' },
  { id: 'TEK-2026-056', customer: 'Emre Polat', company: 'Polat Dental Klinik', amount: 47000, status: 'Taslak', createdAt: '05 Haz 2026', validUntil: '19 Haz 2026' },
  { id: 'TEK-2026-055', customer: 'Gül Şen', company: 'Şen Güzellik Salonu', amount: 15000, status: 'Reddedildi', createdAt: '03 Haz 2026', validUntil: '17 Haz 2026' },
  { id: 'TEK-2026-054', customer: 'Hakan Çetin', company: 'Çetin Reklam Ajansı', amount: 78000, status: 'Gönderildi', createdAt: '02 Haz 2026', validUntil: '16 Haz 2026' },
  { id: 'TEK-2026-053', customer: 'Tolga Erdoğan', company: 'Erdoğan İnşaat', amount: 320000, status: 'Kabul Edildi', createdAt: '01 Haz 2026', validUntil: '15 Haz 2026' },
  { id: 'TEK-2026-052', customer: 'Nazlı Aksoy', company: 'Aksoy Ajans', amount: 64000, status: 'Taslak', createdAt: '31 May 2026', validUntil: '14 Haz 2026' },
]

export const quoteStatusMeta: Record<QuoteStatus, { variant: BadgeVariant }> = {
  Taslak: { variant: 'secondary' },
  Gönderildi: { variant: 'info' },
  'Kabul Edildi': { variant: 'success' },
  Reddedildi: { variant: 'destructive' },
}

export const recentActivities = [
  { id: 'a1', who: 'Elif Yılmaz', action: 'Aydın Hafriyat ile arama tamamladı', time: '2 saat önce', type: 'call' as const },
  { id: 'a2', who: 'Burak Demir', action: 'Yıldız Emlak için teklif gönderdi', time: '4 saat önce', type: 'quote' as const },
  { id: 'a3', who: 'Zeynep Kaya', action: 'Estetik Clinic ile demo planladı', time: 'Dün', type: 'meeting' as const },
  { id: 'a4', who: 'Mert Şahin', action: 'Öztürk Hafriyat sözleşmesini kazandı', time: 'Dün', type: 'won' as const },
  { id: 'a5', who: 'Ayşe Çelik', action: 'Şen Güzellik için fatura oluşturdu', time: '2 gün önce', type: 'invoice' as const },
]

export const revenueData = [
  { month: 'Oca', gelir: 420000, hedef: 400000 },
  { month: 'Şub', gelir: 385000, hedef: 420000 },
  { month: 'Mar', gelir: 510000, hedef: 460000 },
  { month: 'Nis', gelir: 478000, hedef: 480000 },
  { month: 'May', gelir: 590000, hedef: 520000 },
  { month: 'Haz', gelir: 642000, hedef: 560000 },
]

export const pipelineSummary = [
  { stage: 'Yeni Fırsat', count: 12, value: 845000 },
  { stage: 'Görüşme', count: 8, value: 612000 },
  { stage: 'Teklif', count: 6, value: 498000 },
  { stage: 'Pazarlık', count: 4, value: 287000 },
  { stage: 'Kazanıldı', count: 9, value: 1240000 },
] satisfies Array<{ stage: DealStage; count: number; value: number }>

export const staffPerformance = [
  { name: 'Elif Yılmaz', initials: 'EY', deals: 18, revenue: 1240000, rate: 68 },
  { name: 'Mert Şahin', initials: 'MŞ', deals: 15, revenue: 980000, rate: 62 },
  { name: 'Zeynep Kaya', initials: 'ZK', deals: 14, revenue: 745000, rate: 59 },
  { name: 'Burak Demir', initials: 'BD', deals: 11, revenue: 612000, rate: 54 },
  { name: 'Ayşe Çelik', initials: 'AÇ', deals: 8, revenue: 388000, rate: 47 },
]

export type CalendarEventType = 'Toplantı' | 'Arama' | 'Demo' | 'Son Tarih'

export type CalendarEvent = {
  id: string
  day: number
  title: string
  time: string
  type: CalendarEventType
  with: string
}

export const calendarEvents: CalendarEvent[] = [
  { id: 'e1', day: 11, title: 'Aydın Hafriyat araması', time: '09:30', type: 'Arama', with: 'Caner Aydın' },
  { id: 'e2', day: 12, title: 'Estetik Clinic demo', time: '14:00', type: 'Demo', with: 'Selin Korkmaz' },
  { id: 'e3', day: 12, title: 'Ekip toplantısı', time: '17:00', type: 'Toplantı', with: 'Satış Ekibi' },
  { id: 'e4', day: 15, title: 'Arslan Oto tahsilat', time: '11:00', type: 'Son Tarih', with: 'Deniz Arslan' },
  { id: 'e5', day: 16, title: 'Erdoğan saha ziyareti', time: '10:00', type: 'Toplantı', with: 'Tolga Erdoğan' },
  { id: 'e6', day: 18, title: 'Yıldız Emlak sunumu', time: '13:30', type: 'Demo', with: 'Okan Yıldız' },
  { id: 'e7', day: 19, title: 'Polat Dental takip', time: '15:00', type: 'Arama', with: 'Emre Polat' },
  { id: 'e8', day: 22, title: 'Teklif son tarihi', time: '18:00', type: 'Son Tarih', with: 'Aydın Hafriyat' },
  { id: 'e9', day: 24, title: 'Öztürk sözleşme imza', time: '12:00', type: 'Toplantı', with: 'Kerem Öztürk' },
  { id: 'e10', day: 25, title: 'Aylık değerlendirme', time: '16:00', type: 'Toplantı', with: 'Yönetim' },
]

export const calendarEventMeta: Record<
  CalendarEventType,
  { variant: BadgeVariant; dot: string }
> = {
  Toplantı: { variant: 'info', dot: 'bg-chart-1' },
  Arama: { variant: 'success', dot: 'bg-success' },
  Demo: { variant: 'warning', dot: 'bg-warning' },
  'Son Tarih': { variant: 'destructive', dot: 'bg-destructive' },
}

export const upcomingTasks = tasks
  .filter((task) => task.status !== 'Tamamlandı')
  .slice(0, 5)

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}
