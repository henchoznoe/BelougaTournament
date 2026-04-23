/**
 * File: tests/validations/tournaments.test.ts
 * Description: Unit tests for tournament CRUD Zod validation schemas.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import {
  deleteTournamentSchema,
  registerForTournamentSchema,
  toornamentStageSchema,
  tournamentFieldSchema,
  tournamentSchema,
  unregisterFromTournamentSchema,
  updateTeamNameSchema,
  updateTournamentSchema,
  updateTournamentStatusSchema,
} from '@/lib/validations/tournaments'

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const INVALID_UUID = 'not-a-uuid'

const VALID_FIELD = {
  label: 'Riot ID',
  type: 'TEXT' as const,
  required: true,
  order: 0,
}

const VALID_TOURNAMENT = {
  title: 'Belouga Valorant Cup',
  slug: 'belouga-valorant-cup',
  description: 'Tournoi Valorant 5v5 organisé par Belouga.',
  startDate: '2026-06-15T10:00:00.000Z',
  endDate: '2026-06-17T18:00:00.000Z',
  registrationOpen: '2026-05-01T00:00:00.000Z',
  registrationClose: '2026-06-14T23:59:00.000Z',
  maxTeams: 16,
  format: 'TEAM' as const,
  teamSize: 5,
  games: ['Valorant'],
  rules: 'Double élimination BO3.',
  prize: '500 CHF',
  registrationType: 'FREE' as const,
  entryFeeAmount: null,
  entryFeeCurrency: 'CHF' as const,
  refundPolicyType: 'NONE' as const,
  refundDeadlineDays: null,
  teamLogoEnabled: false,
  toornamentId: '',
  streamUrl: '',
  imageUrl: '',
  fields: [VALID_FIELD],
  toornamentStages: [],
}

const PAID_ENTRY_FEE_AMOUNT = 500
const FIXED_DONATION_AMOUNT = 200
const MINIMUM_DONATION_AMOUNT = 100

// ---------------------------------------------------------------------------
// tournamentFieldSchema
// ---------------------------------------------------------------------------

describe('tournamentFieldSchema', () => {
  it('accepts a valid field', () => {
    expect(tournamentFieldSchema.safeParse(VALID_FIELD).success).toBe(true)
  })

  it('accepts a field with optional id', () => {
    const result = tournamentFieldSchema.safeParse({
      ...VALID_FIELD,
      id: VALID_UUID,
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty label', () => {
    expect(
      tournamentFieldSchema.safeParse({ ...VALID_FIELD, label: '' }).success,
    ).toBe(false)
  })

  it('rejects a label exceeding 100 characters', () => {
    expect(
      tournamentFieldSchema.safeParse({
        ...VALID_FIELD,
        label: 'x'.repeat(101),
      }).success,
    ).toBe(false)
  })

  it('rejects an invalid type', () => {
    expect(
      tournamentFieldSchema.safeParse({ ...VALID_FIELD, type: 'BOOLEAN' })
        .success,
    ).toBe(false)
  })

  it('accepts NUMBER type', () => {
    expect(
      tournamentFieldSchema.safeParse({ ...VALID_FIELD, type: 'NUMBER' })
        .success,
    ).toBe(true)
  })

  it('rejects a negative order', () => {
    expect(
      tournamentFieldSchema.safeParse({ ...VALID_FIELD, order: -1 }).success,
    ).toBe(false)
  })

  it('rejects an invalid UUID for id', () => {
    expect(
      tournamentFieldSchema.safeParse({ ...VALID_FIELD, id: INVALID_UUID })
        .success,
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// toornamentStageSchema
// ---------------------------------------------------------------------------

const VALID_STAGE = {
  name: 'Poules',
  stageId: '618983668512789184',
  number: 0,
}

describe('toornamentStageSchema', () => {
  it('accepts a valid stage', () => {
    expect(toornamentStageSchema.safeParse(VALID_STAGE).success).toBe(true)
  })

  it('accepts a stage with optional id', () => {
    const result = toornamentStageSchema.safeParse({
      ...VALID_STAGE,
      id: VALID_UUID,
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty name', () => {
    expect(
      toornamentStageSchema.safeParse({ ...VALID_STAGE, name: '' }).success,
    ).toBe(false)
  })

  it('rejects a name exceeding 30 characters', () => {
    expect(
      toornamentStageSchema.safeParse({
        ...VALID_STAGE,
        name: 'x'.repeat(31),
      }).success,
    ).toBe(false)
  })

  it('rejects an empty stageId', () => {
    expect(
      toornamentStageSchema.safeParse({ ...VALID_STAGE, stageId: '' }).success,
    ).toBe(false)
  })

  it('rejects a stageId exceeding 200 characters', () => {
    expect(
      toornamentStageSchema.safeParse({
        ...VALID_STAGE,
        stageId: 'x'.repeat(201),
      }).success,
    ).toBe(false)
  })

  it('rejects a negative number', () => {
    expect(
      toornamentStageSchema.safeParse({ ...VALID_STAGE, number: -1 }).success,
    ).toBe(false)
  })

  it('rejects an invalid UUID for id', () => {
    expect(
      toornamentStageSchema.safeParse({ ...VALID_STAGE, id: INVALID_UUID })
        .success,
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// tournamentSchema
// ---------------------------------------------------------------------------

describe('tournamentSchema', () => {
  it('accepts a valid tournament', () => {
    expect(tournamentSchema.safeParse(VALID_TOURNAMENT).success).toBe(true)
  })

  it('accepts a tournament with null maxTeams', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      maxTeams: null,
    })
    expect(result.success).toBe(true)
  })

  it('accepts a paid tournament with a refund deadline', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      registrationType: 'PAID',
      entryFeeAmount: 500,
      refundPolicyType: 'BEFORE_DEADLINE',
      refundDeadlineDays: 14,
    })
    expect(result.success).toBe(true)
  })

  it('rejects a paid tournament without a price', () => {
    expect(
      tournamentSchema.safeParse({
        ...VALID_TOURNAMENT,
        registrationType: 'PAID',
        entryFeeAmount: null,
        refundPolicyType: 'BEFORE_DEADLINE',
        refundDeadlineDays: 14,
      }).success,
    ).toBe(false)
  })

  it('rejects a refund deadline for free tournaments', () => {
    expect(
      tournamentSchema.safeParse({
        ...VALID_TOURNAMENT,
        refundPolicyType: 'BEFORE_DEADLINE',
        refundDeadlineDays: 14,
      }).success,
    ).toBe(false)
  })

  it('accepts a tournament with empty fields array', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      fields: [],
    })
    expect(result.success).toBe(true)
  })

  it('accepts SOLO format', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      format: 'SOLO',
      teamSize: 1,
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid URL for streamUrl', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      streamUrl: 'https://twitch.tv/belouga',
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty imageUrls array', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      imageUrls: [],
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid URLs for imageUrls', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      imageUrls: [
        'https://example.com/image.png',
        'https://example.com/image2.png',
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid imageUrls entry', () => {
    expect(
      tournamentSchema.safeParse({
        ...VALID_TOURNAMENT,
        imageUrls: ['not-a-url'],
      }).success,
    ).toBe(false)
  })

  // --- Title ---

  it('rejects an empty title', () => {
    expect(
      tournamentSchema.safeParse({ ...VALID_TOURNAMENT, title: '' }).success,
    ).toBe(false)
  })

  it('rejects a title exceeding 200 characters', () => {
    expect(
      tournamentSchema.safeParse({
        ...VALID_TOURNAMENT,
        title: 'x'.repeat(201),
      }).success,
    ).toBe(false)
  })

  // --- Slug ---

  it('rejects an empty slug', () => {
    expect(
      tournamentSchema.safeParse({ ...VALID_TOURNAMENT, slug: '' }).success,
    ).toBe(false)
  })

  it('rejects a slug with uppercase letters', () => {
    expect(
      tournamentSchema.safeParse({ ...VALID_TOURNAMENT, slug: 'My-Tournament' })
        .success,
    ).toBe(false)
  })

  it('rejects a slug with spaces', () => {
    expect(
      tournamentSchema.safeParse({
        ...VALID_TOURNAMENT,
        slug: 'my tournament',
      }).success,
    ).toBe(false)
  })

  it('rejects a slug starting with a hyphen', () => {
    expect(
      tournamentSchema.safeParse({
        ...VALID_TOURNAMENT,
        slug: '-my-tournament',
      }).success,
    ).toBe(false)
  })

  it('rejects a slug ending with a hyphen', () => {
    expect(
      tournamentSchema.safeParse({
        ...VALID_TOURNAMENT,
        slug: 'my-tournament-',
      }).success,
    ).toBe(false)
  })

  it('rejects a slug with consecutive hyphens', () => {
    expect(
      tournamentSchema.safeParse({
        ...VALID_TOURNAMENT,
        slug: 'my--tournament',
      }).success,
    ).toBe(false)
  })

  // --- Description ---

  it('rejects an empty description', () => {
    expect(
      tournamentSchema.safeParse({ ...VALID_TOURNAMENT, description: '' })
        .success,
    ).toBe(false)
  })

  // --- Format & teamSize ---

  it('rejects an invalid format', () => {
    expect(
      tournamentSchema.safeParse({ ...VALID_TOURNAMENT, format: 'DUO' })
        .success,
    ).toBe(false)
  })

  it('rejects teamSize below 1', () => {
    expect(
      tournamentSchema.safeParse({ ...VALID_TOURNAMENT, teamSize: 0 }).success,
    ).toBe(false)
  })

  it('rejects teamSize above 20', () => {
    expect(
      tournamentSchema.safeParse({ ...VALID_TOURNAMENT, teamSize: 21 }).success,
    ).toBe(false)
  })

  // --- maxTeams ---

  it('rejects maxTeams below 2', () => {
    expect(
      tournamentSchema.safeParse({ ...VALID_TOURNAMENT, maxTeams: 1 }).success,
    ).toBe(false)
  })

  // --- URLs ---

  it('rejects an invalid streamUrl', () => {
    expect(
      tournamentSchema.safeParse({
        ...VALID_TOURNAMENT,
        streamUrl: 'ftp://invalid',
      }).success,
    ).toBe(false)
  })

  // --- Date refinements ---

  it('rejects endDate before startDate', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      startDate: '2026-06-17T10:00:00.000Z',
      endDate: '2026-06-15T18:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejects registrationClose before registrationOpen', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      registrationOpen: '2026-06-14T00:00:00.000Z',
      registrationClose: '2026-06-01T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejects registrationClose after startDate', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      startDate: '2026-06-15T10:00:00.000Z',
      registrationClose: '2026-06-16T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  it('accepts registrationClose equal to startDate', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      startDate: '2026-06-15T10:00:00.000Z',
      registrationClose: '2026-06-15T10:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  // --- Datetime validation ---

  it('rejects an empty startDate', () => {
    expect(
      tournamentSchema.safeParse({
        ...VALID_TOURNAMENT,
        startDate: '',
      }).success,
    ).toBe(false)
  })

  // --- Toornament stages refinement ---

  it('accepts stages when toornamentId is set', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      toornamentId: '1234567890',
      toornamentStages: [VALID_STAGE],
    })
    expect(result.success).toBe(true)
  })

  it('rejects stages when toornamentId is empty', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      toornamentId: '',
      toornamentStages: [VALID_STAGE],
    })
    expect(result.success).toBe(false)
  })

  it('accepts empty stages with empty toornamentId', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      toornamentId: '',
      toornamentStages: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejects donations for free tournaments', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      donationEnabled: true,
      donationType: 'FIXED',
      donationFixedAmount: FIXED_DONATION_AMOUNT,
    })

    expect(result.success).toBe(false)
  })

  it('rejects enabled donations without a donation type', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      registrationType: 'PAID',
      entryFeeAmount: PAID_ENTRY_FEE_AMOUNT,
      donationEnabled: true,
      donationType: null,
    })

    expect(result.success).toBe(false)
  })

  it('rejects fixed donations without a fixed amount', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      registrationType: 'PAID',
      entryFeeAmount: PAID_ENTRY_FEE_AMOUNT,
      donationEnabled: true,
      donationType: 'FIXED',
      donationFixedAmount: null,
    })

    expect(result.success).toBe(false)
  })

  it('rejects free donations without a minimum amount', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      registrationType: 'PAID',
      entryFeeAmount: PAID_ENTRY_FEE_AMOUNT,
      donationEnabled: true,
      donationType: 'FREE',
      donationMinAmount: null,
    })

    expect(result.success).toBe(false)
  })

  it('accepts paid tournaments with a valid fixed donation configuration', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      registrationType: 'PAID',
      entryFeeAmount: PAID_ENTRY_FEE_AMOUNT,
      donationEnabled: true,
      donationType: 'FIXED',
      donationFixedAmount: FIXED_DONATION_AMOUNT,
      donationMinAmount: null,
    })

    expect(result.success).toBe(true)
  })

  it('accepts paid tournaments with a valid free donation configuration', () => {
    const result = tournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      registrationType: 'PAID',
      entryFeeAmount: PAID_ENTRY_FEE_AMOUNT,
      donationEnabled: true,
      donationType: 'FREE',
      donationFixedAmount: null,
      donationMinAmount: MINIMUM_DONATION_AMOUNT,
    })

    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// deleteTournamentSchema
// ---------------------------------------------------------------------------

describe('deleteTournamentSchema', () => {
  it('accepts a valid UUID', () => {
    expect(deleteTournamentSchema.safeParse({ id: VALID_UUID }).success).toBe(
      true,
    )
  })

  it('rejects an invalid UUID', () => {
    expect(deleteTournamentSchema.safeParse({ id: INVALID_UUID }).success).toBe(
      false,
    )
  })

  it('rejects missing id', () => {
    expect(deleteTournamentSchema.safeParse({}).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// updateTournamentSchema
// ---------------------------------------------------------------------------

describe('updateTournamentSchema', () => {
  it('accepts a valid tournament with id', () => {
    const result = updateTournamentSchema.safeParse({
      ...VALID_TOURNAMENT,
      id: VALID_UUID,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing id', () => {
    expect(updateTournamentSchema.safeParse(VALID_TOURNAMENT).success).toBe(
      false,
    )
  })

  it('rejects invalid id UUID', () => {
    expect(
      updateTournamentSchema.safeParse({
        ...VALID_TOURNAMENT,
        id: INVALID_UUID,
      }).success,
    ).toBe(false)
  })

  it('inherits all tournamentSchema constraints', () => {
    expect(
      updateTournamentSchema.safeParse({
        id: VALID_UUID,
        ...VALID_TOURNAMENT,
        title: '',
      }).success,
    ).toBe(false)
  })

  it('inherits date refinements', () => {
    const result = updateTournamentSchema.safeParse({
      id: VALID_UUID,
      ...VALID_TOURNAMENT,
      startDate: '2026-06-17T10:00:00.000Z',
      endDate: '2026-06-15T18:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// updateTournamentStatusSchema
// ---------------------------------------------------------------------------

describe('updateTournamentStatusSchema', () => {
  it('accepts DRAFT status', () => {
    const result = updateTournamentStatusSchema.safeParse({
      id: VALID_UUID,
      status: 'DRAFT',
    })
    expect(result.success).toBe(true)
  })

  it('accepts PUBLISHED status', () => {
    const result = updateTournamentStatusSchema.safeParse({
      id: VALID_UUID,
      status: 'PUBLISHED',
    })
    expect(result.success).toBe(true)
  })

  it('accepts ARCHIVED status', () => {
    const result = updateTournamentStatusSchema.safeParse({
      id: VALID_UUID,
      status: 'ARCHIVED',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid status', () => {
    expect(
      updateTournamentStatusSchema.safeParse({
        id: VALID_UUID,
        status: 'CANCELLED',
      }).success,
    ).toBe(false)
  })

  it('rejects an invalid UUID', () => {
    expect(
      updateTournamentStatusSchema.safeParse({
        id: INVALID_UUID,
        status: 'DRAFT',
      }).success,
    ).toBe(false)
  })

  it('rejects missing status', () => {
    expect(
      updateTournamentStatusSchema.safeParse({ id: VALID_UUID }).success,
    ).toBe(false)
  })

  it('rejects missing id', () => {
    expect(
      updateTournamentStatusSchema.safeParse({ status: 'DRAFT' }).success,
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// registerForTournamentSchema
// ---------------------------------------------------------------------------

describe('registerForTournamentSchema', () => {
  const VALID_REGISTRATION = {
    tournamentId: VALID_UUID,
    returnPath: '/tournaments/valorant-cup',
    fieldValues: { 'Riot ID': 'Player#1234', Rank: 'Diamond' },
  }

  it('accepts a valid registration with string field values', () => {
    expect(
      registerForTournamentSchema.safeParse(VALID_REGISTRATION).success,
    ).toBe(true)
  })

  it('accepts a registration with numeric field values', () => {
    const result = registerForTournamentSchema.safeParse({
      tournamentId: VALID_UUID,
      returnPath: '/tournaments/valorant-cup',
      fieldValues: { 'Riot ID': 'Player#1234', MMR: 2500 },
    })
    expect(result.success).toBe(true)
  })

  it('accepts a registration with empty fieldValues', () => {
    const result = registerForTournamentSchema.safeParse({
      tournamentId: VALID_UUID,
      returnPath: '/tournaments/valorant-cup',
      fieldValues: {},
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid tournamentId UUID', () => {
    expect(
      registerForTournamentSchema.safeParse({
        ...VALID_REGISTRATION,
        tournamentId: INVALID_UUID,
      }).success,
    ).toBe(false)
  })

  it('rejects missing tournamentId', () => {
    expect(
      registerForTournamentSchema.safeParse({
        returnPath: '/tournaments/valorant-cup',
        fieldValues: { 'Riot ID': 'Player#1234' },
      }).success,
    ).toBe(false)
  })

  it('rejects missing fieldValues', () => {
    expect(
      registerForTournamentSchema.safeParse({
        tournamentId: VALID_UUID,
      }).success,
    ).toBe(false)
  })

  it('accepts mixed string and number values in fieldValues', () => {
    const result = registerForTournamentSchema.safeParse({
      tournamentId: VALID_UUID,
      returnPath: '/tournaments/valorant-cup',
      fieldValues: { Name: 'John', Age: 25, Score: 100 },
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// unregisterFromTournamentSchema
// ---------------------------------------------------------------------------

describe('unregisterFromTournamentSchema', () => {
  it('accepts a valid tournamentId UUID', () => {
    const result = unregisterFromTournamentSchema.safeParse({
      tournamentId: VALID_UUID,
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid tournamentId', () => {
    expect(
      unregisterFromTournamentSchema.safeParse({
        tournamentId: INVALID_UUID,
      }).success,
    ).toBe(false)
  })

  it('rejects missing tournamentId', () => {
    expect(unregisterFromTournamentSchema.safeParse({}).success).toBe(false)
  })

  it('rejects empty tournamentId', () => {
    expect(
      unregisterFromTournamentSchema.safeParse({ tournamentId: '' }).success,
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// updateTeamNameSchema
// ---------------------------------------------------------------------------

describe('updateTeamNameSchema', () => {
  it('accepts a valid team name', () => {
    expect(
      updateTeamNameSchema.safeParse({
        teamId: VALID_UUID,
        name: 'Alpha Squad',
      }).success,
    ).toBe(true)
  })

  it('rejects a name that is too short', () => {
    expect(
      updateTeamNameSchema.safeParse({
        teamId: VALID_UUID,
        name: 'A',
      }).success,
    ).toBe(false)
  })

  it('rejects a name that is too long', () => {
    expect(
      updateTeamNameSchema.safeParse({
        teamId: VALID_UUID,
        name: 'A'.repeat(31),
      }).success,
    ).toBe(false)
  })

  it('rejects an invalid team ID', () => {
    expect(
      updateTeamNameSchema.safeParse({
        teamId: INVALID_UUID,
        name: 'Alpha Squad',
      }).success,
    ).toBe(false)
  })

  it('trims whitespace from the name', () => {
    const result = updateTeamNameSchema.safeParse({
      teamId: VALID_UUID,
      name: '  Alpha Squad  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Alpha Squad')
    }
  })
})
