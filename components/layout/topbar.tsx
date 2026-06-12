'use client'

import { useState } from 'react'
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

const notifications = [
  {
    title: 'Yeni lead atandı',
    description: 'Erdoğan İnşaat size atandı',
    time: '5 dk',
  },
  {
    title: 'Teklif kabul edildi',
    description: 'Yıldız Emlak teklifi onayladı',
    time: '1 saat',
  },
  {
    title: 'Fatura gecikti',
    description: 'FT-2026-115 vadesi geçti',
    time: '3 saat',
  },
] as const

const quickCreateItems = [
  { label: 'Yeni Lead', icon: UserPlus },
  { label: 'Yeni Anlaşma', icon: Handshake },
  { label: 'Yeni Görev', icon: CheckSquare },
  { label: 'Yeni Teklif', icon: FileText },
] as const

export function Topbar() {
  const { resolvedTheme, setTheme } = useTheme()
  const [quickOpen, setQuickOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-6 max-md:hidden" />

      <SearchInput
        value=""
        onChange={() => undefined}
        placeholder="Müşteri, anlaşma veya teklif ara..."
        className="max-w-md max-md:hidden"
        inputClassName="h-9 rounded-lg"
      />

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg md:hidden"
          aria-label="Ara"
        >
          <Search />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg"
          aria-label="Temayı değiştir"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="hidden dark:block" />
          <Moon className="block dark:hidden" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-lg"
                aria-label="Bildirimler"
              >
                <Bell />
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Bildirimler
              <Badge variant="info">3 yeni</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.title}
                  className="flex flex-col items-start gap-0.5 py-2"
                >
                  <span className="text-sm font-medium">
                    {notification.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {notification.description}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {notification.time} önce
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
                <span className="max-sm:hidden">Hızlı Oluştur</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Yeni kayıt</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {quickCreateItems.map((item) => (
                <DropdownMenuItem
                  key={item.label}
                  onClick={() => setQuickOpen(true)}
                >
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
              <Button
                variant="ghost"
                className="h-9 gap-2 rounded-lg px-1.5 sm:pr-2.5"
              >
                <Avatar className="size-7">
                  <AvatarFallback className="bg-primary/12 text-xs font-semibold text-primary">
                    MŞ
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium max-sm:hidden">
                  Mert Şahin
                </span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span>Mert Şahin</span>
              <span className="text-xs font-normal text-muted-foreground">
                mert@adakan.com
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings />
                Ayarlar
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOut />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <QuickCreateDialog open={quickOpen} onOpenChange={setQuickOpen} />
    </header>
  )
}
