'use client'

import Link from 'next/link'
import { useDeferredValue, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Bell,
  CheckSquare,
  FileText,
  Handshake,
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
import { QuickCreateDialog } from '@/components/layout/quick-create-dialog'
import { SearchInput } from '@/components/shared/search-input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

const notifications = [
  {
    title: 'Yeni lead atandi',
    description: 'Takip bekleyen kayitlar guncellendi',
    time: '5 dk',
  },
  {
    title: 'Pipeline hareketi islendi',
    description: 'Asama degisiklikleri veritabanina kaydedildi',
    time: '1 saat',
  },
  {
    title: 'Gorev teslim tarihi yaklasiyor',
    description: 'Bugun kapanacak gorevler takvimde gorunuyor',
    time: '3 saat',
  },
] as const

const quickCreateItems = [
  { label: 'Yeni Kisi', icon: UserPlus, kind: 'contact' },
  { label: 'Yeni Anlasma', icon: Handshake, kind: 'deal' },
  { label: 'Yeni Gorev', icon: CheckSquare, kind: 'task' },
  { label: 'Yeni Firma', icon: FileText, kind: 'company' },
] as const

const searchKindLabels: Record<GlobalSearchResultItem['kind'], string> = {
  company: 'Firma',
  contact: 'Musteri',
  lead: 'Lead',
  deal: 'Deal',
  task: 'Gorev',
}

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
  if (!open) {
    return null
  }

  return (
    <div
      className={`rounded-xl border bg-background p-2 shadow-xl ${className ?? ''}`}
      role="listbox"
      aria-label="Arama sonuclari"
    >
      {query.trim().length < 2 ? (
        <div className="px-3 py-2 text-sm text-muted-foreground">
          Arama icin en az 2 karakter girin.
        </div>
      ) : null}

      {query.trim().length >= 2 && loading ? (
        <div className="px-3 py-2 text-sm text-muted-foreground">Araniyor...</div>
      ) : null}

      {query.trim().length >= 2 && !loading && results.length === 0 ? (
        <div className="px-3 py-2 text-sm text-muted-foreground">
          Eslesen kayit bulunamadi.
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
            {searchKindLabels[result.kind]}
          </Badge>
        </Link>
      ))}
    </div>
  )
}

export function Topbar({ currentUser, quickCreateOptions }: TopbarProps) {
  const { resolvedTheme, setTheme } = useTheme()
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
          throw new Error('Arama istegi basarisiz oldu')
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
  }, [deferredSearchValue])

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
              setSearchValue(value)
              setSearchOpen(true)
              if (value.trim().length < 2) {
                setSearchLoading(false)
                setSearchResults([])
              } else {
                setSearchLoading(true)
              }
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Musteri, anlasma veya lead ara..."
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
            aria-label={mobileSearchOpen ? 'Aramayi kapat' : 'Aramayi ac'}
            onClick={() => {
              setMobileSearchOpen((current) => !current)
              setSearchOpen(false)
            }}
          >
            <Search />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg"
            aria-label="Temayi degistir"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="hidden dark:block" />
            <Moon className="block dark:hidden" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="relative rounded-lg" aria-label="Bildirimler">
                  <Bell />
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center justify-between">
                  Bildirimler
                  <Badge variant="info">3 yeni</Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.title}
                    className="flex flex-col items-start gap-0.5 py-2"
                  >
                    <span className="text-sm font-medium">{notification.title}</span>
                    <span className="text-xs text-muted-foreground">{notification.description}</span>
                    <span className="text-[11px] text-muted-foreground">{notification.time} once</span>
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
                  <span className="max-sm:hidden">Hizli Olustur</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Yeni kayit</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {quickCreateItems.map((item) => (
                  <DropdownMenuItem key={item.label} onClick={() => openQuickCreate(item.kind)}>
                    <item.icon />
                    {item.label}
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
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/ayarlar')}>
                  <Settings />
                  Ayarlar
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => logoutAction()}>
                <LogOut />
                Cikis Yap
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
                setSearchValue(value)
                setMobileSearchOpen(true)
                if (value.trim().length < 2) {
                  setSearchLoading(false)
                  setSearchResults([])
                } else {
                  setSearchLoading(true)
                }
              }}
              onFocus={() => setMobileSearchOpen(true)}
              autoFocus
              placeholder="CRM icinde ara..."
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
