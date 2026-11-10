'use client'

import Link from 'next/link'
import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Bell,
  CheckSquare,
  FileText,
  Handshake,
  Languages,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  User,
  UserPlus,
} from 'lucide-react'
import { logoutAction } from '@/app/actions/auth'
import { useI18n } from '@/components/i18n/locale-provider'
import { QuickCreateDialog } from '@/components/layout/quick-create-dialog'
import { SearchInput } from '@/components/shared/search-input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import type {
  GlobalSearchResultItem,
  QuickCreateKind,
  QuickCreateOptions,
} from '@/lib/crm/view-models'
import { LOCALE_COOKIE } from '@/lib/i18n/config'

const notificationKeys = [
  {
    titleKey: 'topbar.notifLeadTitle',
    descriptionKey: 'topbar.notifLeadDescription',
    timeKey: 'topbar.notifLeadTime',
  },
  {
    titleKey: 'topbar.notifPipelineTitle',
    descriptionKey: 'topbar.notifPipelineDescription',
    timeKey: 'topbar.notifPipelineTime',
  },
  {
    titleKey: 'topbar.notifTaskTitle',
    descriptionKey: 'topbar.notifTaskDescription',
    timeKey: 'topbar.notifTaskTime',
  },
] as const

const quickCreateItems = [
  { labelKey: 'topbar.newContact', icon: UserPlus, kind: 'contact' },
  { labelKey: 'topbar.newDeal', icon: Handshake, kind: 'deal' },
  { labelKey: 'topbar.newTask', icon: CheckSquare, kind: 'task' },
  { labelKey: 'topbar.newCompany', icon: FileText, kind: 'company' },
] as const

const searchKindLabelKeys = {
  company: 'topbar.kindCompany',
  contact: 'topbar.kindContact',
  lead: 'topbar.kindLead',
  deal: 'topbar.kindDeal',
  task: 'topbar.kindTask',
} as const satisfies Record<GlobalSearchResultItem['kind'], string>

type TopbarProps = {
  currentUser: {
    name: string
    email: string
    initials: string
  }
  quickCreateOptions: QuickCreateOptions
}

type SearchResultsPanelProps = {
  query: string
  loading: boolean
  open: boolean
  results: GlobalSearchResultItem[]
  onSelect: () => void
  className?: string
}

function SearchResultsPanel({
  query,
  loading,
  open,
  results,
  onSelect,
  className,
}: SearchResultsPanelProps) {
  const { t } = useI18n()

  if (!open) {
    return null
  }

  return (
    <div
      className={`rounded-xl border bg-background p-2 shadow-xl ${className ?? ''}`}
      role="listbox"
      aria-label={t('topbar.searchResultsAria')}
    >
      {query.trim().length < 2 ? (
        <div className="px-3 py-2 text-sm text-muted-foreground">
          {t('topbar.searchMinChars')}
        </div>
      ) : null}

      {query.trim().length >= 2 && loading ? (
        <div className="px-3 py-2 text-sm text-muted-foreground">{t('topbar.searching')}</div>
      ) : null}

      {query.trim().length >= 2 && !loading && results.length === 0 ? (
        <div className="px-3 py-2 text-sm text-muted-foreground">
          {t('topbar.searchNoResults')}
        </div>
      ) : null}

      {results.map((result) => (
        <Link
          key={`${result.kind}-${result.id}`}
          href={`${result.href}?q=${encodeURIComponent(result.title)}`}
          onClick={onSelect}
          className="flex items-start justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{result.title}</p>
            <p className="truncate text-xs text-muted-foreground">{result.subtitle}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {t(searchKindLabelKeys[result.kind])}
          </Badge>
        </Link>
      ))}
    </div>
  )
}

export function Topbar({ currentUser, quickCreateOptions }: TopbarProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const { locale, t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [quickOpen, setQuickOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const deferredSearchValue = useDeferredValue(searchValue)
  const [searchResults, setSearchResults] = useState<GlobalSearchResultItem[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)

  const queryKind = searchParams.get('quickCreate') as QuickCreateKind | null
  const initialKind = queryKind ?? 'lead'

  useEffect(() => {
    if (queryKind) {
      const syncId = window.setTimeout(() => {
        setQuickOpen(true)
      }, 0)

      return () => window.clearTimeout(syncId)
    }
  }, [queryKind])

  useEffect(() => {
    const syncId = window.setTimeout(() => {
      setSearchOpen(false)
      setMobileSearchOpen(false)
      setCommandOpen(false)
      setSearchValue('')
      setSearchResults([])
      setSearchLoading(false)
    }, 0)

    return () => window.clearTimeout(syncId)
  }, [pathname])

  useEffect(() => {
    const query = deferredSearchValue.trim()

    if (query.length < 2) {
      return
    }

    const controller = new AbortController()

    fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(t('topbar.searchRequestFailed'))
        }

        const payload = (await response.json()) as {
          results?: GlobalSearchResultItem[]
        }

        setSearchResults(payload.results ?? [])
      })
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        setSearchResults([])
      })
      .finally(() => {
        setSearchLoading(false)
      })

    return () => controller.abort()
  }, [deferredSearchValue, t])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'k' || (!event.metaKey && !event.ctrlKey)) {
        return
      }

      event.preventDefault()
      startTransition(() => {
        setCommandOpen((current) => !current)
        setSearchOpen(false)
        setMobileSearchOpen(false)
      })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function buildQuickCreateUrl(kind: QuickCreateKind | null) {
    const nextParams = new URLSearchParams(searchParams.toString())

    if (kind) {
      nextParams.set('quickCreate', kind)
    } else {
      nextParams.delete('quickCreate')
    }

    const nextQuery = nextParams.toString()
    return nextQuery ? `${pathname}?${nextQuery}` : pathname
  }

  function closeQuickCreate(nextOpen: boolean) {
    setQuickOpen(nextOpen)
    if (!nextOpen) {
      window.history.replaceState(window.history.state, '', buildQuickCreateUrl(null))
    }
  }

  function openQuickCreate(kind: (typeof quickCreateItems)[number]['kind']) {
    window.history.pushState(window.history.state, '', buildQuickCreateUrl(kind))
    setQuickOpen(true)
  }

  function closeSearchSurfaces() {
    setSearchOpen(false)
    setMobileSearchOpen(false)
    setCommandOpen(false)
  }

  function toggleLocale() {
    const nextLocale = locale === 'tr' ? 'en' : 'tr'
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }

  function updateSearchValue(value: string) {
    setSearchValue(value)
    const hasQuery = value.trim().length >= 2
    setSearchLoading(hasQuery)

    if (!hasQuery) {
      setSearchResults([])
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
      <div className="flex h-16 shrink-0 items-center gap-2 px-4 md:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-1 h-6 max-md:hidden" />

        <div className="relative hidden w-full max-w-md md:block">
          <SearchInput
            value={searchValue}
            onChange={(value) => {
              updateSearchValue(value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder={t('topbar.searchPlaceholder')}
            inputClassName="h-9 rounded-lg"
          />
          <SearchResultsPanel
            query={searchValue}
            loading={searchLoading}
            open={searchOpen}
            results={searchResults}
            onSelect={closeSearchSurfaces}
            className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40"
          />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg md:hidden"
            aria-label={mobileSearchOpen ? t('topbar.closeSearchAria') : t('topbar.openSearchAria')}
            onClick={() => {
              setMobileSearchOpen((current) => !current)
              setSearchOpen(false)
              setCommandOpen(false)
            }}
          >
            <Search />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg"
            aria-label={t('topbar.toggleThemeAria')}
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="hidden dark:block" />
            <Moon className="block dark:hidden" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg"
            aria-label={t('common.switchLanguage')}
            title={locale === 'tr' ? 'EN' : 'TR'}
            onClick={toggleLocale}
          >
            <Languages />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-lg"
                  aria-label={t('topbar.notifications')}
                >
                  <Bell />
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center justify-between">
                  {t('topbar.notifications')}
                  <Badge variant="info">{t('topbar.newNotifications', { count: 3 })}</Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notificationKeys.map((notification) => (
                  <DropdownMenuItem
                    key={notification.titleKey}
                    className="flex flex-col items-start gap-0.5 py-2"
                  >
                    <span className="text-sm font-medium">{t(notification.titleKey)}</span>
                    <span className="text-xs text-muted-foreground">
                      {t(notification.descriptionKey)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {t('topbar.timeAgo', { time: t(notification.timeKey) })}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button className="rounded-lg max-sm:size-9 max-sm:p-0">
                  <Plus data-icon="inline-start" />
                  <span className="max-sm:hidden">{t('quickCreate.title')}</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{t('topbar.newRecord')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {quickCreateItems.map((item) => (
                  <DropdownMenuItem key={item.kind} onClick={() => openQuickCreate(item.kind)}>
                    <item.icon />
                    {t(item.labelKey)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="mx-1 h-6 max-sm:hidden" />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" className="h-9 gap-2 rounded-lg px-1.5 sm:pr-2.5">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-primary/12 text-xs font-semibold text-primary">
                      {currentUser.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium max-sm:hidden">{currentUser.name}</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex flex-col">
                  <span>{currentUser.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {currentUser.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/ayarlar')}>
                  <User />
                  {t('topbar.profile')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/ayarlar')}>
                  <Settings />
                  {t('nav.ayarlar')}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => logoutAction()}>
                <LogOut />
                {t('topbar.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {mobileSearchOpen ? (
        <div className="border-t px-4 pb-4 pt-3 md:hidden">
          <div className="relative">
            <SearchInput
              value={searchValue}
              onChange={(value) => {
                updateSearchValue(value)
                setMobileSearchOpen(true)
              }}
              onFocus={() => setMobileSearchOpen(true)}
              autoFocus
              placeholder={t('topbar.mobileSearchPlaceholder')}
              inputClassName="h-9 rounded-lg"
            />
            <SearchResultsPanel
              query={searchValue}
              loading={searchLoading}
              open={mobileSearchOpen}
              results={searchResults}
              onSelect={closeSearchSurfaces}
              className="mt-2"
            />
          </div>
        </div>
      ) : null}

      <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogContent className="max-w-2xl gap-3 p-0" showCloseButton={false}>
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle>{t('topbar.quickSearchTitle')}</DialogTitle>
            <DialogDescription>{t('topbar.quickSearchDescription')}</DialogDescription>
          </DialogHeader>
          <div className="px-4 pt-1">
            <SearchInput
              value={searchValue}
              onChange={updateSearchValue}
              onFocus={() => setCommandOpen(true)}
              autoFocus
              placeholder={t('topbar.commandPlaceholder')}
              ariaLabel={t('topbar.commandAria')}
              inputClassName="h-11 rounded-xl"
            />
          </div>
          <div className="px-4 pb-4">
            <SearchResultsPanel
              query={searchValue}
              loading={searchLoading}
              open
              results={searchResults}
              onSelect={closeSearchSurfaces}
              className="max-h-[50vh] overflow-y-auto rounded-xl border"
            />
          </div>
        </DialogContent>
      </Dialog>

      <QuickCreateDialog
        key={`${initialKind}-${quickOpen ? 'open' : 'closed'}`}
        open={quickOpen}
        onOpenChange={closeQuickCreate}
        initialKind={initialKind}
        options={quickCreateOptions}
      />
    </header>
  )
}
