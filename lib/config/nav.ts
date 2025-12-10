import {
  Home,
  LayoutDashboard,
  Mail,
  Settings,
  Trophy,
  Users,
  Video,
} from 'lucide-react'
import { APP_ROUTES } from '@/lib/config/routes'
import { fr } from '@/lib/i18n/dictionaries/fr'

export const PUBLIC_NAV_LINKS = [
  { href: APP_ROUTES.HOME, label: fr.layout.navbar.links.home, icon: Home },
  {
    href: APP_ROUTES.TOURNAMENTS,
    label: fr.layout.navbar.links.tournaments,
    icon: Trophy,
  },
  {
    href: APP_ROUTES.STREAM,
    label: fr.layout.navbar.links.stream,
    icon: Video,
  },
  {
    href: APP_ROUTES.CONTACT,
    label: fr.layout.navbar.links.contact,
    icon: Mail,
  },
] as const

export const ADMIN_NAV_LINKS = [
  {
    label: fr.layout.sidebar.links.dashboard,
    href: APP_ROUTES.ADMIN_DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    label: fr.layout.sidebar.links.tournaments,
    href: APP_ROUTES.ADMIN_TOURNAMENTS,
    icon: Trophy,
  },
  {
    label: fr.layout.sidebar.links.admins,
    href: APP_ROUTES.ADMIN_ADMINS,
    icon: Users,
  },
  {
    label: fr.layout.sidebar.links.settings,
    href: APP_ROUTES.ADMIN_SETTINGS,
    icon: Settings,
  },
] as const
