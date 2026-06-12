import { CrmSidebar } from '@/components/layout/crm-sidebar'
import { Topbar } from '@/components/layout/topbar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getRoleSlugs, requireAuthenticatedUser, requirePermission } from '@/lib/auth/rbac'
import { getQuickCreateOptions } from '@/lib/crm/queries'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuthenticatedUser()
  await requirePermission('users:manage')
  const quickCreateOptions = await getQuickCreateOptions()
  const roles = getRoleSlugs(session)

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
          <div className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
            Admin erişimi aktif · Roller: {roles.join(', ')}
          </div>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
