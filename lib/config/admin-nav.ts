/**
 * File: lib/config/admin-nav.ts
 * Description: Navigation configuration for the admin sidebar.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { LucideIcon } from 'lucide-react'
import {
  Handshake,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react'
import { ROUTES } from '@/lib/config/routes'

interface AdminNavItem {
  label: string
  href: string
  icon: LucideIcon
  superAdminOnly?: boolean
}

interface AdminNavGroup {
  label?: string
  items: AdminNavItem[]
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    items: [
      {
        label: 'Dashboard',
        href: ROUTES.ADMIN_DASHBOARD,
        icon: LayoutDashboard,
      },
      {
        label: 'Tournois',
        href: ROUTES.ADMIN_TOURNAMENTS,
        icon: Trophy,
      },
      {
        label: 'Joueurs',
        href: ROUTES.ADMIN_PLAYERS,
        icon: Users,
      },
    ],
  },
  {
    label: 'Super Admin',
    items: [
      {
        label: 'Paramètres',
        href: ROUTES.ADMIN_SETTINGS,
        icon: Settings,
        superAdminOnly: true,
      },
      {
        label: 'Sponsors',
        href: ROUTES.ADMIN_SPONSORS,
        icon: Handshake,
        superAdminOnly: true,
      },
      {
        label: 'Admins',
        href: ROUTES.ADMIN_ADMINS,
        icon: ShieldCheck,
        superAdminOnly: true,
      },
    ],
  },
] as const
