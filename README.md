# Adakan CRM

Adakan CRM, Next.js App Router uzerinde calisan, Prisma ve PostgreSQL ile gercek veriye bagli bir CRM MVP projesidir. Proje statik bir demo gorunumunden cikarilip, temel CRM operasyonlarini calistiran bir uygulama mimarisine donusturulmustur.

## Stack

- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL / Neon
- Zod
- Server Actions
- Custom session auth + RBAC
- Playwright smoke tests

## Kurulum

1. Bagimliliklari yukleyin:

```bash
npm install
```

2. Ortam degiskenlerini tanimlayin:

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
SESSION_SECRET=uzun-guvenli-bir-deger
```

3. Prisma client olusturun:

```bash
npm run prisma:generate
```

4. Veritabanini senkronize edin:

```bash
npm run db:push
```

5. Seed verisini yukleyin:

```bash
npm run seed
```

## Giris Bilgileri

- E-posta: `admin@adakancrm.com`
- Sifre: `Admin123!`

## Dogrulama

Tum temel saglik kontrolleri:

```bash
npm run verify
```

Smoke regresyon testi:

```bash
npm run test:smoke
```

## Mevcut MVP Kapsami

- Login, setup, session ve route korumasi
- RBAC tabanli temel yetkilendirme
- Dashboard icin gercek Prisma metrikleri
- Musteriler, firmalar, leads, anlasmalar, gorevler, takvim ve pipeline sayfalari
- Quick create ile gercek kayit olusturma
- Lead, deal ve gorev durum/atama guncellemeleri
- Drag and drop pipeline persistence
- Deal stage history ve deal value history
- Audit logging
- Not ve aktivite timeline altyapisi
- Firma ve musteri yonetim diyaloglari ile not / aktivite akislarinin ana uygulamaya baglanmasi

## Bilerek Ertelenenler

Su an MVP disinda birakildi:

- Fatura, teklif, stok, envanter
- Otomasyon / workflow motoru
- Gelismis raporlama ve BI ekranlari
- Tam kapsamli pipeline yonetim paneli
- Tam kapsamli inline editing formlari tum moduller icin

## Notlar

- `/setup` sadece sistemde hic kullanici yoksa kullanilabilir.
- Seed verisi Turkce CRM senaryolari ve pipeline asamalari ile gelir.
- Uygulama demo veriler yerine gercek Prisma sorgulari kullanir.
