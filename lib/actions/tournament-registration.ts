/**
 * File: lib/actions/tournament-registration.ts
 * Description: Public re-export barrel for tournament registration server actions.
 *   Consumers should import directly from the specific action files when possible:
 *     - tournament-registration-solo.ts   (solo register, field updates, cancel pending)
 *     - tournament-registration-team.ts   (create team, join team)
 *   This barrel exists to avoid breaking existing import sites during the refactor.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export {
  cancelMyPendingRegistrationForTournament,
  registerForTournament,
  updateRegistrationFields,
} from '@/lib/actions/tournament-registration-solo'

export {
  createTeamAndRegister,
  joinTeamAndRegister,
} from '@/lib/actions/tournament-registration-team'
