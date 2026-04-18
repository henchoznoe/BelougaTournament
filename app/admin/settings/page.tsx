/**
 * File: app/admin/settings/page.tsx
 * Description: Admin settings page for managing global platform configuration.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { AdminBreadcrumb } from '@/components/features/admin/admin-breadcrumb'
import { SettingsForm } from '@/components/features/admin/settings-form'
import AdminGuard from '@/components/features/auth/admin-guard'
import { getGlobalSettings } from '@/lib/services/settings'

export const metadata: Metadata = {
  title: 'Paramètres',
}

const AdminSettingsPage = async () => {
  const settings = await getGlobalSettings()

  return (
    <AdminGuard>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Breadcrumb */}
        <AdminBreadcrumb segments={[{ label: 'Paramètres' }]} />

        <SettingsForm settings={settings} />
      </div>
    </AdminGuard>
  )
}

export default AdminSettingsPage
