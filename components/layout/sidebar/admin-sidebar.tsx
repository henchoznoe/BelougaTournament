/**
 * File: components/layout/sidebar/admin-sidebar.tsx
 * Description: Client-side sidebar navigation for the admin dashboard.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client"

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import {
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  Trophy,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { APP_ROUTES } from "@/lib/config/routes"

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

interface AdminSidebarProps {
  userEmail: string
  logoutAction: () => Promise<void>
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const CONTENT = {
  BRAND_NAME: "BELOUGA",
  MENU_LABEL: "Menu",
  CONNECTED_AS: "Connecté en tant que",
  LINKS: {
    DASHBOARD: "Tableau de bord",
    TOURNAMENTS: "Tournois",
    ADMINS: "Administrateurs",
    SETTINGS: "Paramètres",
  },
} as const

const MENU_ITEMS = [
  {
    label: CONTENT.LINKS.DASHBOARD,
    href: APP_ROUTES.ADMIN_DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    label: CONTENT.LINKS.TOURNAMENTS,
    href: APP_ROUTES.ADMIN_TOURNAMENTS,
    icon: Trophy,
  },
  {
    label: CONTENT.LINKS.ADMINS,
    href: APP_ROUTES.ADMIN_ADMINS,
    icon: Users,
  },
  {
    label: CONTENT.LINKS.SETTINGS,
    href: APP_ROUTES.ADMIN_SETTINGS,
    icon: Settings,
  },
] as const

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

export const AdminSidebar = ({
  userEmail,
  logoutAction,
}: AdminSidebarProps) => {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === APP_ROUTES.ADMIN_DASHBOARD) {
      return pathname === APP_ROUTES.ADMIN_DASHBOARD
    }
    return pathname.startsWith(path)
  }

  return (
    <aside className="sticky top-0 z-50 flex h-screen w-full flex-col border-r border-white/10 bg-zinc-900/50 backdrop-blur-xl p-6 md:w-72">
      <div className="mb-10 flex items-center gap-2">
        <span className="text-2xl font-black tracking-tighter text-white">
          {CONTENT.BRAND_NAME}
          <span className="text-blue-500">.</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        <p className="mb-2 px-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
          {CONTENT.MENU_LABEL}
        </p>
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
              isActive(item.href)
                ? "border-l-2 border-blue-500 bg-blue-600/10 text-blue-400"
                : "text-zinc-400 hover:border-blue-500 hover:bg-blue-600/10 hover:text-blue-400",
            )}
          >
            <item.icon className="mr-3 h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-6">
        <div className="mb-4 rounded-lg border border-white/5 bg-white/5 p-3 px-2">
          <p className="mb-1 text-xs font-medium text-zinc-500">
            {CONTENT.CONNECTED_AS}
          </p>
          <p
            className="truncate text-sm font-medium text-white"
            title={userEmail}
          >
            {userEmail}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full cursor-pointer justify-center border border-gray-500/20 bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 hover:text-gray-400"
          >
            <Link href="/">
              <Home className="h-3 w-3" />
            </Link>
          </Button>
          <form action={logoutAction}>
            <Button
              variant="destructive"
              size="sm"
              className="w-full cursor-pointer justify-center border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </aside>
  )
}
