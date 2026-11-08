import { Building2, Download, Plus, Search, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { CompaniesGridClient } from '@/app/(app)/firmalar/companies-grid-client'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getAssignableUsers, getCompaniesManagementPageData } from '@/lib/crm/queries'
import { createEnumLabels } from '@/lib/i18n/enums'
import { getI18n } from '@/lib/i18n/server'
import { formatCurrency } from '@/lib/format'

const PAGE_SIZE = 24

type CompaniesPageSearchParams = {
  q?: string
  status?: string
  sort?: string
  page?: string
}

function buildCompaniesUrl(params: CompaniesPageSearchParams) {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value && value.trim() !== '') {
      searchParams.set(key, value)
    }
  }

  const query = searchParams.toString()
  return query ? `/firmalar?${query}` : '/firmalar'
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<CompaniesPageSearchParams>
}) {
  const { t, locale } = await getI18n()
  const labels = createEnumLabels(t)
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const statusFilter = params.status?.trim() ?? ''
  const sort = params.sort === 'value-desc' ? 'value-desc' : 'name-asc'
  const currentPage = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)

  const [companies, users] = await Promise.all([
    getCompaniesManagementPageData(),
    getAssignableUsers(),
  ])

  const filteredCompanies = companies
    .filter((company) => {
      const matchesQuery =
        query.length === 0 ||
        [company.name, company.legalName, company.sector, company.city, company.owner]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase())

      const matchesStatus = statusFilter.length === 0 || company.status === statusFilter

      return matchesQuery && matchesStatus
    })
    .sort((left, right) => {
      if (sort === 'value-desc') {
        return right.totalValue - left.totalValue
      }

      return left.name.localeCompare(right.name, 'tr')
    })

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const pageStart = (page - 1) * PAGE_SIZE
  const paginatedCompanies = filteredCompanies.slice(pageStart, pageStart + PAGE_SIZE)
  const totalOpenPipelineValue = filteredCompanies.reduce((sum, company) => sum + company.totalValue, 0)
  const totalContacts = filteredCompanies.reduce((sum, company) => sum + company.relatedCustomers, 0)
  const activeCompanies = filteredCompanies.filter((company) => company.status === 'ACTIVE').length
  const statusOptions = [
    { value: '', label: t('companies.allStatuses') },
    { value: 'ACTIVE', label: labels.companyStatus.ACTIVE },
    { value: 'PROSPECT', label: labels.companyStatus.PROSPECT },
    { value: 'INACTIVE', label: labels.companyStatus.INACTIVE },
    { value: 'ARCHIVED', label: labels.companyStatus.ARCHIVED },
  ]

  return (
    <>
      <PageHeader
        title={t('companies.title')}
        description={t('companies.description')}
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link href="/api/export?entity=companies">
              <Download data-icon="inline-start" />
              {t('companies.downloadCsv')}
            </Link>
          }
        />
        <Button
          nativeButton={false}
          render={
            <Link href="/firmalar?quickCreate=company">
              <Plus data-icon="inline-start" />
              {t('companies.newCompany')}
            </Link>
          }
        />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="space-y-1 pt-6">
            <p className="text-sm text-muted-foreground">{t('companies.filteredCount')}</p>
            <p className="text-3xl font-semibold">{filteredCompanies.length}</p>
            <p className="text-xs text-muted-foreground">
              {t('companies.activeAccounts', { count: activeCompanies })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-6">
            <p className="text-sm text-muted-foreground">{t('companies.totalContacts')}</p>
            <p className="text-3xl font-semibold">{totalContacts}</p>
            <p className="text-xs text-muted-foreground">{t('companies.contactsHint')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-6">
            <p className="text-sm text-muted-foreground">{t('companies.totalDealImpact')}</p>
            <p className="text-3xl font-semibold">
              {formatCurrency(totalOpenPipelineValue, 'TRY', locale)}
            </p>
            <p className="text-xs text-muted-foreground">{t('companies.portfolioHint')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <form className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <label className="space-y-2 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Search className="size-4" />
                {t('common.search')}
              </span>
              <Input name="q" defaultValue={query} placeholder={t('companies.searchPlaceholder')} />
            </label>

            <label className="space-y-2 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Building2 className="size-4" />
                {t('common.colStatus')}
              </span>
              <select
                name="status"
                defaultValue={statusFilter}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {statusOptions.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <SlidersHorizontal className="size-4" />
                {t('contacts.sort')}
              </span>
              <select
                name="sort"
                defaultValue={sort}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="name-asc">{t('companies.sortNameAsc')}</option>
                <option value="value-desc">{t('companies.sortValueDesc')}</option>
              </select>
            </label>

            <div className="flex items-end gap-2">
              <Button type="submit">{t('common.apply')}</Button>
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link href="/firmalar">{t('common.clear')}</Link>}
              />
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{t('common.recordsFound', { count: filteredCompanies.length })}</span>
            <Badge variant="secondary">{t('common.pageRange', { page, total: totalPages })}</Badge>
            {statusFilter ? (
              <Badge variant="outline">
                {statusOptions.find((option) => option.value === statusFilter)?.label ?? statusFilter}
              </Badge>
            ) : null}
            {query ? <Badge variant="outline">{t('common.searchBadge', { query })}</Badge> : null}
          </div>
        </CardContent>
      </Card>

      <CompaniesGridClient companies={paginatedCompanies} users={users} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredCompanies.length === 0
            ? t('companies.empty')
            : t('common.showingRange', {
                start: pageStart + 1,
                end: Math.min(pageStart + PAGE_SIZE, filteredCompanies.length),
              })}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link
                href={buildCompaniesUrl({
                  q: query || undefined,
                  status: statusFilter || undefined,
                  sort,
                  page: String(Math.max(1, page - 1)),
                })}
                aria-disabled={page <= 1}
                className={page <= 1 ? 'pointer-events-none opacity-50' : undefined}
              >
                {t('common.prev')}
              </Link>
            }
          />
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link
                href={buildCompaniesUrl({
                  q: query || undefined,
                  status: statusFilter || undefined,
                  sort,
                  page: String(Math.min(totalPages, page + 1)),
                })}
                aria-disabled={page >= totalPages}
                className={page >= totalPages ? 'pointer-events-none opacity-50' : undefined}
              >
                {t('common.next')}
              </Link>
            }
          />
        </div>
      </div>
    </>
  )
}
