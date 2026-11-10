# Contributing

Kısa rehber. Mimari detaylar için [docs/architecture.md](docs/architecture.md).

## Kurulum

```bash
npm install
cp .env.example .env    # DATABASE_URL doldur
npm run db:push
npm run seed
npm run dev
```

## Değişiklik göndermeden önce

`npm run verify` çalıştır. Zincir şunları içerir:

1. `prisma validate` — şema geçerli mi
2. `eslint .` — lint temiz mi
3. `next build` — tip kontrolü + production build
4. `vitest run --coverage` — unit testler (lib/ coverage raporuyla)
5. `node scripts/smoke-test.mjs` — HTTP smoke kontrolleri (dev server gerekir)

Tarayıcı akışlarını da değiştirdiysen `npm run test:smoke:browser` çalıştır
(Playwright, kendi dev server'ını başlatır).

## Kurallar

- **Katman ayrımı:** okuma `lib/crm/queries/`, yazma server action + Zod şeması.
  Bileşenler Prisma'ya direkt dokunmaz.
- **i18n:** kullanıcıya görünen her metin sözlükten gelir
  (`lib/i18n/dictionaries/tr.ts` + `en.ts`). TR değerleri ASCII Türkçe.
  Yeni anahtar eklerken her iki sözlüğe de ekle — eksik anahtar tsc hatasıdır.
  Zod mesajları `validation.*` anahtarı taşır, çeviri gösterimde yapılır.
- **Test:** yeni saf fonksiyon için `tests/unit/` altına vitest spec ekle.
  DB'ye dokunan query mantığı prisma mock'u ile test edilir (örnek:
  `tests/unit/queries.spec.ts`).
- **Commit stili:** İngilizce imperative özet (örn. "Add tag color validation").
  Bir commit tek amaca hizmet etsin.

## Bilinen ertelemeler

- next-auth v5 hâlâ beta; stable v4'e düşürme planı yok (API farklı).

## Prisma 7 notları

- Client `lib/db/generated/prisma` altına generate edilir (`prisma-client`
  generator). Import yolu: `@/lib/db/generated/prisma/client`.
- `Prisma.validator` kaldırıldı; select nesneleri `satisfies Prisma.XSelect`
  ile yazılır (örnek: `lib/auth/user-safe-select.ts`).
- Bağlantı URL'i şemada değil `prisma.config.ts` içinde (`datasource.url`,
  migrate için) ve `lib/db/prisma.ts` içinde (`@prisma/adapter-pg`) taşınır.
- `lib/db/prisma.ts` lazy proxy'dir: modül import'u `DATABASE_URL`
  gerektirmez, ilk sorguda client oluşur.
