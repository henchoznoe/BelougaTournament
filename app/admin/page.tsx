/**
 * File: app/admin/page.tsx
 * Description: Admin dashboard page with overview stats.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { LayoutDashboard } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AdminBreadcrumb } from '@/components/features/admin/admin-breadcrumb'
import {
  DashboardRecentRegistrations,
  DashboardRecentSponsors,
  DashboardRecentUsers,
  DashboardUpcomingTournaments,
} from '@/components/features/admin/dashboard-recent'
import { DashboardStatsCards } from '@/components/features/admin/dashboard-stats'
import { ROUTES } from '@/lib/config/routes'
import { getSession } from '@/lib/services/auth'
import {
  getDashboardStats,
  getRecentRegistrations,
  getRecentSponsors,
  getRecentUsers,
  getUpcomingTournaments,
} from '@/lib/services/dashboard'

export const metadata: Metadata = {
  title: 'Dashboard',
}

const AdminDashboardPage = async () => {
  const session = await getSession()

  if (!session?.user) {
    redirect(ROUTES.LOGIN)
  }

  const [
    stats,
    upcomingTournaments,
    recentRegistrations,
    recentUsers,
    recentSponsors,
  ] = await Promise.all([
    getDashboardStats(),
    getUpcomingTournaments(),
    getRecentRegistrations(),
    getRecentUsers(),
    getRecentSponsors(),
  ])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Breadcrumb */}
      <AdminBreadcrumb segments={[{ label: 'Dashboard' }]} />

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

      {/* Stats cards */}
      <DashboardStatsCards stats={stats} />

      {/* Two-column panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardUpcomingTournaments tournaments={upcomingTournaments} />
        <DashboardRecentRegistrations registrations={recentRegistrations} />
        <DashboardRecentUsers users={recentUsers} />
        <DashboardRecentSponsors sponsors={recentSponsors} />
      </div>
    </div>
  )
}

export default AdminDashboardPage
