/**
 * File: app/admin/settings/page.tsx
 * Description: Admin settings page for managing global platform configuration.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Settings } from 'lucide-react'
import type { Metadata } from 'next'
import { SettingsForm } from '@/components/features/admin/settings-form'
import { getGlobalSettings } from '@/lib/services/settings'

export const metadata: Metadata = {
  title: 'Paramètres',
}

const AdminSettingsPage = async () => {
  const settings = await getGlobalSettings()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page heading */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
          <Settings className="size-6 text-blue-400" />
          Paramètres
        </h1>
        <p className="text-sm text-zinc-400">
          Configurez les paramètres globaux de la plateforme.
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  )
}

export default AdminSettingsPage
