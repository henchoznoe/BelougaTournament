/**
 * File: tests/utils/tournament-status.test.ts
 * Description: Unit tests for public tournament status and Twitch channel helpers.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import {
  extractTwitchChannel,
  getTournamentRegistrationBadge,
} from '@/lib/utils/tournament-status'
import { TournamentStatus } from '@/prisma/generated/prisma/enums'

const BASE_TOURNAMENT = {
  status: TournamentStatus.PUBLISHED,
  registrationOpen: new Date('2026-05-01T10:00:00.000Z'),
  registrationClose: new Date('2026-05-10T10:00:00.000Z'),
}

describe('getTournamentRegistrationBadge', () => {
  it('returns upcoming before registration opens', () => {
    const badge = getTournamentRegistrationBadge(
      BASE_TOURNAMENT,
      new Date('2026-04-30T10:00:00.000Z'),
    )

    expect(badge.phase).toBe('upcoming')
    expect(badge.isOpen).toBe(false)
  })

  it('returns open during the registration window', () => {
    const badge = getTournamentRegistrationBadge(
      BASE_TOURNAMENT,
      new Date('2026-05-05T10:00:00.000Z'),
    )

    expect(badge.phase).toBe('open')
    expect(badge.isOpen).toBe(true)
  })

  it('returns closed after registration closes', () => {
    const badge = getTournamentRegistrationBadge(
      BASE_TOURNAMENT,
      new Date('2026-05-11T10:00:00.000Z'),
    )

    expect(badge.phase).toBe('closed')
    expect(badge.isOpen).toBe(false)
  })

  it('returns archived when the tournament is archived', () => {
    const badge = getTournamentRegistrationBadge(
      { ...BASE_TOURNAMENT, status: TournamentStatus.ARCHIVED },
      new Date('2026-05-05T10:00:00.000Z'),
    )

    expect(badge.phase).toBe('archived')
    expect(badge.label).toContain('Tournoi terminé')
  })
})

describe('extractTwitchChannel', () => {
  it('extracts the channel name from a Twitch URL', () => {
    expect(extractTwitchChannel('https://www.twitch.tv/quentadou')).toBe(
      'quentadou',
    )
  })

  it('returns the raw value when the string is not a valid URL', () => {
    expect(extractTwitchChannel('quentadou')).toBe('quentadou')
  })
})
