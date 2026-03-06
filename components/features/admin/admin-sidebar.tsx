/**
 * File: components/features/admin/admin-sidebar.tsx
 * Description: Collapsible sidebar navigation for the admin panel.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ADMIN_NAV } from '@/lib/config/admin-nav'
import { DEFAULT_ASSETS } from '@/lib/config/constants'
import { ROUTES } from '@/lib/config/routes'
import { authClient } from '@/lib/core/auth-client'
import { cn } from '@/lib/utils/cn'
import { Role } from '@/prisma/generated/prisma/enums'

interface AdminSidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobile?: boolean
  onNavigate?: () => void
}

export const AdminSidebar = ({
  collapsed,
  onToggle,
  mobile = false,
  onNavigate,
}: AdminSidebarProps) => {
  const { data: session } = authClient.useSession()
  const pathname = usePathname()
  const userRole = session?.user?.role

  const isLinkActive = (href: string): boolean =>
    href === ROUTES.ADMIN_DASHBOARD
      ? pathname === ROUTES.ADMIN_DASHBOARD
      : pathname.startsWith(href)

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-white/5 bg-zinc-950/80 backdrop-blur-xl transition-all duration-300',
        mobile ? 'w-full' : collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo area */}
      <div className="flex h-16 items-center border-b border-white/5 px-4">
        <Link
          href={ROUTES.ADMIN_DASHBOARD}
          className="flex items-center gap-3 overflow-hidden"
          onClick={onNavigate}
        >
          <Image
            src={DEFAULT_ASSETS.LOGO}
            alt="Belouga"
            width={28}
            height={28}
            className="shrink-0"
          />
          {(!collapsed || mobile) && (
            <span className="whitespace-nowrap font-paladins text-sm tracking-wider text-white">
              Admin
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Navigation admin"
        className="flex-1 space-y-1 overflow-y-auto px-2 py-4"
      >
        {ADMIN_NAV.map(group => {
          // Filter items by role
          const visibleItems = group.items.filter(
            item => !item.superAdminOnly || userRole === Role.SUPERADMIN,
          )

          if (visibleItems.length === 0) return null

          const groupKey = group.label ?? group.items[0]?.href ?? 'default'

          return (
            <div key={groupKey} className="space-y-1">
              {/* Group separator + label */}
              {group.label && (
                <div className="px-2 py-3">
                  <div className="h-px bg-white/5" />
                  {(!collapsed || mobile) && (
                    <p className="mt-3 px-1 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                      {group.label}
                    </p>
                  )}
                </div>
              )}

              {/* Nav items */}
              {visibleItems.map(item => {
                const isActive = isLinkActive(item.href)
                const linkContent = (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'border border-blue-500/20 bg-blue-500/10 text-white shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                        : 'border border-transparent text-zinc-400 hover:bg-white/5 hover:text-white',
                      collapsed && !mobile && 'justify-center px-0',
                    )}
                  >
                    <item.icon
                      className={cn(
                        'size-5 shrink-0 transition-colors duration-200',
                        isActive
                          ? 'text-blue-400'
                          : 'text-zinc-500 group-hover:text-blue-300',
                      )}
                    />
                    {(!collapsed || mobile) && <span>{item.label}</span>}
                  </Link>
                )

                // Wrap with tooltip when collapsed on desktop
                if (collapsed && !mobile) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return <div key={item.href}>{linkContent}</div>
              })}
            </div>
          )
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {!mobile && (
        <div className="border-t border-white/5 p-2">
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Étendre le menu' : 'Réduire le menu'}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-all duration-200 hover:bg-white/5 hover:text-white',
              collapsed && 'justify-center px-0',
            )}
          >
            {collapsed ? (
              <ChevronsRight className="size-5 shrink-0" />
            ) : (
              <>
                <ChevronsLeft className="size-5 shrink-0" />
                <span>Réduire</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  )
}
