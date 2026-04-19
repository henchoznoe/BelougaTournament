/**
 * File: lib/services/tournaments.ts
 * Description: Barrel re-export for tournament services (admin, public, user).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export {
  getRegistrations,
  getTeams,
  getTournamentById,
  getTournamentBySlug,
  getTournaments,
} from '@/lib/services/tournaments-admin'
export {
  getArchivedTournaments,
  getArchivedTournamentsFiltered,
  getAvailableTeams,
  getHeroTournamentBadge,
  getHeroTournamentBadgeData,
  getPublicTournamentBySlug,
  getPublishedTournaments,
  getPublishedTournamentsFiltered,
  PUBLIC_TOURNAMENTS_PAGE_SIZE,
} from '@/lib/services/tournaments-public'
export {
  getUserActiveTournaments,
  getUserPastRegistrations,
  getUserRegistrations,
  getUserTournamentRegistrationState,
} from '@/lib/services/tournaments-user'
