import { Download, Plus, Search, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { ContactsTableClient } from '@/app/(app)/musteriler/contacts-table-client'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { listCompanies } from '@/app/actions/crm'
import { getAssignableUsers, getContactsManagementPageData } from '@/lib/crm/queries'

const PAGE_SIZE = 25

type CustomersPageSearchParams = {
  q?: string
  company?: string
  sort?: string
  page?: string
}

function buildCustomersUrl(params: CustomersPageSearchParams) {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value && value.trim() !== '') {
      searchParams.set(key, value)
    }
  }

  const query = searchParams.toString()
  return query ? `/musteriler?${query}` : '/musteriler'
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<CustomersPageSearchParams>
}) {
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const companyFilter = params.company?.trim() ?? ''
  const sort = params.sort === 'created-desc' ? 'created-desc' : 'name-asc'
  const currentPage = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)

  const [contacts, users, companies] = await Promise.all([
    getContactsManagementPageData(),
    getAssignableUsers(),
    listCompanies(),
  ])

  const filteredContacts = contacts
    .filter((contact) => {
      const matchesQuery =
        query.length === 0 ||
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
          .includes(query.toLowerCase())

      const matchesCompany =
        companyFilter.length === 0 || contact.companyId === companyFilter

      return matchesQuery && matchesCompany
    })
    .sort((left, right) => {
      if (sort === 'created-desc') {
        return right.createdAt.getTime() - left.createdAt.getTime()
      }

      return left.name.localeCompare(right.name, 'tr')
    })

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const pageStart = (page - 1) * PAGE_SIZE
  const paginatedContacts = filteredContacts.slice(pageStart, pageStart + PAGE_SIZE)
  const selectedCompany = companies.find((company) => company.id === companyFilter)

  return (
    <>
      <PageHeader
        title="Musteriler"
        description="Kisi kayitlarini arayin, filtreleyin ve satis baglantilariyla birlikte yonetin."
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

      <Card>
        <CardContent className="space-y-4 pt-6">
          <form className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <label className="space-y-2 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Search className="size-4" />
                Arama
              </span>
              <Input name="q" defaultValue={query} placeholder="Isim, e-posta, telefon veya firma" />
            </label>

            <label className="space-y-2 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <SlidersHorizontal className="size-4" />
                Sirket
              </span>
              <select
                name="company"
                defaultValue={companyFilter}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Tum sirketler</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Siralama</span>
              <select
                name="sort"
                defaultValue={sort}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="name-asc">Isme gore (A-Z)</option>
                <option value="created-desc">Eklenme tarihine gore (yeni)</option>
              </select>
            </label>

            <div className="flex items-end gap-2">
              <Button type="submit">Uygula</Button>
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link href="/musteriler">Temizle</Link>}
              />
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{filteredContacts.length} kayit bulundu</span>
            <Badge variant="secondary">Sayfa {page} / {totalPages}</Badge>
            {selectedCompany ? <Badge variant="outline">{selectedCompany.name}</Badge> : null}
            {query ? <Badge variant="outline">Arama: {query}</Badge> : null}
          </div>
        </CardContent>
      </Card>

      <ContactsTableClient
        contacts={paginatedContacts}
        users={users}
        companies={companies.map((company) => ({ id: company.id, name: company.name }))}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredContacts.length === 0
            ? 'Gosterilecek musteri yok.'
            : `${pageStart + 1}-${Math.min(pageStart + PAGE_SIZE, filteredContacts.length)} arasi kayitlar gosteriliyor.`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link
                href={buildCustomersUrl({
                  q: query || undefined,
                  company: companyFilter || undefined,
                  sort,
                  page: String(Math.max(1, page - 1)),
                })}
                aria-disabled={page <= 1}
                className={page <= 1 ? 'pointer-events-none opacity-50' : undefined}
              >
                Onceki
              </Link>
            }
          />
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link
                href={buildCustomersUrl({
                  q: query || undefined,
                  company: companyFilter || undefined,
                  sort,
                  page: String(Math.min(totalPages, page + 1)),
                })}
                aria-disabled={page >= totalPages}
                className={page >= totalPages ? 'pointer-events-none opacity-50' : undefined}
              >
                Sonraki
              </Link>
            }
          />
        </div>
      </div>
    </>
  )
}
