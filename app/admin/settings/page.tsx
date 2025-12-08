/**
 * File: app/admin/settings/page.tsx
 * Description: Admin settings page for global site configuration.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { Lock } from 'lucide-react'
import { headers } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import auth from '@/lib/auth'
import { APP_ROUTES } from '@/lib/config/routes'
import prisma from '@/lib/db/prisma'
import { fr } from '@/lib/i18n/dictionaries/fr'
import { Role } from '@/prisma/generated/prisma/enums'
import { SettingsForm } from './settings-form'

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const DB_CONFIG = {
  SINGLETON_ID: 1,
} as const

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

const fetchSiteSettings = async () => {
  return prisma.siteSettings.upsert({
    where: { id: DB_CONFIG.SINGLETON_ID },
    update: {},
    create: { id: DB_CONFIG.SINGLETON_ID },
  })
}

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const AccessDeniedState = () => {
  return (
    <div className="flex h-[60vh] animate-in fade-in zoom-in duration-500 flex-col items-center justify-center space-y-4 text-center">
      <div className="flex size-20 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
        <Lock className="size-10 text-red-500" />
      </div>
      <h1 className="text-3xl font-bold text-white">
        {fr.pages.admin.settings.accessDenied.title}
      </h1>
      <p className="max-w-md text-zinc-400">
        {fr.pages.admin.settings.accessDenied.description}
      </p>
      <Button
        asChild
        variant="outline"
        className="border-white/10 text-white hover:bg-white/5"
      >
        <Link href={APP_ROUTES.ADMIN_DASHBOARD}>
          {fr.pages.admin.settings.accessDenied.back}
        </Link>
      </Button>
    </div>
  )
}

const SettingsPage = async () => {
  // 1. Auth & Permission Check
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  const isSuperAdmin = session?.user?.role === Role.SUPERADMIN

  if (!isSuperAdmin) {
    return <AccessDeniedState />
  }

  // 2. Data Fetching
  const settings = await fetchSiteSettings()

  // 3. Render
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      <div>
        <h1 className="mb-2 text-4xl font-black tracking-tighter text-white">
          {fr.pages.admin.settings.title}
        </h1>
        <p className="text-zinc-400">{fr.pages.admin.settings.subtitle}</p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  )
}

export default SettingsPage
