/**
 * File: components/features/admin/admin-shell.tsx
 * Description: Root shell for the admin panel, orchestrating sidebar, topbar, and content area.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useState } from 'react'
import { AdminSidebar } from '@/components/features/admin/admin-sidebar'
import { AdminTopbar } from '@/components/features/admin/admin-topbar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { TooltipProvider } from '@/components/ui/tooltip'

interface AdminShellProps {
  children: React.ReactNode
}

export const AdminShell = ({ children }: AdminShellProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-dvh bg-zinc-950">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <AdminSidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed(prev => !prev)}
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
            />
          </SheetContent>
        </Sheet>

        {/* Main area (topbar + content) */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminTopbar onMobileMenuToggle={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
