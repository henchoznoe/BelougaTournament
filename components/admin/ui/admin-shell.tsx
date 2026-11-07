/**
 * File: components/admin/ui/admin-shell.tsx
 * Description: Root shell for the admin panel, orchestrating sidebar, topbar, and content area.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/ui/admin-sidebar'
import { AdminTopbar } from '@/components/admin/ui/admin-topbar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DEFAULT_ASSETS } from '@/lib/config/constants'
import type { AuthSession } from '@/lib/types/auth'

interface AdminShellProps {
  logoUrl: string | null
  sessionUser: AuthSession['user'] | null
  children: React.ReactNode
}

export const AdminShell = ({
  logoUrl,
  sessionUser,
  children,
}: AdminShellProps) => {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)

  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    try {
      setCollapsed(
        localStorage.getItem('belouga:admin-menu-collapsed') === 'true',
      )
    } catch {
      /* Storage may be unavailable. */
    }
  }, [])
  const toggleSidebar = () =>
    setCollapsed(previous => {
      const next = !previous
      try {
        localStorage.setItem('belouga:admin-menu-collapsed', String(next))
      } catch {
        /* Keep the in-memory preference. */
      }
      return next
    })

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className="flex h-dvh min-w-0 bg-zinc-950"
        style={{
          backgroundImage: `url(${DEFAULT_ASSETS.BG_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-zinc-950/90" />
        <a
          href="#admin-main"
          className="sr-only fixed left-4 top-4 z-50 rounded-xl bg-brand p-3 text-white focus:not-sr-only"
        >
          Aller au contenu principal
        </a>
        {/* Desktop sidebar (always collapsed) */}
        <div className="hidden md:flex">
          <AdminSidebar
            variant="desktop"
            logoUrl={logoUrl}
            collapsed={collapsed}
            onToggle={toggleSidebar}
          />
        </div>

        {/* Mobile sidebar (Sheet) */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            showCloseButton={true}
            className="w-60 border-r border-white/5 bg-zinc-950 p-0"
          >
            <VisuallyHidden>
              <SheetTitle>Menu administration</SheetTitle>
            </VisuallyHidden>
            <AdminSidebar
              variant="mobile"
              onNavigate={() => setMobileOpen(false)}
              logoUrl={logoUrl}
            />
          </SheetContent>
        </Sheet>

        {/* Main area (topbar + content) */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminTopbar
            onMobileMenuToggle={() => setMobileOpen(true)}
            sessionUser={sessionUser}
          />
          <main
            id="admin-main"
            tabIndex={-1}
            className="relative min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6"
          >
            <div className="relative">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
