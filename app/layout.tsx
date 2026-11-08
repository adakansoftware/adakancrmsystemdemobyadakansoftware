import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { LocaleProvider } from '@/components/i18n/locale-provider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { env } from '@/lib/env'
import { getLocale } from '@/lib/i18n/server'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Adakan CRM - Musteri Iliskileri Yonetimi',
  description:
    'Kucuk isletmeler icin modern, sade ve guclu CRM. Lead takibi, satis hatti ve gorev yonetimi tek panelde.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider locale={locale}>
            <TooltipProvider delay={200}>{children}</TooltipProvider>
          </LocaleProvider>
          <Toaster />
        </ThemeProvider>
        {env.isProduction && <Analytics />}
      </body>
    </html>
  )
}
