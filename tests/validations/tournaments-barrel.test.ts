/**
 * File: tests/validations/tournaments-barrel.test.ts
 * Description: Unit tests for the tournament validations barrel re-export module.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'

describe('tournaments validation barrel', () => {
  it('re-exports CRUD, filters, and registration schemas', async () => {
    const tournamentValidations = await import('@/lib/validations/tournaments')

    expect(tournamentValidations.tournamentSchema).toBeDefined()
    expect(tournamentValidations.parsePublicTournamentFilters).toBeDefined()
    expect(tournamentValidations.registerForTournamentSchema).toBeDefined()
  })
})
