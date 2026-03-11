/**
 * File: app/admin/sponsors/page.tsx
 * Description: Admin page for managing sponsors (SUPERADMIN only).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Handshake } from 'lucide-react'
import type { Metadata } from 'next'
import { SponsorsList } from '@/components/features/admin/sponsors-list'
import SuperAdminGuard from '@/components/features/auth/super-admin-guard'
import { getSponsors } from '@/lib/services/sponsors'

export const metadata: Metadata = {
  title: 'Sponsors',
}

const AdminSponsorsPage = async () => {
  const sponsors = await getSponsors()

  return (
    <SuperAdminGuard>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Page heading */}
        <div className="space-y-1">
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
            <Handshake className="size-6 text-blue-400" />
            Sponsors
          </h1>
          <p className="text-sm text-zinc-400">
            Gérez les sponsors affichés sur la plateforme.
          </p>
        </div>

        <SponsorsList sponsors={sponsors} />
      </div>
    </SuperAdminGuard>
  )
}

export default AdminSponsorsPage
