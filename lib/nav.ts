import {
  Building2,
  CalendarDays,
  CheckSquare,
  Handshake,
  KanbanSquare,
  LayoutDashboard,
  FileText,
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
  { title: 'Leads', href: '/leads', icon: UserPlus, badge: '12' },
  { title: 'Müşteriler', href: '/musteriler', icon: Users },
  { title: 'Firmalar', href: '/firmalar', icon: Building2 },
  { title: 'Anlaşmalar', href: '/anlasmalar', icon: Handshake },
  { title: 'Pipeline', href: '/pipeline', icon: KanbanSquare },
  { title: 'Görevler', href: '/gorevler', icon: CheckSquare, badge: '5' },
  { title: 'Takvim', href: '/takvim', icon: CalendarDays },
  { title: 'Teklifler', href: '/teklifler', icon: FileText },
]
