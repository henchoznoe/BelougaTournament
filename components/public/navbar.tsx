/**
 * File: components/public/navbar.tsx
 * Description: Server Component entry point for the public navbar. Fetches global settings to hydrate the client component.
 * Author: Noé Henchoz
 * Date: 2025-12-06
 * License: MIT
 */

import { getSiteSettings } from '@/lib/data/settings'
import { NavbarClient } from './navbar-client'

export const Navbar = async () => {
  const settings = await getSiteSettings()

  return <NavbarClient settings={settings} />
}
