/**
 * File: app/admin/page.tsx
 * Description: Admin dashboard page with overview stats.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { LayoutDashboard } from 'lucide-react'
import type { Metadata } from 'next'
import { DashboardPayments } from '@/components/admin/dashboard/dashboard-payments'
import {
  DashboardRecentLogins,
  DashboardRecentRegistrations,
} from '@/components/admin/dashboard/dashboard-recent'
import { DashboardStatsCards } from '@/components/admin/dashboard/dashboard-stats'
import { AdminContentLayout } from '@/components/admin/ui/admin-content-layout'
import {
  getDashboardPaymentStats,
  getDashboardStats,
  getRecentLogins,
  getRecentRegistrations,
} from '@/lib/services/dashboard'

export const metadata: Metadata = {
  title: 'Dashboard',
}

const AdminDashboardPage = async () => {
  const [stats, recentLogins, recentRegistrations, paymentStats] =
    await Promise.all([
      getDashboardStats(),
      getRecentLogins(),
      getRecentRegistrations(),
      getDashboardPaymentStats(),
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

      {/* Payment revenue */}
      <DashboardPayments payments={paymentStats} />
    </AdminContentLayout>
  )
}

export default AdminDashboardPage
