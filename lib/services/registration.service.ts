/**
 * File: lib/services/registration.service.ts
 * Description: Data access layer for registrations.
 */

import prisma from '@/lib/core/db'
import { fr } from '@/lib/i18n/dictionaries/fr'
import type { RegistrationInput } from '@/lib/validations/registration'
import { Prisma, RegistrationStatus } from '@/prisma/generated/prisma/client'

// ----------------------------------------------------------------------
// READS
// ----------------------------------------------------------------------

export const getRegistrationById = async (id: string) => {
  return prisma.registration.findUnique({
    where: { id },
    include: { tournament: true },
  })
}

export const getRegistrationByEmailAndTournament = async (
  contactEmail: string,
  tournamentId: string,
) => {
  return prisma.registration.findUnique({
    where: {
      tournamentId_contactEmail: {
        tournamentId,
        contactEmail,
      },
    },
  })
}

// ----------------------------------------------------------------------
// WRITES
// ----------------------------------------------------------------------

export const createRegistration = async (
  data: RegistrationInput,
  tournament: Prisma.TournamentGetPayload<{ include: { fields: true } }>,
) => {
  const { tournamentId, teamName, contactEmail, players } = data

  try {
    return await prisma.$transaction(async tx => {
      // Max Participants Logic
      let status: RegistrationStatus = RegistrationStatus.PENDING

      if (tournament.maxParticipants) {
        // Lock the Tournament row to prevent race conditions
        // Note: Raw query for locking might depend on DB type (Postgres supports it)
        await tx.$executeRaw`SELECT * FROM "Tournament" WHERE id = ${tournamentId} FOR UPDATE`

        const currentRegistrations = await tx.registration.count({
          where: {
            tournamentId,
            status: { not: RegistrationStatus.REJECTED },
          },
        })

        if (currentRegistrations >= tournament.maxParticipants) {
          status = RegistrationStatus.WAITLIST
        } else if (tournament.autoApprove) {
          status = RegistrationStatus.APPROVED
        }
      } else if (tournament.autoApprove) {
        status = RegistrationStatus.APPROVED
      }

      // Create Registration
      const registration = await tx.registration.create({
        data: {
          contactEmail,
          status,
          teamName: tournament.format === 'TEAM' ? teamName : undefined,
          tournamentId,
        },
      })

      // Create Players and Data
      await Promise.all(
        players.map(async player => {
          const createdPlayer = await tx.player.create({
            data: {
              nickname: player.nickname,
              registrationId: registration.id,
            },
          })

          const dataEntries = Object.entries(player.data).map(
            ([fieldId, value]) => ({
              playerId: createdPlayer.id,
              tournamentFieldId: fieldId,
              value: value,
            }),
          )

          if (dataEntries.length > 0) {
            await tx.playerData.createMany({
              data: dataEntries,
            })
          }
        }),
      )

      return registration
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error(fr.common.registration.emailAlreadyUsed)
      }
    }
    throw error
  }
}

export const updateRegistrationStatus = async (
  registrationId: string,
  status: RegistrationStatus,
) => {
  try {
    return await prisma.registration.update({
      where: { id: registrationId },
      data: { status },
      include: { tournament: true },
    })
  } catch (_error) {
    throw new Error('Failed to update registration status')
  }
}

export const deleteRegistration = async (id: string) => {
  try {
    await prisma.registration.delete({
      where: { id },
    })
  } catch (_error) {
    throw new Error(fr.common.registration.cancelFailed)
  }
}
