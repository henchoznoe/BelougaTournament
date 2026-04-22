/**
 * File: components/public/layout/public-navbar.tsx
 * Description: Interactive Navbar component handling navigation, mobile sheet, and animations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { PublicNavbarClient } from '@/components/public/layout/public-navbar-client'
import { DEFAULT_ASSETS } from '@/lib/config/constants'
import { getSession } from '@/lib/services/auth'
import { getGlobalSettings } from '@/lib/services/settings'

export const PublicNavbar = async () => {
  const [settings, session] = await Promise.all([
    getGlobalSettings(),
    getSession(),
  ])

  return (
    <PublicNavbarClient
      logoUrl={settings.logoUrl ?? DEFAULT_ASSETS.LOGO}
      sessionUser={session?.user ?? null}
    />
  )
}
