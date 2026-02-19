/**
 * File: components/layout/navbar/navbar.tsx
 * Description: Server Component entry point for the public navbar. Fetches global settings to hydrate the client component.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { getSiteSettings } from '@/lib/services/settings.service'
import { NavbarClient } from './navbar-client'

export const Navbar = async () => {
  const settings = await getSiteSettings()

  return <NavbarClient settings={settings} />
}
