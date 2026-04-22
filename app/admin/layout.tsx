/**
 * File: app/admin/layout.tsx
 * Description: Layout for admin routes, protected by AdminGuard with sidebar shell.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Suspense } from 'react'
import { AdminShell } from '@/components/admin/ui/admin-shell'
import { AdminShellSkeleton } from '@/components/admin/ui/admin-shell-skeleton'
import { AdminGuard } from '@/components/public/auth/admin-guard'
import { getGlobalSettings } from '@/lib/services/settings'

interface AdminLayoutProps {
  children: React.ReactNode
}

const AdminShellContent = async ({ children }: Readonly<AdminLayoutProps>) => {
  const globalSettings = await getGlobalSettings()

  return <AdminShell logoUrl={globalSettings.logoUrl}>{children}</AdminShell>
}

/** Wraps all admin routes with authentication, role-based access control, and admin shell. */
const AdminLayout = async ({ children }: Readonly<AdminLayoutProps>) => {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <AdminGuard>
        <AdminShellContent>{children}</AdminShellContent>
      </AdminGuard>
    </Suspense>
  )
}

export default AdminLayout
