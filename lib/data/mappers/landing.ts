/**
 * File: lib/data/mappers/landing.ts
 * Description: Data mappers for the landing page.
 */
import { getSiteSettings } from '@/lib/data/settings'

export async function getLandingStats() {
  const settings = await getSiteSettings()

  return {
    years: settings.statsYears,
    players: settings.statsPlayers,
    tournaments: settings.statsTournaments,
    matches: settings.statsMatches,
  }
}
