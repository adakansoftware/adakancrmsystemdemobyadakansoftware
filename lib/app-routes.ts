// Canonical list of authenticated app routes. `proxy.ts` uses this for
// redirects; the sidebar in `lib/nav.ts` renders the same routes with
// titles and icons. Keep both in sync when adding a page.
export const APP_PROTECTED_PREFIXES = [
  '/',
  '/musteriler',
  '/firmalar',
  '/leads',
  '/anlasmalar',
  '/pipeline',
  '/gorevler',
  '/takvim',
  '/teklifler',
  '/ayarlar',
  '/raporlar',
] as const
