/**
 * File: lib/actions/registrations.ts
 * Description: Server actions for admin registration management.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { revalidateTag } from 'next/cache'
import { authenticatedAction } from '@/lib/actions/safe-action'
import { CACHE_TAGS } from '@/lib/config/constants'
import prisma from '@/lib/core/prisma'
import { getStripe } from '@/lib/core/stripe'
import type { ActionState } from '@/lib/types/actions'
import { syncTeamFullState } from '@/lib/utils/team'
import {
  changeTeamSchema,
  deleteRegistrationSchema,
  promoteCaptainSchema,
  refundRegistrationSchema,
  updateRegistrationFieldsSchema,
} from '@/lib/validations/registrations'
import {
  PaymentStatus,
  RegistrationStatus,
  Role,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

/** Registration with tournament info. Used by adminDeleteRegistration. */
type RegistrationWithDetails = {
  id: string
  userId: string
  paymentRequiredSnapshot: boolean
  paymentStatus: PaymentStatus
  payments: {
    id: string
    status: PaymentStatus
    amount: number
    stripePaymentIntentId: string | null
    stripeChargeId: string | null
  }[]
  tournament: { id: string; format: TournamentFormat }
  user: { name: string }
}

/** Team with ordered members. Used by adminDeleteRegistration. */
type TeamWithMembers = {
  id: string
  captainId: string
  tournament: { teamSize: number }
  members: { userId: string }[]
}

/** Team member with nested team (including members). Used by adminDeleteRegistration. */
type TeamMemberWithTeam = {
  userId: string
  team: TeamWithMembers
}

/** Forces deletion of a registration. */
export const adminDeleteRegistration = authenticatedAction({
  schema: deleteRegistrationSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    // 1. Fetch registration with tournament + user info
    const registration = (await prisma.tournamentRegistration.findUnique({
      where: { id: data.registrationId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        tournament: { select: { id: true, format: true } },
        user: { select: { name: true } },
      },
    })) as RegistrationWithDetails | null

    if (!registration) {
      return { success: false, message: 'Inscription introuvable.' }
    }

    // 2. SOLO format — just delete the registration
    if (registration.tournament.format === TournamentFormat.SOLO) {
      if (registration.paymentRequiredSnapshot) {
        await prisma.tournamentRegistration.update({
          where: { id: registration.id },
          data: {
            status: RegistrationStatus.CANCELLED,
            paymentStatus: registration.paymentStatus,
            cancelledAt: new Date(),
            teamId: null,
          },
        })
      } else {
        await prisma.tournamentRegistration.delete({
          where: { id: registration.id },
        })
      }

      revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
      revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
      revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

      return {
        success: true,
        message: `L'inscription de ${registration.user.name} a été supprimée.`,
      }
    }

    // 3. TEAM format — find team membership
    const teamMember = (await prisma.teamMember.findFirst({
      where: {
        userId: registration.userId,
        team: { tournamentId: registration.tournament.id },
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

    if (!teamMember) {
      // Edge case: registration exists but no team membership — clean up
      if (registration.paymentRequiredSnapshot) {
        await prisma.tournamentRegistration.update({
          where: { id: registration.id },
          data: {
            status: RegistrationStatus.CANCELLED,
            paymentStatus: registration.paymentStatus,
            cancelledAt: new Date(),
            teamId: null,
          },
        })
      } else {
        await prisma.tournamentRegistration.delete({
          where: { id: registration.id },
        })
      }

      revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
      revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
      revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

      return {
        success: true,
        message: `L'inscription de ${registration.user.name} a été supprimée.`,
      }
    }

    const team = teamMember.team
    const isCaptain = team.captainId === registration.userId
    const otherMembers = team.members.filter(
      m => m.userId !== registration.userId,
    )

    await prisma.$transaction(async tx => {
      // a. Remove team member record
      await tx.teamMember.deleteMany({
        where: { teamId: team.id, userId: registration.userId },
      })

      // b. Remove or cancel tournament registration depending on payment history
      if (registration.paymentRequiredSnapshot) {
        await tx.tournamentRegistration.update({
          where: { id: registration.id },
          data: {
            status: RegistrationStatus.CANCELLED,
            paymentStatus: registration.paymentStatus,
            cancelledAt: new Date(),
            teamId: null,
          },
        })
      } else {
        await tx.tournamentRegistration.delete({
          where: { id: registration.id },
        })
      }

      if (isCaptain && otherMembers.length > 0) {
        // c. Promote next member to captain
        const newCaptain = otherMembers[0]

        await tx.team.update({
          where: { id: team.id },
          data: { captainId: newCaptain.userId },
        })
        await syncTeamFullState(tx, team.id, team.tournament.teamSize)
      } else if (otherMembers.length === 0) {
        // d. Last member — dissolve the team
        await tx.team.delete({ where: { id: team.id } })
      } else {
        // e. Non-captain leaving — keep team state in sync
        await syncTeamFullState(tx, team.id, team.tournament.teamSize)
      }
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return {
      success: true,
      message: `L'inscription de ${registration.user.name} a été supprimée.`,
    }
  },
})

// ---------------------------------------------------------------------------
// adminUpdateRegistrationFields
// ---------------------------------------------------------------------------

/** Updates the custom field values (fieldValues JSON) on a registration. */
export const adminUpdateRegistrationFields = authenticatedAction({
  schema: updateRegistrationFieldsSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    const registration = (await prisma.tournamentRegistration.findUnique({
      where: { id: data.registrationId },
      include: {
        tournament: { select: { id: true } },
        user: { select: { name: true } },
      },
    })) as {
      id: string
      tournament: { id: string }
      user: { name: string }
    } | null

    if (!registration) {
      return { success: false, message: 'Inscription introuvable.' }
    }

    await prisma.tournamentRegistration.update({
      where: { id: registration.id },
      data: { fieldValues: data.fieldValues },
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')

    return {
      success: true,
      message: `Les champs de ${registration.user.name} ont été mis à jour.`,
    }
  },
})

/** Refunds a paid registration manually and cancels the player's registration. */
export const adminRefundRegistration = authenticatedAction({
  schema: refundRegistrationSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    const registration = (await prisma.tournamentRegistration.findUnique({
      where: { id: data.registrationId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        tournament: { select: { id: true, format: true } },
        user: { select: { name: true } },
      },
    })) as RegistrationWithDetails | null

    if (!registration) {
      return { success: false, message: 'Inscription introuvable.' }
    }

    if (
      !registration.paymentRequiredSnapshot ||
      registration.paymentStatus !== PaymentStatus.PAID
    ) {
      return {
        success: false,
        message: 'Cette inscription ne peut pas être remboursée.',
      }
    }

    const latestPayment = registration.payments[0]

    if (!latestPayment) {
      return {
        success: false,
        message: 'Aucun paiement Stripe associé à cette inscription.',
      }
    }

    if (!latestPayment.stripePaymentIntentId && !latestPayment.stripeChargeId) {
      return {
        success: false,
        message:
          'Aucune référence Stripe (PaymentIntent ou Charge) trouvée pour ce paiement.',
      }
    }

    const stripe = getStripe()

    await stripe.refunds.create(
      latestPayment.stripePaymentIntentId
        ? {
            payment_intent: latestPayment.stripePaymentIntentId,
            reason: 'requested_by_customer',
          }
        : {
            charge: latestPayment.stripeChargeId ?? undefined,
            reason: 'requested_by_customer',
          },
      {
        idempotencyKey: `admin-refund-${registration.id}-${latestPayment.id}`,
      },
    )

    if (registration.tournament.format === TournamentFormat.SOLO) {
      await prisma.$transaction(async tx => {
        await tx.payment.update({
          where: { id: latestPayment.id },
          data: {
            status: PaymentStatus.REFUNDED,
            refundAmount: latestPayment.amount,
            refundedAt: new Date(),
          },
        })

        await tx.tournamentRegistration.update({
          where: { id: registration.id },
          data: {
            status: RegistrationStatus.CANCELLED,
            paymentStatus: PaymentStatus.REFUNDED,
            cancelledAt: new Date(),
            teamId: null,
          },
        })
      })
    } else {
      const teamMember = (await prisma.teamMember.findFirst({
        where: {
          userId: registration.userId,
          team: { tournamentId: registration.tournament.id },
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

      if (!teamMember) {
        await prisma.$transaction(async tx => {
          await tx.payment.update({
            where: { id: latestPayment.id },
            data: {
              status: PaymentStatus.REFUNDED,
              refundAmount: latestPayment.amount,
              refundedAt: new Date(),
            },
          })

          await tx.tournamentRegistration.update({
            where: { id: registration.id },
            data: {
              status: RegistrationStatus.CANCELLED,
              paymentStatus: PaymentStatus.REFUNDED,
              cancelledAt: new Date(),
              teamId: null,
            },
          })
        })
      } else {
        const team = teamMember.team
        const isCaptain = team.captainId === registration.userId
        const otherMembers = team.members.filter(
          member => member.userId !== registration.userId,
        )

        await prisma.$transaction(async tx => {
          await tx.teamMember.deleteMany({
            where: { teamId: team.id, userId: registration.userId },
          })

          await tx.payment.update({
            where: { id: latestPayment.id },
            data: {
              status: PaymentStatus.REFUNDED,
              refundAmount: latestPayment.amount,
              refundedAt: new Date(),
            },
          })

          await tx.tournamentRegistration.update({
            where: { id: registration.id },
            data: {
              status: RegistrationStatus.CANCELLED,
              paymentStatus: PaymentStatus.REFUNDED,
              cancelledAt: new Date(),
              teamId: null,
            },
          })

          if (isCaptain && otherMembers.length > 0) {
            await tx.team.update({
              where: { id: team.id },
              data: { captainId: otherMembers[0].userId },
            })
            await syncTeamFullState(tx, team.id, team.tournament.teamSize)
          } else if (otherMembers.length === 0) {
            await tx.team.delete({ where: { id: team.id } })
          } else {
            await syncTeamFullState(tx, team.id, team.tournament.teamSize)
          }
        })
      }
    }

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_PAYMENTS, 'minutes')

    return {
      success: true,
      message: `L'inscription de ${registration.user.name} a été remboursée.`,
    }
  },
})

// ---------------------------------------------------------------------------
// adminChangeTeam
// ---------------------------------------------------------------------------

/** Registration with tournament + user info. Used by adminChangeTeam. */
type ChangeTeamRegistration = {
  id: string
  userId: string
  status: RegistrationStatus
  tournament: { id: string; format: TournamentFormat }
  user: { name: string }
}

/** Target team with members count. Used by adminChangeTeam. */
type TargetTeam = {
  id: string
  name: string
  tournamentId: string
  tournament: { teamSize: number }
  _count: { members: number }
}

/** Moves a player from their current team to a different team in the same tournament. */
export const adminChangeTeam = authenticatedAction({
  schema: changeTeamSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    // 1. Fetch registration
    const registration = (await prisma.tournamentRegistration.findUnique({
      where: { id: data.registrationId },
      include: {
        tournament: { select: { id: true, format: true } },
        user: { select: { name: true } },
      },
    })) as ChangeTeamRegistration | null

    if (!registration) {
      return { success: false, message: 'Inscription introuvable.' }
    }

    if (
      registration.status !== RegistrationStatus.PENDING &&
      registration.status !== RegistrationStatus.CONFIRMED
    ) {
      return {
        success: false,
        message: "Cette inscription n'est plus active.",
      }
    }

    if (registration.tournament.format !== TournamentFormat.TEAM) {
      return {
        success: false,
        message: "Ce tournoi n'est pas au format équipe.",
      }
    }

    // 2. Verify target team exists and belongs to the same tournament
    const targetTeam = (await prisma.team.findUnique({
      where: { id: data.targetTeamId },
      include: {
        tournament: { select: { teamSize: true } },
        _count: { select: { members: true } },
      },
    })) as TargetTeam | null

    if (!targetTeam) {
      return { success: false, message: 'Equipe cible introuvable.' }
    }

    if (targetTeam.tournamentId !== registration.tournament.id) {
      return {
        success: false,
        message: "L'equipe cible n'appartient pas au même tournoi.",
      }
    }

    if (targetTeam._count.members >= targetTeam.tournament.teamSize) {
      return { success: false, message: "L'equipe cible est déjà complète." }
    }

    // 3. Find current team membership
    const currentMember = (await prisma.teamMember.findFirst({
      where: {
        userId: registration.userId,
        team: { tournamentId: registration.tournament.id },
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

    if (!currentMember) {
      return {
        success: false,
        message: "Le joueur n'appartient à aucune equipe.",
      }
    }

    if (currentMember.team.id === data.targetTeamId) {
      return {
        success: false,
        message: 'Le joueur est déjà dans cette equipe.',
      }
    }

    const oldTeam = currentMember.team
    const wasCaptain = oldTeam.captainId === registration.userId
    const otherMembers = oldTeam.members.filter(
      m => m.userId !== registration.userId,
    )

    // 4. Execute in a transaction
    await prisma.$transaction(async tx => {
      // a. Remove from old team
      await tx.teamMember.deleteMany({
        where: { teamId: oldTeam.id, userId: registration.userId },
      })

      // b. Handle captain succession on old team
      if (wasCaptain && otherMembers.length > 0) {
        const newCaptain = otherMembers[0]

        await tx.team.update({
          where: { id: oldTeam.id },
          data: { captainId: newCaptain.userId },
        })
        await syncTeamFullState(tx, oldTeam.id, oldTeam.tournament.teamSize)
      } else if (otherMembers.length === 0) {
        await tx.team.delete({ where: { id: oldTeam.id } })
      } else {
        // Non-captain leaving old team
        await syncTeamFullState(tx, oldTeam.id, oldTeam.tournament.teamSize)
      }

      // c. Add to new team
      await tx.teamMember.create({
        data: { teamId: data.targetTeamId, userId: registration.userId },
      })

      await tx.tournamentRegistration.update({
        where: { id: registration.id },
        data: { teamId: data.targetTeamId },
      })

      await syncTeamFullState(
        tx,
        data.targetTeamId,
        targetTeam.tournament.teamSize,
      )
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return {
      success: true,
      message: `${registration.user.name} a été déplacé vers ${targetTeam.name}.`,
    }
  },
})

// ---------------------------------------------------------------------------
// adminPromoteCaptain
// ---------------------------------------------------------------------------

/** Team with captain + members info. Used by adminPromoteCaptain. */
type PromoteTeam = {
  id: string
  captainId: string
  tournamentId: string
  members: { userId: string }[]
}

/** Promotes a team member to captain. */
export const adminPromoteCaptain = authenticatedAction({
  schema: promoteCaptainSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    // 1. Fetch the team
    const team = (await prisma.team.findUnique({
      where: { id: data.teamId },
      include: { members: { select: { userId: true } } },
    })) as PromoteTeam | null

    if (!team) {
      return { success: false, message: 'Equipe introuvable.' }
    }

    // 2. Verify the user is a member of this team
    const isMember = team.members.some(m => m.userId === data.userId)
    if (!isMember) {
      return {
        success: false,
        message: "L'utilisateur n'est pas membre de cette equipe.",
      }
    }

    // 3. Verify user is not already captain
    if (team.captainId === data.userId) {
      return { success: false, message: "L'utilisateur est déjà capitaine." }
    }

    await prisma.team.update({
      where: { id: team.id },
      data: { captainId: data.userId },
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return {
      success: true,
      message: 'Le capitaine a été mis à jour.',
    }
  },
})
