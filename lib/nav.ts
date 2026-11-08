import {
  BarChart3,
  Building2,
  CalendarDays,
  CheckSquare,
  FileText,
  Handshake,
  KanbanSquare,
  LayoutDashboard,
  Settings,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { TranslationKey } from '@/lib/i18n'

export type NavItem = {
  title: TranslationKey
  href: string
  icon: LucideIcon
  badge?: string
}

export const navItems: NavItem[] = [
  { title: 'nav.dashboard', href: '/', icon: LayoutDashboard },
  { title: 'nav.leads', href: '/leads', icon: UserPlus },
  { title: 'nav.musteriler', href: '/musteriler', icon: Users },
  { title: 'nav.firmalar', href: '/firmalar', icon: Building2 },
  { title: 'nav.anlasmalar', href: '/anlasmalar', icon: Handshake },
  { title: 'nav.pipeline', href: '/pipeline', icon: KanbanSquare },
  { title: 'nav.gorevler', href: '/gorevler', icon: CheckSquare },
  { title: 'nav.takvim', href: '/takvim', icon: CalendarDays },
  { title: 'nav.teklifler', href: '/teklifler', icon: FileText },
  { title: 'nav.raporlar', href: '/raporlar', icon: BarChart3 },
  { title: 'nav.ayarlar', href: '/ayarlar', icon: Settings },
]
