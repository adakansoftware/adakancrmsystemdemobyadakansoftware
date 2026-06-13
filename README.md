# Adakan CRM

Adakan CRM, Next.js App Router uzerinde calisan, Prisma ve PostgreSQL ile gercek veriye bagli bir CRM MVP projesidir. Proje statik bir demo gorunumunden cikarilip temel CRM operasyonlarini calistiran, auth, RBAC, audit log ve pipeline gecmisi olan bir uygulama yapisina donusturulmustur.

## Stack

- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL / Neon
- Zod
- Server Actions
- Custom session auth + RBAC
- Health endpoint + lightweight smoke checks

## Ortam Degiskenleri

`.env.example` dosyasini baz alin:

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
SESSION_SECRET=uzun-guvenli-bir-deger
APP_URL=http://localhost:3000
```

## Kurulum

```bash
npm install
npm run prisma:generate
npm run db:push
npm run seed
```

## Giris Bilgileri

- E-posta: `admin@adakancrm.com`
- Sifre: `Admin123!`

## Komutlar

```bash
npm run lint
npm run build
npm run test:smoke
npm run test:smoke:browser
npm run verify
```

Anlamlari:

- `test:smoke`: hizli operasyon smoke kontrolu
- `test:smoke:browser`: tarayici tabanli daha agir regresyon akisi
- `verify`: prisma schema, lint, build ve hizli smoke kontrolu

## Health Endpoint

`/api/health` endpoint'i su alanlari raporlar:

- env/readiness durumu
- veritabani baglanti sagligi
- kullanici/seed hazirligi
- genel `ok | warn | error` durumu

Beklenen kullanim:

```bash
curl http://localhost:3000/api/health
```

## Mevcut MVP Kapsami

- Login, setup, session ve route korumasi
- RBAC tabanli temel yetkilendirme
- Dashboard icin gercek Prisma metrikleri
- Musteriler, firmalar, leads, anlasmalar, gorevler, takvim ve pipeline sayfalari
- Quick create ile gercek kayit olusturma
- Lead, deal ve gorev durum/atama guncellemeleri
- Pipeline persistence ve stage movement history
- Deal value history
- Audit logging
- Not ve aktivite timeline altyapisi
- Firma ve musteri yonetim diyaloglari
- Global CRM arama ve filtreli sonuc gecisleri

## Bilerek Ertelenenler

- Fatura, teklif, stok, envanter
- Otomasyon / workflow motoru
- Gelismis BI ve raporlama panelleri
- Tam kapsamli pipeline yonetim paneli
- Tum moduller icin tam kapsamli browser regression paketi

## Operasyon Notlari

- `/setup` sadece sistemde hic kullanici yoksa kullanilabilir.
- Seed verisi Turkce CRM senaryolari ve pipeline asamalari ile gelir.
- Ana uygulama sayfalari fake demo array'lerine bagli degildir.
- `APP_URL`, smoke script ve health kontrolleri icin tanimli olmalidir.
- Uretim kontrolunde once `/api/health`, sonra `npm run verify` calistirilmasi tavsiye edilir.
