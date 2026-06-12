import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'

const PROTECTED_PREFIXES = [
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
  '/admin',
]

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) =>
    prefix === '/' ? pathname === '/' : pathname.startsWith(prefix),
  )
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value)

  if ((pathname === '/login' || pathname === '/setup') && hasSessionCookie) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (isProtectedPath(pathname) && !hasSessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
