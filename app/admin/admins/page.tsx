/**
 * File: app/admin/admins/page.tsx
 * Description: Admin page for managing administrators (SUPERADMIN only).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import { AdminsList } from '@/components/features/admin/admins-list'
import { getAdmins, getTournamentOptions } from '@/lib/services/admins'

export const metadata: Metadata = {
  title: 'Admins',
}

const AdminAdminsPage = async () => {
  const [admins, tournaments] = await Promise.all([
    getAdmins(),
    getTournamentOptions(),
  ])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page heading */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
          <ShieldCheck className="size-6 text-blue-400" />
          Administrateurs
        </h1>
        <p className="text-sm text-zinc-400">
          Gérez les administrateurs et leurs assignations de tournois.
        </p>
      </div>

      <AdminsList admins={admins} tournaments={tournaments} />
    </div>
  )
}

export default AdminAdminsPage
