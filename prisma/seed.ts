import { LeadSource, LeadStatus, LeadTemperature, Prisma, TaskPriority, TaskStatus } from '@prisma/client'
import { hashPassword } from '@/lib/auth/password'
import { SYSTEM_ROLE_DEFINITIONS } from '@/lib/auth/constants'
import { ensureDefaultDealPipeline } from '@/lib/crm/bootstrap'
import { db } from '@/lib/db/prisma'

function slugify(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/(^-|-$)/g, '')
}

async function main() {
  await db.dealStageHistory.deleteMany()
  await db.dealValueHistory.deleteMany()
  await db.auditLog.deleteMany()
  await db.session.deleteMany()
  await db.activity.deleteMany()
  await db.note.deleteMany()
  await db.task.deleteMany()
  await db.deal.deleteMany()
  await db.lead.deleteMany()
  await db.contact.deleteMany()
  await db.company.deleteMany()
  await db.stage.deleteMany()
  await db.pipeline.deleteMany()
  await db.userRole.deleteMany()
  await db.role.deleteMany()
  await db.user.deleteMany()

  await Promise.all(
    SYSTEM_ROLE_DEFINITIONS.map((role) =>
      db.role.create({
        data: role,
      }),
    ),
  )

  const roles = await db.role.findMany()
  const roleBySlug = Object.fromEntries(roles.map((role) => [role.slug, role.id]))

  const passwordHash = await hashPassword('Admin123!')

  const users = await Promise.all([
    db.user.create({
      data: {
        email: 'admin@adakancrm.com',
        firstName: 'Ahmet',
        lastName: 'Adakan',
        passwordHash,
        roles: {
          create: [{ roleId: roleBySlug.owner }],
        },
      },
    }),
    db.user.create({
      data: {
        email: 'selin.yonetici@adakancrm.com',
        firstName: 'Selin',
        lastName: 'Yönetici',
        passwordHash: await hashPassword('Manager123!'),
        roles: {
          create: [{ roleId: roleBySlug.manager }],
        },
      },
    }),
    db.user.create({
      data: {
        email: 'mert.satis@adakancrm.com',
        firstName: 'Mert',
        lastName: 'Şahin',
        passwordHash: await hashPassword('Staff123!'),
        roles: {
          create: [{ roleId: roleBySlug.staff }],
        },
      },
    }),
    db.user.create({
      data: {
        email: 'zeynep.satis@adakancrm.com',
        firstName: 'Zeynep',
        lastName: 'Kaya',
        passwordHash: await hashPassword('Staff123!'),
        roles: {
          create: [{ roleId: roleBySlug.staff }],
        },
      },
    }),
  ])

  const [owner, manager, staffOne, staffTwo] = users
  const owners = [owner, manager, staffOne, staffTwo]

  const pipeline = await ensureDefaultDealPipeline(owner.id)
  const stages = await db.stage.findMany({
    where: { pipelineId: pipeline.id },
    orderBy: { position: 'asc' },
  })
  const stageByName = Object.fromEntries(stages.map((stage) => [stage.name, stage.id]))

  const companyInputs = [
    ['Aydın Hafriyat', 'Hafriyat', 'Kocaeli'],
    ['Estetik Clinic İstanbul', 'Sağlık', 'İstanbul'],
    ['Yıldız Emlak', 'Gayrimenkul', 'Ankara'],
    ['Arslan Oto Servis', 'Otomotiv', 'İzmir'],
    ['Şen Güzellik Salonu', 'Güzellik', 'Bursa'],
    ['Erdoğan İnşaat', 'İnşaat', 'Antalya'],
    ['Aksoy Ajans', 'Pazarlama', 'İstanbul'],
    ['Polat Dental Klinik', 'Sağlık', 'Eskişehir'],
  ] as const

  const companies = await Promise.all(
    companyInputs.map(([name, industry, city], index) =>
      db.company.create({
        data: {
          name,
          legalName: `${name} A.Ş.`,
          slug: slugify(name),
          website: `https://${slugify(name)}.com`,
          email: `info@${slugify(name)}.com`,
          phone: `+90 212 555 0${index + 1}0${index + 1}`,
          industry,
          city,
          country: 'Türkiye',
          status: index % 3 === 0 ? 'PROSPECT' : 'ACTIVE',
          employeeCount: 15 + index * 12,
          ownerId: owners[index % owners.length].id,
        },
      }),
    ),
  )

  const contactsSeed = [
    ['Caner', 'Aydın', 'Operasyon Müdürü'],
    ['Selin', 'Korkmaz', 'Klinik Direktörü'],
    ['Okan', 'Yıldız', 'Kurucu'],
    ['Deniz', 'Arslan', 'Servis Müdürü'],
    ['Gül', 'Şen', 'Sahip'],
    ['Tolga', 'Erdoğan', 'Satın Alma Müdürü'],
    ['Nazlı', 'Aksoy', 'Müşteri Direktörü'],
    ['Emre', 'Polat', 'Başhekim'],
    ['Buse', 'Doğan', 'Satış Temsilcisi'],
    ['Kerem', 'Öztürk', 'Saha Müdürü'],
    ['Pınar', 'Yalçın', 'Pazarlama Müdürü'],
    ['Hakan', 'Çetin', 'Ajans Sahibi'],
    ['Ayça', 'Güler', 'İK Müdürü'],
    ['Barış', 'Sönmez', 'Operasyon Uzmanı'],
    ['Ece', 'Bulut', 'Satın Alma Uzmanı'],
  ] as const

  const contacts = await Promise.all(
    contactsSeed.map(([firstName, lastName, jobTitle], index) => {
      const company = companies[index % companies.length]
      const ownerRef = owners[(index + 1) % owners.length]
      return db.contact.create({
        data: {
          firstName,
          lastName,
          jobTitle,
          email: `${slugify(firstName)}.${slugify(lastName)}@${slugify(company.name)}.com`,
          phone: `+90 532 100 ${String(10 + index).padStart(2, '0')} ${String(20 + index).padStart(2, '0')}`,
          mobilePhone: `+90 533 200 ${String(10 + index).padStart(2, '0')} ${String(30 + index).padStart(2, '0')}`,
          companyId: company.id,
          ownerId: ownerRef.id,
          isPrimary: index < companies.length,
        },
      })
    }),
  )

  const leadTemplates = [
    'CRM dönüşüm projesi',
    'Satış ekibi pipeline kurulumu',
    'Müşteri takip iyileştirmesi',
    'Saha ekip otomasyonu',
    'Yönetici raporlama paketi',
    'Yeni şube açılış desteği',
    'WhatsApp lead takibi',
    'Demo sonrası teknik keşif',
    'Teklif revizyon süreci',
    'Operasyon dashboard ihtiyacı',
    'Yıllık lisans yenileme',
    'Kurumsal onboarding planı',
  ]

  const leadSources: LeadSource[] = [
    'WEBSITE',
    'REFERRAL',
    'WHATSAPP',
    'PHONE',
    'EMAIL',
    'SOCIAL',
    'EVENT',
    'MANUAL',
  ]
  const leadTemperatures: LeadTemperature[] = ['HOT', 'WARM', 'COLD']
  const leadStatuses: LeadStatus[] = ['OPEN', 'QUALIFIED', 'OPEN', 'DISQUALIFIED']

  const leads = await Promise.all(
    leadTemplates.map((title, index) => {
      const company = companies[index % companies.length]
      const contact = contacts[index % contacts.length]
      const ownerRef = owners[index % owners.length]
      const stageName =
        index % 5 === 0 ? 'Teklif' : index % 4 === 0 ? 'Görüşme' : 'Yeni Fırsat'

      return db.lead.create({
        data: {
          title,
          description: `${company.name} için ${title.toLocaleLowerCase('tr-TR')} planlandı.`,
          companyId: company.id,
          contactId: contact.id,
          ownerId: ownerRef.id,
          pipelineId: pipeline.id,
          stageId: stageByName[stageName],
          source: leadSources[index % leadSources.length],
          temperature: leadTemperatures[index % leadTemperatures.length],
          status: leadStatuses[index % leadStatuses.length],
          estimatedValue: new Prisma.Decimal(25000 + index * 7500),
          phone: contact.mobilePhone,
          email: contact.email,
          expectedCloseAt: new Date(2026, 5, 14 + index),
        },
      })
    }),
  )

  const dealTemplates = [
    ['Saha satış ekibi kurulumu', 'Yeni Fırsat', 'OPEN'],
    ['Kurumsal CRM lisans geçişi', 'Görüşme', 'OPEN'],
    ['Teklif otomasyon paketi', 'Teklif', 'OPEN'],
    ['Çağrı merkezi entegrasyonu', 'Pazarlık', 'OPEN'],
    ['Şube açılış CRM yayılımı', 'Kazanıldı', 'WON'],
    ['Dijital takip paketi', 'Kaybedildi', 'LOST'],
    ['Yönetim dashboard kurulum işi', 'Yeni Fırsat', 'OPEN'],
    ['Satış ekibi eğitim paketi', 'Görüşme', 'OPEN'],
    ['Operasyon raporlama sözleşmesi', 'Teklif', 'OPEN'],
    ['Müşteri hizmetleri dönüşüm işi', 'Pazarlık', 'OPEN'],
    ['Yıllık destek anlaşması', 'Kazanıldı', 'WON'],
    ['Yeni bayi onboarding süreci', 'Yeni Fırsat', 'OPEN'],
    ['Lead toplama kanalı optimizasyonu', 'Görüşme', 'OPEN'],
    ['Satış tahminleme çalışması', 'Teklif', 'OPEN'],
    ['Merkez ofis rollout', 'Pazarlık', 'OPEN'],
  ] as const

  const deals = await Promise.all(
    dealTemplates.map(([title, stageName, status], index) => {
      const company = companies[index % companies.length]
      const contact = contacts[index % contacts.length]
      const ownerRef = owners[index % owners.length]
      const stage = stages.find((item) => item.name === stageName)!
      const amount = new Prisma.Decimal(45000 + index * 18000)

      return db.deal.create({
        data: {
          title,
          description: `${company.name} için ${title.toLocaleLowerCase('tr-TR')} süreci.`,
          companyId: company.id,
          contactId: contact.id,
          ownerId: ownerRef.id,
          pipelineId: pipeline.id,
          stageId: stage.id,
          status: status as 'OPEN' | 'WON' | 'LOST',
          amount,
          probability: stage.probability,
          expectedCloseAt: new Date(2026, 5, 16 + index),
          closedAt: status === 'OPEN' ? null : new Date(2026, 5, 10 + index),
          wonAt: status === 'WON' ? new Date(2026, 5, 10 + index) : null,
          lostAt: status === 'LOST' ? new Date(2026, 5, 10 + index) : null,
        },
      })
    }),
  )

  const taskTitles = [
    'İlk keşif aramasını tamamla',
    'Demo tarihini kesinleştir',
    'Teklifi güncelle',
    'Pazarlık notlarını işle',
    'Kazanılan müşteriye onboarding planı çıkar',
    'Kaybedilen deal için neden analizi yap',
    'Şirket kaydını güncelle',
    'Kontak doğrulaması yap',
    'Lead kaynağını kontrol et',
    'Anlaşma kapanış tarihini teyit et',
    'Yönetici raporu hazırla',
    'Sözleşme taslağını gönder',
    'Aktivite özetini sisteme işle',
    'Müşteri notlarını düzenle',
    'Takvim toplantısını oluştur',
    'Satış temsilcisine atama yap',
    'Deal değerini güncelle',
    'Pazarlık sonrası takip araması yap',
    'Pipeline güncellemesini kontrol et',
    'Kapanış sonrası memnuniyet notu ekle',
  ]

  const taskStatuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']
  const taskPriorities: TaskPriority[] = ['HIGH', 'MEDIUM', 'URGENT', 'LOW']

  const tasks = await Promise.all(
    taskTitles.map((title, index) =>
      db.task.create({
        data: {
          title,
          description: `${title} görevi satış akışının bir parçası olarak planlandı.`,
          companyId: companies[index % companies.length].id,
          contactId: contacts[index % contacts.length].id,
          leadId: leads[index % leads.length].id,
          dealId: deals[index % deals.length].id,
          assigneeId: owners[index % owners.length].id,
          creatorId: owner.id,
          status: taskStatuses[index % taskStatuses.length],
          priority: taskPriorities[index % taskPriorities.length],
          dueAt: new Date(2026, 5, 12 + index),
          completedAt:
            taskStatuses[index % taskStatuses.length] === 'DONE'
              ? new Date(2026, 5, 10 + index)
              : null,
        },
      }),
    ),
  )

  await Promise.all(
    deals.map((deal, index) =>
      db.dealStageHistory.create({
        data: {
          dealId: deal.id,
          actorId: owners[index % owners.length].id,
          toPipelineId: deal.pipelineId,
          toStageId: deal.stageId,
          amountSnapshot: deal.amount,
          currency: deal.currency,
          note: 'İlk pipeline yerleşimi',
        },
      }),
    ),
  )

  await Promise.all(
    deals.map((deal, index) =>
      db.dealValueHistory.create({
        data: {
          dealId: deal.id,
          actorId: owners[index % owners.length].id,
          newValue: deal.amount,
          currency: deal.currency,
          reason: 'Seed başlangıç değeri',
        },
      }),
    ),
  )

  await Promise.all(
    Array.from({ length: 32 }).map((_, index) =>
      db.activity.create({
        data: {
          actorId: owners[index % owners.length].id,
          companyId: companies[index % companies.length].id,
          contactId: contacts[index % contacts.length].id,
          leadId: leads[index % leads.length].id,
          dealId: deals[index % deals.length].id,
          taskId: tasks[index % tasks.length].id,
          type: index % 4 === 0 ? 'MEETING' : index % 4 === 1 ? 'CALL' : index % 4 === 2 ? 'STATUS_CHANGE' : 'NOTE',
          subject: [
            'İlk görüşme tamamlandı',
            'Müşteri geri dönüşü alındı',
            'Teklif revize edildi',
            'Süreç notu eklendi',
          ][index % 4],
          description: 'Seed verisi için oluşturulan gerçekçi CRM aktivitesi.',
          occurredAt: new Date(2026, 5, 1 + index, 9 + (index % 6), 15),
        },
      }),
    ),
  )

  await Promise.all(
    Array.from({ length: 24 }).map((_, index) =>
      db.note.create({
        data: {
          authorId: owners[index % owners.length].id,
          companyId: companies[index % companies.length].id,
          contactId: contacts[index % contacts.length].id,
          leadId: leads[index % leads.length].id,
          dealId: deals[index % deals.length].id,
          taskId: tasks[index % tasks.length].id,
          title: `İç not ${index + 1}`,
          body: 'Müşteri beklentileri, sonraki adımlar ve risk notları burada tutuluyor.',
          isPinned: index % 7 === 0,
        },
      }),
    ),
  )

  await Promise.all(
    deals.map((deal, index) =>
      db.auditLog.create({
        data: {
          actorId: owners[index % owners.length].id,
          action: 'CREATE',
          entityType: 'Deal',
          entityId: deal.id,
          summary: `${deal.title} seed verisiyle oluşturuldu`,
          metadata: { seed: true },
        },
      }),
    ),
  )

  console.log('Seed completed successfully.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
