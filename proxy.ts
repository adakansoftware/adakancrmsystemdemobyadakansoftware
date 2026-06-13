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
  let response: NextResponse

  if ((pathname === '/login' || pathname === '/setup') && hasSessionCookie) {
    response = NextResponse.redirect(new URL('/', request.url))
  } else if (isProtectedPath(pathname) && !hasSessionCookie) {
    response = NextResponse.redirect(new URL('/login', request.url))
  } else {
    response = NextResponse.next()
  }

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'same-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
