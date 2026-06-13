import { Download, Plus } from 'lucide-react'
import Link from 'next/link'
import { ContactsTableClient } from '@/app/(app)/musteriler/contacts-table-client'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { listCompanies } from '@/app/actions/crm'
import { getAssignableUsers, getContactsManagementPageData } from '@/lib/crm/queries'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const normalizedQuery = q?.trim().toLowerCase() ?? ''
  const [contacts, users, companies] = await Promise.all([
    getContactsManagementPageData(),
    getAssignableUsers(),
    listCompanies(),
  ])
  const filteredContacts = normalizedQuery
    ? contacts.filter((contact) =>
        [
          contact.name,
          contact.company,
          contact.email,
          contact.phone,
          contact.owner,
          contact.jobTitle,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : contacts

  return (
    <>
      <PageHeader
        title="Musteriler"
        description={
          normalizedQuery
            ? `"${q}" icin musteri sonuclari`
            : 'Tum musteri iliskilerini gercek verilerle yonetin'
        }
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link href="/api/export?entity=contacts">
              <Download data-icon="inline-start" />
              Disa Aktar
            </Link>
          }
        />
        <Button
          nativeButton={false}
          render={
            <Link href="/musteriler?quickCreate=contact">
              <Plus data-icon="inline-start" />
              Yeni Musteri
            </Link>
          }
        />
      </PageHeader>

      <ContactsTableClient
        contacts={filteredContacts}
        users={users}
        companies={companies.map((company) => ({ id: company.id, name: company.name }))}
      />
    </>
  )
}
