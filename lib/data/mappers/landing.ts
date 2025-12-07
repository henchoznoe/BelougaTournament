/**
 * File: lib/data/mappers/landing.ts
 * Description: Data mappers for the landing page.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { getSiteSettings } from '@/lib/data/settings'

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

export const getLandingStats = async () => {
  const settings = await getSiteSettings()

  return {
    years: settings.statsYears,
    players: settings.statsPlayers,
    tournaments: settings.statsTournaments,
    matches: settings.statsMatches,
  }
}
