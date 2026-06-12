import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CrmSidebar } from '@/components/layout/crm-sidebar'
import { Topbar } from '@/components/layout/topbar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { requireAuthenticatedUser } from '@/lib/auth/rbac'
import { db } from '@/lib/db/prisma'

export const metadata: Metadata = {
  title: 'Adakan CRM',
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userCount = await db.user.count()

  if (userCount === 0) {
    redirect('/setup')
  }

  await requireAuthenticatedUser()

  return (
    <SidebarProvider>
      <CrmSidebar />
      <SidebarInset>
        <Topbar />
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
