'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// We can't statically define the schema here because it depends on the tournament fields.
// We will validate the structure of the incoming data, and then validate the dynamic fields against the DB.

const baseRegistrationSchema = z.object({
	contactEmail: z.string().email(),
	players: z
		.array(
			z.object({
				data: z.record(z.string(), z.string()), // fieldId -> value
				isCaptain: z.boolean().default(false),
				nickname: z.string().min(1, 'Nickname is required'),
			}),
		)
		.min(1, 'At least one player is required'),
	teamName: z.string().optional(),
	tournamentId: z.string().uuid(),
})

export type RegistrationState = {
	errors?: {
		[key: string]: string[]
	}
	message?: string
}

export async function registerForTournament(
	data: z.infer<typeof baseRegistrationSchema>,
) {
	const validation = baseRegistrationSchema.safeParse(data)

	if (!validation.success) {
		return {
			errors: validation.error.flatten().fieldErrors,
			message: 'Invalid submission data.',
		}
	}

	const { tournamentId, teamName, contactEmail, players } = validation.data

	// 1. Fetch Tournament and Fields to validate constraints
	const tournament = await prisma.tournament.findUnique({
		include: { fields: true },
		where: { id: tournamentId },
	})

	if (!tournament) {
		return { message: 'Tournament not found.' }
	}

	// Check if registration is open
	const now = new Date()
	if (now < tournament.registrationOpen || now > tournament.registrationClose) {
		return { message: 'Registration is closed.' }
	}

	// Check max participants (simplified check, ideally needs locking or atomic increment)
	// For TEAM format, maxParticipants usually means max Teams. For SOLO, max Players.
	const currentRegistrations = await prisma.registration.count({
		where: { tournamentId },
	})

	if (
		tournament.maxParticipants &&
		currentRegistrations >= tournament.maxParticipants
	) {
		return { message: 'Tournament is full.' }
	}

	// Validate Dynamic Fields for each player
	for (const player of players) {
		for (const field of tournament.fields) {
			const value = player.data[field.id]

			if (field.required && (!value || value.trim() === '')) {
				return {
					message: `Missing required field: ${field.label} for player ${player.nickname}`,
				}
			}

			// Basic type validation could go here (e.g. is it a number?)
		}
	}

	try {
		await prisma.$transaction(async tx => {
			// Create Registration
			const registration = await tx.registration.create({
				data: {
					contactEmail,
					status: 'PENDING',
					teamName: tournament.format === 'TEAM' ? teamName : undefined,
					tournamentId,
				},
			})

			// Create Players and Data
			for (const player of players) {
				const createdPlayer = await tx.player.create({
					data: {
						isCaptain: player.isCaptain,
						nickname: player.nickname,
						registrationId: registration.id,
					},
				})

				// Create PlayerData
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
			}
		})
	} catch (error) {
		console.error('Registration Error:', error)
		return { message: 'Failed to process registration. Please try again.' }
	}

	revalidatePath(`/tournaments/${tournament.slug}`)
	redirect(`/tournaments/${tournament.slug}?success=true`)
}
