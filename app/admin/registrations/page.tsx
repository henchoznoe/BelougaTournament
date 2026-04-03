/**
 * File: app/admin/registrations/page.tsx
 * Description: Admin page displaying all tournament registrations globally.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ClipboardList } from 'lucide-react'
import type { Metadata } from 'next'
import { AdminBreadcrumb } from '@/components/features/admin/admin-breadcrumb'
import { RegistrationsList } from '@/components/features/admin/registrations-list'
import { getAllRegistrations } from '@/lib/services/registrations'

export const metadata: Metadata = {
  title: 'Inscriptions',
}

const AdminRegistrationsPage = async () => {
  const registrations = await getAllRegistrations()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Breadcrumb */}
      <AdminBreadcrumb segments={[{ label: 'Inscriptions' }]} />

      {/* Page heading */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
          <ClipboardList className="size-6 text-blue-400" />
          Inscriptions
        </h1>
        <p className="text-sm text-zinc-400">
          Vue globale de toutes les inscriptions aux tournois.
        </p>
      </div>

      <RegistrationsList registrations={registrations} />
    </div>
  )
}

export default AdminRegistrationsPage
