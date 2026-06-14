import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const APP_PROTECTED_PREFIXES = [
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
]

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) =>
    prefix === '/' ? pathname === '/' : pathname.startsWith(prefix),
  )
}

export default auth((request) => {
  const pathname = request.nextUrl.pathname
  const isAuthenticated = Boolean(request.auth?.user)
  const roleSlugs = request.auth?.user?.roleSlugs ?? []

  if ((pathname === '/login' || pathname === '/setup') && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (matchesPrefix(pathname, APP_PROTECTED_PREFIXES) && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/admin') && !roleSlugs.includes('owner')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'same-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')

  return response
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
