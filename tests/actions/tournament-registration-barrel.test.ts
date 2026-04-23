/**
 * File: tests/actions/tournament-registration-barrel.test.ts
 * Description: Unit tests for the tournament registration barrel re-export module.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/actions/tournament-registration-solo', () => ({
  registerForTournament: vi.fn(),
  updateRegistrationFields: vi.fn(),
  cancelMyPendingRegistrationForTournament: vi.fn(),
}))
vi.mock('@/lib/actions/tournament-registration-team', () => ({
  createTeamAndRegister: vi.fn(),
  joinTeamAndRegister: vi.fn(),
}))

describe('tournament-registration barrel', () => {
  it('re-exports solo and team registration actions', async () => {
    const module = await import('@/lib/actions/tournament-registration')

    expect(module.registerForTournament).toBeDefined()
    expect(module.updateRegistrationFields).toBeDefined()
    expect(module.cancelMyPendingRegistrationForTournament).toBeDefined()
    expect(module.createTeamAndRegister).toBeDefined()
    expect(module.joinTeamAndRegister).toBeDefined()
  })
})
