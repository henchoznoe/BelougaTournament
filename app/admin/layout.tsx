/**
 * File: app/admin/layout.tsx
 * Description: Layout for admin routes, protected by AdminGuard with sidebar shell.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Suspense } from 'react'
import { AdminShell } from '@/components/features/admin/admin-shell'
import { AdminShellSkeleton } from '@/components/features/admin/admin-shell-skeleton'
import AdminGuard from '@/components/features/auth/admin-guard'
import { getGlobalSettings } from '@/lib/services/settings'

interface AdminLayoutProps {
  children: React.ReactNode
}

/** Wraps all admin routes with authentication, role-based access control, and admin shell. */
const AdminLayout = async ({ children }: Readonly<AdminLayoutProps>) => {
  const globalSettings = await getGlobalSettings()

  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <AdminGuard>
        <AdminShell logoUrl={globalSettings.logoUrl}>{children}</AdminShell>
      </AdminGuard>
    </Suspense>
  )
}

export default AdminLayout
