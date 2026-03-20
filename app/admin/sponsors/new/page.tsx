/**
 * File: app/admin/sponsors/new/page.tsx
 * Description: Admin page for creating a new sponsor.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import { AdminBreadcrumb } from '@/components/features/admin/admin-breadcrumb'
import { SponsorForm } from '@/components/features/admin/sponsor-form'
import SuperAdminGuard from '@/components/features/auth/super-admin-guard'
import { ROUTES } from '@/lib/config/routes'

export const metadata: Metadata = {
  title: 'Nouveau sponsor',
}

const AdminNewSponsorPage = async () => {
  return (
    <SuperAdminGuard>
      <div className="mx-auto max-w-5xl space-y-6">
        <AdminBreadcrumb
          segments={[
            { label: 'Sponsors', href: ROUTES.ADMIN_SPONSORS },
            { label: 'Nouveau sponsor' },
          ]}
        />

        {/* Page heading */}
        <div className="space-y-1">
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
            <Plus className="size-6 text-blue-400" />
            Nouveau sponsor
          </h1>
          <p className="text-sm text-zinc-400">
            Créez un nouveau sponsor sur la plateforme.
          </p>
        </div>

        <SponsorForm />
      </div>
    </SuperAdminGuard>
  )
}

export default AdminNewSponsorPage
