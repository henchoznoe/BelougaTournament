/**
 * File: components/features/admin/admin-shell.tsx
 * Description: Root shell for the admin panel, orchestrating sidebar, topbar, and content area.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/features/admin/admin-sidebar'
import { AdminTopbar } from '@/components/features/admin/admin-topbar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DEFAULT_ASSETS } from '@/lib/config/constants'

interface AdminShellProps {
  logoUrl: string | null
  children: React.ReactNode
}

export const AdminShell = ({ logoUrl, children }: AdminShellProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(true)
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)

  // Restore persisted sidebar preference; default is collapsed (true).
  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin-sidebar-collapsed')
      if (stored !== null) setCollapsed(stored === 'true')
    } catch {
      // localStorage unavailable in restricted environments (e.g. incognito/iframe)
    }
  }, [])

  const handleToggle = () => {
    setCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem('admin-sidebar-collapsed', String(next))
      } catch {
        // localStorage unavailable in restricted environments
      }
      return next
    })
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className="flex h-dvh bg-zinc-950"
        style={{
          backgroundImage: `url(${DEFAULT_ASSETS.BG_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-zinc-950/90" />
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <AdminSidebar
            collapsed={collapsed}
            onToggle={handleToggle}
            logoUrl={logoUrl}
          />
        </div>

        {/* Mobile sidebar (Sheet) */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="w-60 border-r border-white/5 bg-zinc-950 p-0"
          >
            <VisuallyHidden>
              <SheetTitle>Menu administration</SheetTitle>
            </VisuallyHidden>
            <AdminSidebar
              collapsed={false}
              onToggle={() => {}}
              mobile
              onNavigate={() => setMobileOpen(false)}
              logoUrl={logoUrl}
            />
          </SheetContent>
        </Sheet>

        {/* Main area (topbar + content) */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminTopbar onMobileMenuToggle={() => setMobileOpen(true)} />
          <main className="relative flex-1 overflow-y-auto p-4 md:p-6">
            <div className="relative">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
