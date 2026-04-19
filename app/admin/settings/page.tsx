/**
 * File: app/admin/settings/page.tsx
 * Description: Admin settings page for managing global platform configuration.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Settings } from 'lucide-react'
import type { Metadata } from 'next'
import { SettingsForm } from '@/components/admin/settings/settings-form'
import { AdminContentLayout } from '@/components/admin/ui/admin-content-layout'
import { getGlobalSettings } from '@/lib/services/settings'

export const metadata: Metadata = {
  title: 'Paramètres',
}

const AdminSettingsPage = async () => {
  const settings = await getGlobalSettings()

  return (
    <AdminContentLayout
      segments={[{ label: 'Paramètres' }]}
      icon={Settings}
      title="Paramètres"
      subtitle="Configurez les paramètres globaux de la plateforme."
    >
      <SettingsForm settings={settings} />
    </AdminContentLayout>
  )
}

export default AdminSettingsPage
