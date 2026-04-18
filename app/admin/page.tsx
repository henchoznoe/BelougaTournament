/**
 * File: app/admin/page.tsx
 * Description: Admin dashboard page with overview stats.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { LayoutDashboard } from 'lucide-react'
import type { Metadata } from 'next'
import { AdminContentLayout } from '@/components/features/admin/admin-content-layout'
import {
  DashboardRecentLogins,
  DashboardRecentRegistrations,
} from '@/components/features/admin/dashboard-recent'
import { DashboardStatsCards } from '@/components/features/admin/dashboard-stats'
import {
  getDashboardStats,
  getRecentLogins,
  getRecentRegistrations,
} from '@/lib/services/dashboard'

export const metadata: Metadata = {
  title: 'Dashboard',
}

const AdminDashboardPage = async () => {
  const [stats, recentLogins, recentRegistrations] = await Promise.all([
    getDashboardStats(),
    getRecentLogins(),
    getRecentRegistrations(),
  ])

  return (
    <AdminContentLayout
      segments={[{ label: 'Dashboard' }]}
      icon={LayoutDashboard}
      title="Dashboard"
      subtitle="Vue d'ensemble de la plateforme Belouga Tournament."
    >
      {/* Stats cards */}
      <DashboardStatsCards stats={stats} />

      {/* Two-column panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardRecentLogins logins={recentLogins} />
        <DashboardRecentRegistrations registrations={recentRegistrations} />
      </div>
    </AdminContentLayout>
  )
}

export default AdminDashboardPage
