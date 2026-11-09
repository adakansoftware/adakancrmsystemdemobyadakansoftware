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
- TR/EN i18n (typed sozlukler, cookie tabanli dil degistirme)
- Vitest (unit + coverage) ve Playwright testleri
- Health endpoint + lightweight smoke checks

## Ortam Degiskenleri

`.env.example` dosyasini baz alin:

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXTAUTH_SECRET=uzun-guvenli-bir-deger
APP_URL=http://localhost:3000
TRUST_PROXY_HEADERS=false
RATE_LIMIT_STORE=database
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

Bu degerler sadece yerel kurulum icin varsayilanlardir. Paylasilan bir ortama
seed atacaksan parolalari cevre degiskenleriyle donusturun:

```bash
SEED_ADMIN_PASSWORD=... SEED_MANAGER_PASSWORD=... SEED_STAFF_PASSWORD=... npm run seed
```

Tarayici testleri de `E2E_ADMIN_EMAIL` ve `E2E_ADMIN_PASSWORD` degiskenlerini
destekler; belirtilmezse ayni varsayilanlari kullanir.

## Komutlar

```bash
npm run lint
npm run build
npm run test:unit
npm run test:smoke
npm run test:smoke:browser
npm run verify
```

Anlamlari:

- `test:unit`: Vitest unit testleri, V8 coverage raporuyla (`coverage/`)
- `test:smoke`: hizli operasyon smoke kontrolu
- `test:smoke:browser`: tarayici tabanli daha agir regresyon akisi
- `verify`: prisma schema, lint, build, unit ve hizli smoke kontrolu

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
- Production ortaminda `NEXTAUTH_SECRET` zorunludur; tanimli degilse uygulama fail-closed sekilde acilmaz.
- Varsayilan rate limiter paylasimli PostgreSQL store kullanir; `RATE_LIMIT_STORE=memory` sadece tek-instance yerel gelistirme icin dusunulmelidir.
- `TRUST_PROXY_HEADERS=true` yalnizca Vercel veya guvendiginiz reverse proxy arkasinda kullanilmalidir.
- Uretim kontrolunde once `/api/health`, sonra `npm run verify` calistirilmasi tavsiye edilir.

## Proje Yapisi

```
app/            Routelar: (app) authenticated shell, /login, /setup, /admin, api/
components/     UI + CRM istemci bilesenleri, i18n provider
lib/            Sunucu katmanlari (bkz. docs/architecture.md)
  auth/         Session, RBAC, login rate limit
  crm/          queries/ (okuma) + view-models
  validation/   Zod semalari (mesajlar i18n anahtari tasir)
  i18n/         Typed TR/EN sozlukler, enum etiketleri
  export/       CSV export + formula injection korumasi
  security/     Rate limit store
prisma/         Schema + seed
tests/          unit/ (Vitest) + smoke.spec.ts (Playwright)
docs/           Mimari notlar, audit raporu, puan raporu
```

Katman kurallari ve veri akisi icin [docs/architecture.md](docs/architecture.md),
guvenlik hardening gecmisi icin [docs/codebase-audit-report.md](docs/codebase-audit-report.md).
