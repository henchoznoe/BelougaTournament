/**
 * File: components/admin/ui/admin-shell.tsx
 * Description: Root shell for the admin panel, orchestrating sidebar, topbar, and content area.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useState } from 'react'
import { AdminSidebar } from '@/components/admin/ui/admin-sidebar'
import { AdminTopbar } from '@/components/admin/ui/admin-topbar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DEFAULT_ASSETS } from '@/lib/config/constants'

interface AdminShellProps {
  logoUrl: string | null
  children: React.ReactNode
}

export const AdminShell = ({ logoUrl, children }: AdminShellProps) => {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)

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
        {/* Desktop sidebar (always collapsed) */}
        <div className="hidden md:flex">
          <AdminSidebar variant="desktop" logoUrl={logoUrl} />
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
              variant="mobile"
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
