/**
 * File: lib/config/admin-nav.ts
 * Description: Navigation configuration for the admin sidebar.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { LucideIcon } from 'lucide-react'
import {
  ClipboardList,
  Handshake,
  LayoutDashboard,
  Settings,
  Trophy,
  Users,
} from 'lucide-react'
import { ADMIN_ROUTE_ROLES, ROUTES } from '@/lib/config/routes'
import { Role } from '@/prisma/generated/prisma/enums'

/** Returns true if the route requires SUPERADMIN based on ADMIN_ROUTE_ROLES. */
const isSuperAdminRoute = (href: string): boolean =>
  ADMIN_ROUTE_ROLES[href as keyof typeof ADMIN_ROUTE_ROLES] === Role.SUPERADMIN

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
        label: 'Utilisateurs',
        href: ROUTES.ADMIN_USERS,
        icon: Users,
      },
      {
        label: 'Inscriptions',
        href: ROUTES.ADMIN_REGISTRATIONS,
        icon: ClipboardList,
      },
      {
        label: 'Tournois',
        href: ROUTES.ADMIN_TOURNAMENTS,
        icon: Trophy,
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
        superAdminOnly: isSuperAdminRoute(ROUTES.ADMIN_SETTINGS),
      },
      {
        label: 'Sponsors',
        href: ROUTES.ADMIN_SPONSORS,
        icon: Handshake,
        superAdminOnly: isSuperAdminRoute(ROUTES.ADMIN_SPONSORS),
      },
    ],
  },
] as const
