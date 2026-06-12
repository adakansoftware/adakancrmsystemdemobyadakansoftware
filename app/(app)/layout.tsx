import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CrmSidebar } from '@/components/layout/crm-sidebar'
import { Topbar } from '@/components/layout/topbar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { requireAuthenticatedUser } from '@/lib/auth/rbac'
import { getQuickCreateOptions } from '@/lib/crm/queries'
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

  const session = await requireAuthenticatedUser()
  const quickCreateOptions = await getQuickCreateOptions()

  return (
    <SidebarProvider>
      <CrmSidebar />
      <SidebarInset>
        <Topbar
          currentUser={{
            name: `${session.user.firstName} ${session.user.lastName}`,
            email: session.user.email,
            initials: `${session.user.firstName[0] ?? ''}${session.user.lastName[0] ?? ''}`,
          }}
          quickCreateOptions={quickCreateOptions}
        />
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
