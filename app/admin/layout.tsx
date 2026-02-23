/**
 * File: app/(admin)/layout.tsx
 * Description: Layout for admin routes, protected by AdminGuard.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import AdminGuard from '@/components/features/auth/admin-guard'

interface AdminLayoutProps {
  children: React.ReactNode
}

/** Wraps all admin routes with authentication and role-based access control. */
const AdminLayout = ({ children }: Readonly<AdminLayoutProps>) => {
  return (
    <AdminGuard>
      <div className="min-h-dvh">
        <main>{children}</main>
      </div>
    </AdminGuard>
  )
}

export default AdminLayout
