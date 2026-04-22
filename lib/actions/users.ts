/**
 * File: lib/actions/users.ts
 * Description: Server actions for unified user management (promote, demote, update, delete, ban, unban).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { updateTag } from 'next/cache'
import { authenticatedAction } from '@/lib/actions/safe-action'
import { CACHE_TAGS } from '@/lib/config/constants'
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import type { TeamMemberWithTeam } from '@/lib/types/team'
import { isOwner } from '@/lib/utils/owner'
import {
  computeRefundAmount,
  issueStripeRefundAfterDbUpdate,
} from '@/lib/utils/stripe-refund'
import {
  buildTeamRevertCallback,
  handleCaptainSuccession,
} from '@/lib/utils/team'
import { isRefundEligible } from '@/lib/utils/tournament-helpers'
import {
  banUserSchema,
  deleteUserSchema,
  demoteUserSchema,
  promoteUserSchema,
  unbanUserSchema,
  updateUserSchema,
} from '@/lib/validations/users'
import {
  PaymentStatus,
  RegistrationStatus,
  Role,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'
import { formatDateTime } from '../utils/formatting'

/** Promotes a USER to ADMIN role. Owner-only action. */
export const promoteToAdmin = authenticatedAction({
  schema: promoteUserSchema,
  role: Role.ADMIN,
  handler: async (data, session): Promise<ActionState> => {
    if (!isOwner(session.user.email)) {
      return {
        success: false,
        message: 'Seuls les owners peuvent modifier les rôles.',
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { role: true, name: true, bannedAt: true },
    })

    if (!user) {
      return { success: false, message: 'Utilisateur introuvable.' }
    }

    if (user.role !== Role.USER) {
      return { success: false, message: `${user.name} est déjà admin.` }
    }

    if (user.bannedAt) {
      return {
        success: false,
        message: `${user.name} est actuellement banni. Levez le ban avant de promouvoir.`,
      }
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: data.userId },
        data: { role: Role.ADMIN },
      }),
      prisma.session.deleteMany({ where: { userId: data.userId } }),
    ])

    updateTag(CACHE_TAGS.USERS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)
    updateTag(CACHE_TAGS.DASHBOARD_RECENT_USERS)

    return { success: true, message: `${user.name} a été promu admin.` }
  },
})

/** Demotes an ADMIN back to USER role. Owner-only action. */
export const demoteAdmin = authenticatedAction({
  schema: demoteUserSchema,
  role: Role.ADMIN,
  handler: async (data, session): Promise<ActionState> => {
    if (!isOwner(session.user.email)) {
      return {
        success: false,
        message: 'Seuls les owners peuvent modifier les rôles.',
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { role: true, name: true },
    })

    if (!user) {
      return { success: false, message: 'Utilisateur introuvable.' }
    }

    if (data.userId === session.user.id) {
      return { success: false, message: 'Vous ne pouvez pas vous rétrograder.' }
    }

    if (user.role !== Role.ADMIN) {
      return { success: false, message: `${user.name} n'est pas admin.` }
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: data.userId },
        data: { role: Role.USER },
      }),
      prisma.session.deleteMany({ where: { userId: data.userId } }),
    ])

    updateTag(CACHE_TAGS.USERS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)
    updateTag(CACHE_TAGS.DASHBOARD_RECENT_USERS)

    return { success: true, message: `${user.name} a été rétrogradé.` }
  },
})

/** Updates a user's display name. */
export const updateUser = authenticatedAction({
  schema: updateUserSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { name: true },
    })

    if (!user) {
      return { success: false, message: 'Utilisateur introuvable.' }
    }

    await prisma.user.update({
      where: { id: data.userId },
      data: { displayName: data.displayName },
    })

    updateTag(CACHE_TAGS.USERS)
    updateTag(CACHE_TAGS.DASHBOARD_RECENT_USERS)

    return { success: true, message: `${user.name} a été mis à jour.` }
  },
})

/** Permanently deletes a USER-role user and all associated data. Owner-only action. */
export const deleteUser = authenticatedAction({
  schema: deleteUserSchema,
  role: Role.ADMIN,
  handler: async (data, session): Promise<ActionState> => {
    if (!isOwner(session.user.email)) {
      return {
        success: false,
        message: 'Seuls les owners peuvent supprimer un utilisateur.',
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { role: true, name: true },
    })

    if (!user) {
      return { success: false, message: 'Utilisateur introuvable.' }
    }

    if (user.role !== Role.USER) {
      return {
        success: false,
        message:
          "Seuls les utilisateurs avec le rôle Joueur peuvent être supprimés. Rétrogradez d'abord les admins.",
      }
    }

    if (data.userId === session.user.id) {
      return { success: false, message: 'Vous ne pouvez pas vous supprimer.' }
    }

    await prisma.user.delete({ where: { id: data.userId } })

    updateTag(CACHE_TAGS.USERS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)
    updateTag(CACHE_TAGS.DASHBOARD_RECENT_USERS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)

    return {
      success: true,
      message: `${user.name} a été supprimé définitivement.`,
    }
  },
})

// ---------------------------------------------------------------------------
// Ban helpers (types local to this file)
// ---------------------------------------------------------------------------

type RegistrationForBan = {
  id: string
  paymentStatus: PaymentStatus
  paymentRequiredSnapshot: boolean
  refundDeadlineDaysSnapshot: number | null
  teamId: string | null
  payments: {
    id: string
    status: PaymentStatus
    amount: number
    stripeFee: number | null
    stripePaymentIntentId: string | null
    stripeChargeId: string | null
  }[]
  tournament: {
    id: string
    status: TournamentStatus
    format: TournamentFormat
    startDate: Date
    refundPolicyType: string
    refundDeadlineDays: number | null
  }
}

/**
 * Bans a user: sets bannedAt/bannedUntil/banReason, kills all sessions,
 * and cancels (+ optionally refunds) all active registrations in future unpublished tournaments.
 * Tournaments that have already started are left untouched.
 */
export const banUser = authenticatedAction({
  schema: banUserSchema,
  role: Role.ADMIN,
  handler: async (data, session): Promise<ActionState> => {
    if (data.userId === session.user.id) {
      return {
        success: false,
        message: 'Vous ne pouvez pas vous bannir vous-même.',
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { role: true, name: true, bannedAt: true },
    })

    if (!user) {
      return { success: false, message: 'Utilisateur introuvable.' }
    }

    if (user.role === Role.ADMIN) {
      return {
        success: false,
        message: 'Impossible de bannir un administrateur.',
      }
    }

    // Fetch future active registrations (confirmed or pending, tournament not yet started)
    const registrations = (await prisma.tournamentRegistration.findMany({
      where: {
        userId: data.userId,
        status: {
          in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
        },
        tournament: {
          startDate: { gt: new Date() },
          status: TournamentStatus.PUBLISHED,
        },
      },
      select: {
        id: true,
        paymentStatus: true,
        paymentRequiredSnapshot: true,
        refundDeadlineDaysSnapshot: true,
        teamId: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            amount: true,
            stripeFee: true,
            stripePaymentIntentId: true,
            stripeChargeId: true,
          },
        },
        tournament: {
          select: {
            id: true,
            status: true,
            format: true,
            startDate: true,
            refundPolicyType: true,
            refundDeadlineDays: true,
          },
        },
      },
    })) as unknown as RegistrationForBan[]

    // Apply ban + kill sessions in a single transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: data.userId },
        data: {
          bannedAt: new Date(),
          bannedUntil: data.bannedUntil ? new Date(data.bannedUntil) : null,
          banReason: data.banReason?.trim() || null,
        },
      }),
      prisma.session.deleteMany({ where: { userId: data.userId } }),
    ])

    // Process cancellations for each active future registration
    const stripeRefundJobs: {
      registrationId: string
      latestPayment: RegistrationForBan['payments'][number]
      previousPaymentStatus: PaymentStatus
      teamRevertInfo?: Parameters<typeof buildTeamRevertCallback>[1]
    }[] = []

    for (const reg of registrations) {
      const latestPayment = reg.payments[0] ?? null
      const refundDeadlineDays =
        reg.refundDeadlineDaysSnapshot ?? reg.tournament.refundDeadlineDays
      const refundEligible =
        reg.paymentStatus === PaymentStatus.PAID &&
        isRefundEligible(
          reg.tournament.startDate,
          reg.tournament.refundPolicyType as Parameters<
            typeof isRefundEligible
          >[1],
          refundDeadlineDays,
          new Date(),
        )

      if (reg.tournament.format === TournamentFormat.TEAM && reg.teamId) {
        const teamMember = (await prisma.teamMember.findFirst({
          where: {
            userId: data.userId,
            team: { tournamentId: reg.tournament.id },
          },
          include: {
            team: {
              include: {
                tournament: { select: { teamSize: true } },
                members: { orderBy: { joinedAt: 'asc' } },
              },
            },
          },
        })) as TeamMemberWithTeam | null

        if (teamMember) {
          const team = teamMember.team
          const teamWasDeleted = team.members.length === 1

          await prisma.$transaction(async tx => {
            await tx.teamMember.deleteMany({
              where: { teamId: team.id, userId: data.userId },
            })

            if (reg.paymentRequiredSnapshot) {
              await tx.tournamentRegistration.update({
                where: { id: reg.id },
                data: {
                  status: RegistrationStatus.CANCELLED,
                  paymentStatus: refundEligible
                    ? PaymentStatus.REFUNDED
                    : reg.paymentStatus,
                  cancelledAt: new Date(),
                  teamId: null,
                  expiresAt: null,
                },
              })

              if (refundEligible && latestPayment) {
                await tx.payment.update({
                  where: { id: latestPayment.id },
                  data: {
                    status: PaymentStatus.REFUNDED,
                    refundAmount: computeRefundAmount(
                      latestPayment.amount,
                      latestPayment.stripeFee,
                    ),
                    refundedAt: new Date(),
                  },
                })
              }
            } else {
              await tx.tournamentRegistration.delete({ where: { id: reg.id } })
            }

            await handleCaptainSuccession(tx, team, data.userId)
          })

          if (refundEligible && latestPayment) {
            stripeRefundJobs.push({
              registrationId: reg.id,
              latestPayment,
              previousPaymentStatus: reg.paymentStatus,
              teamRevertInfo: {
                teamId: team.id,
                userId: data.userId,
                joinedAt: teamMember.joinedAt,
                captainId: team.captainId,
                isFull: team.isFull,
                teamWasDeleted,
                teamName: team.name,
                tournamentId: reg.tournament.id,
              },
            })
          }
        }
      } else {
        // SOLO format (or team with no team membership)
        if (reg.paymentRequiredSnapshot) {
          await prisma.$transaction(async tx => {
            await tx.tournamentRegistration.update({
              where: { id: reg.id },
              data: {
                status: RegistrationStatus.CANCELLED,
                paymentStatus: refundEligible
                  ? PaymentStatus.REFUNDED
                  : reg.paymentStatus,
                cancelledAt: new Date(),
                expiresAt: null,
              },
            })

            if (refundEligible && latestPayment) {
              await tx.payment.update({
                where: { id: latestPayment.id },
                data: {
                  status: PaymentStatus.REFUNDED,
                  refundAmount: computeRefundAmount(
                    latestPayment.amount,
                    latestPayment.stripeFee,
                  ),
                  refundedAt: new Date(),
                },
              })
            }
          })
        } else {
          await prisma.tournamentRegistration.delete({ where: { id: reg.id } })
        }

        if (refundEligible && latestPayment) {
          stripeRefundJobs.push({
            registrationId: reg.id,
            latestPayment,
            previousPaymentStatus: reg.paymentStatus,
          })
        }
      }
    }

    // Issue Stripe refunds after DB mutations (DB-first pattern)
    for (const job of stripeRefundJobs) {
      await issueStripeRefundAfterDbUpdate({
        registrationId: job.registrationId,
        latestPayment: job.latestPayment,
        previousPaymentStatus: job.previousPaymentStatus,
        idempotencyPrefix: 'ban-refund',
        onRevert: job.teamRevertInfo
          ? buildTeamRevertCallback(job.registrationId, job.teamRevertInfo)
          : undefined,
      })
    }

    updateTag(CACHE_TAGS.USERS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)
    updateTag(CACHE_TAGS.DASHBOARD_RECENT_USERS)
    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)

    const isBanPermanent = !data.bannedUntil
    return {
      success: true,
      message: isBanPermanent
        ? `${user.name} a été banni définitivement.`
        : `${user.name} a été banni jusqu'au ${formatDateTime(data.bannedUntil as string)}.`,
    }
  },
})

/** Lifts the ban on a user. */
export const unbanUser = authenticatedAction({
  schema: unbanUserSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { name: true, bannedAt: true },
    })

    if (!user) {
      return { success: false, message: 'Utilisateur introuvable.' }
    }

    if (!user.bannedAt) {
      return { success: false, message: `${user.name} n'est pas banni.` }
    }

    await prisma.user.update({
      where: { id: data.userId },
      data: { bannedAt: null, bannedUntil: null, banReason: null },
    })

    updateTag(CACHE_TAGS.USERS)
    updateTag(CACHE_TAGS.DASHBOARD_RECENT_USERS)

    return {
      success: true,
      message: `Le bannissement de ${user.name} a été levé.`,
    }
  },
})
