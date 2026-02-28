/**
 * File: app/admin/page.tsx
 * Description: Admin dashboard page with overview stats.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { LayoutDashboard } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
}

const AdminDashboardPage = () => {
  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
          <LayoutDashboard className="size-6 text-blue-400" />
          Dashboard
        </h1>
        <p className="text-sm text-zinc-400">
          Vue d'ensemble de la plateforme Belouga Tournament.
        </p>
      </div>

      {/* Placeholder stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Tournois actifs', value: '—' },
          { label: 'Joueurs inscrits', value: '—' },
          { label: 'Inscriptions en attente', value: '—' },
          { label: 'Admins', value: '—' },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/5 bg-white/2 p-5 backdrop-blur-sm"
          >
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Placeholder content */}
      <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
        <p className="text-sm text-zinc-400">
          Les statistiques détaillées et l'activité récente seront disponibles
          prochainement.
        </p>
      </div>
    </div>
  )
}

export default AdminDashboardPage
