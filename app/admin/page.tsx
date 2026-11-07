/**
 * File: app/admin/page.tsx
 * Description: Admin dashboard page with overview stats.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { LayoutDashboard } from 'lucide-react'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DashboardPayments } from '@/components/admin/dashboard/dashboard-payments'
import {
  DashboardRecentRegistrations,
  DashboardRecentVisits,
} from '@/components/admin/dashboard/dashboard-recent'
import { DashboardStatsCards } from '@/components/admin/dashboard/dashboard-stats'
import { AdminContentLayout } from '@/components/admin/ui/admin-content-layout'
import { Button } from '@/components/ui/button'
import { PendingLink } from '@/components/ui/pending-link'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/lib/config/routes'
import {
  getDashboardPaymentStats,
  getDashboardStats,
  getRecentRegistrations,
  getRecentVisits,
} from '@/lib/services/dashboard'

export const metadata: Metadata = {
  title: 'Dashboard',
}

const AdminDashboardPage = async () => {
  return (
    <AdminContentLayout
      segments={[{ label: 'Dashboard' }]}
      icon={LayoutDashboard}
      title="Dashboard"
      subtitle="Vue d'ensemble de la plateforme Belouga Tournament."
    >
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <PendingLink href={ROUTES.ADMIN_TOURNAMENT_NEW}>
            Créer un tournoi
          </PendingLink>
        </Button>
        <Button variant="outline" asChild>
          <PendingLink href={ROUTES.ADMIN_TOURNAMENTS}>
            Gérer les tournois
          </PendingLink>
        </Button>
      </div>
      <section aria-label="Synthèse de la plateforme">
        <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
          <DashboardSummary />
        </Suspense>
      </section>
      <section aria-label="Paiements et revenus">
        <Suspense fallback={<Skeleton className="h-72 w-full rounded-2xl" />}>
          <DashboardRevenue />
        </Suspense>
      </section>
      <section
        aria-label="Activité récente"
        className="grid gap-6 lg:grid-cols-2"
      >
        <Suspense fallback={<Skeleton className="h-80 rounded-2xl" />}>
          <RecentRegistrations />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-80 rounded-2xl" />}>
          <RecentVisits />
        </Suspense>
      </section>
    </AdminContentLayout>
  )
}

const DashboardSummary = async () => (
  <DashboardStatsCards stats={await getDashboardStats()} />
)
const DashboardRevenue = async () => (
  <DashboardPayments payments={await getDashboardPaymentStats()} />
)
const RecentRegistrations = async () => (
  <DashboardRecentRegistrations
    registrations={await getRecentRegistrations()}
  />
)
const RecentVisits = async () => (
  <DashboardRecentVisits visits={await getRecentVisits()} />
)

export default AdminDashboardPage
