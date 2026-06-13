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

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
}

export const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Leads', href: '/leads', icon: UserPlus },
  { title: 'Musteriler', href: '/musteriler', icon: Users },
  { title: 'Firmalar', href: '/firmalar', icon: Building2 },
  { title: 'Anlasmalar', href: '/anlasmalar', icon: Handshake },
  { title: 'Pipeline', href: '/pipeline', icon: KanbanSquare },
  { title: 'Gorevler', href: '/gorevler', icon: CheckSquare },
  { title: 'Takvim', href: '/takvim', icon: CalendarDays },
  { title: 'Teklifler', href: '/teklifler', icon: FileText },
  { title: 'Raporlar', href: '/raporlar', icon: BarChart3 },
  { title: 'Ayarlar', href: '/ayarlar', icon: Settings },
]
