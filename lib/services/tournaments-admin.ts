/**
 * File: lib/services/tournaments-admin.ts
 * Description: Admin tournament services (list, detail, registrations, teams).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
// $queryRaw returns `unknown[]`; casts below assert the shape matches our domain types
// because Prisma cannot infer types from raw SQL at compile time.
import { cacheLife, cacheTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/config/constants'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import type {
  TeamItem,
  TournamentDetail,
  TournamentListItem,
  TournamentRegistrationItem,
} from '@/lib/types/tournament'
import { RegistrationStatus } from '@/prisma/generated/prisma/enums'

/** Raw row shape returned by Prisma before post-processing (getRegistrations). */
type RawTournamentRegistrationRow = Omit<
  TournamentRegistrationItem,
  'team' | 'user'
> & {
  user: TournamentRegistrationItem['user'] & {
    teamMembers: {
      team: {
        id: string
        name: string
        captainId: string
        isFull: boolean
        logoUrl: string | null
      }
    }[]
  }
  team: { id: string; name: string } | null
}

/** Fetches all tournaments for the admin list table. */
export const getTournaments = async (): Promise<TournamentListItem[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const rows = await prisma.tournament.findMany({
      orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        games: true,
        format: true,
        teamSize: true,
        maxTeams: true,
        registrationType: true,
        entryFeeAmount: true,
        entryFeeCurrency: true,
        status: true,
        startDate: true,
        endDate: true,
        registrationOpen: true,
        registrationClose: true,

        _count: {
          select: {
            registrations: true,
            teams: true,
          },
        },
      },
    })
    return rows as unknown as TournamentListItem[]
  } catch (error) {
    logger.error({ error }, 'Error fetching tournaments')
    return []
  }
}

/** Fetches a single tournament by slug (for admin edit page). */
export const getTournamentBySlug = async (
  slug: string,
): Promise<TournamentDetail | null> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const row = await prisma.tournament.findUnique({
      where: { slug },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        toornamentStages: {
          orderBy: { number: 'asc' },
        },
        _count: {
          select: {
            registrations: true,
            teams: true,
          },
        },
      },
    })
    return row as TournamentDetail | null
  } catch (error) {
    logger.error({ error }, 'Error fetching tournament by slug')
    return null
  }
}

/** Fetches a single tournament by ID (for server actions). */
export const getTournamentById = async (
  id: string,
): Promise<TournamentDetail | null> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const row = await prisma.tournament.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        toornamentStages: {
          orderBy: { number: 'asc' },
        },
        _count: {
          select: {
            registrations: true,
            teams: true,
          },
        },
      },
    })
    return row as TournamentDetail | null
  } catch (error) {
    logger.error({ error }, 'Error fetching tournament by ID')
    return null
  }
}

/** Fetches all registrations for a tournament (admin registrations tab). */
export const getRegistrations = async (
  tournamentId: string,
): Promise<TournamentRegistrationItem[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const rows = (await prisma.tournamentRegistration.findMany({
      where: {
        tournamentId,
        status: {
          in: [RegistrationStatus.PENDING, RegistrationStatus.CONFIRMED],
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fieldValues: true,
        createdAt: true,
        status: true,
        paymentStatus: true,
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
            teamMembers: {
              where: { team: { tournamentId } },
              select: {
                team: {
                  select: {
                    id: true,
                    name: true,
                    captainId: true,
                    isFull: true,
                    logoUrl: true,
                  },
                },
              },
            },
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })) as unknown as RawTournamentRegistrationRow[] // Prisma nested include loses strict typing; cast to our raw row type

    // Post-process: resolve team from TeamMember for all players (not just captains)
    return rows.map(row => {
      const membership = row.user.teamMembers[0]
      const team = membership
        ? {
            id: membership.team.id,
            name: membership.team.name,
            captainId: membership.team.captainId,
            isFull: membership.team.isFull,
            logoUrl: membership.team.logoUrl,
          }
        : null

      const { teamMembers: _, ...user } = row.user
      return { ...row, user, team }
    })
  } catch (error) {
    logger.error({ error }, 'Error fetching registrations')
    return []
  }
}

/** Fetches all teams for a tournament (admin teams tab). */
export const getTeams = async (tournamentId: string): Promise<TeamItem[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const rows = await prisma.team.findMany({
      where: { tournamentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        isFull: true,
        createdAt: true,
        captain: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
          },
        },
        members: {
          orderBy: { joinedAt: 'asc' },
          select: {
            id: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                image: true,
              },
            },
          },
        },
      },
    })
    return rows as unknown as TeamItem[]
  } catch (error) {
    logger.error({ error }, 'Error fetching teams')
    return []
  }
}
