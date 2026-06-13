import { Plus } from 'lucide-react'
import Link from 'next/link'
import { CompaniesGridClient } from '@/app/(app)/firmalar/companies-grid-client'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { getAssignableUsers, getCompaniesManagementPageData } from '@/lib/crm/queries'

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const normalizedQuery = q?.trim().toLowerCase() ?? ''
  const [companies, users] = await Promise.all([
    getCompaniesManagementPageData(),
    getAssignableUsers(),
  ])
  const filteredCompanies = normalizedQuery
    ? companies.filter((company) =>
        [company.name, company.legalName, company.sector, company.city, company.owner]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : companies

  return (
    <>
      <PageHeader
        title="Firmalar"
        description={
          normalizedQuery
            ? `"${q}" icin firma sonuclari`
            : 'Kurumsal hesaplarin tum ozet gorunumu'
        }
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/api/export?entity=companies">CSV Indir</Link>}
        />
        <Button
          nativeButton={false}
          render={
            <Link href="/firmalar?quickCreate=company">
              <Plus data-icon="inline-start" />
              Yeni Firma
            </Link>
          }
        />
      </PageHeader>

      <CompaniesGridClient companies={filteredCompanies} users={users} />
    </>
  )
}
