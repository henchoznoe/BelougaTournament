/**
 * File: lib/actions/tournaments.ts
 * Description: Server actions for creating, updating, and deleting tournaments.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const tournamentSchema = z.object({
	description: z.string().min(10, 'Description must be at least 10 characters'),
	endDate: z.date(),
	fields: z.array(
		z.object({
			id: z.string().optional(),
			label: z.string().min(1, 'Label is required'),
			required: z.boolean().default(true),
			type: z.enum([
				'TEXT',
				'NUMBER',
				'SELECT',
				'CHECKBOX',
				'DISCORD_ID',
				'RIOT_ID',
			]),
		}),
	),
	format: z.enum(['SOLO', 'TEAM']),
	maxParticipants: z.coerce.number().optional(),
	registrationClose: z.date(),
	registrationOpen: z.date(),
	slug: z.string().min(3, 'Slug must be at least 3 characters'),
	startDate: z.date(),
	streamUrl: z.string().url().optional().or(z.literal('')),
	teamSize: z.coerce.number().min(1),
	title: z.string().min(3, 'Title must be at least 3 characters'),
})

export type CreateTournamentState = {
	errors?: {
		[key: string]: string[]
	}
	message?: string
}

export async function createTournament(
	prevState: CreateTournamentState,
	formData: FormData,
) {
	// Extract fields from formData since nested arrays are tricky with standard FormData
	// We expect the client to send a JSON string for 'fields' or handle it differently.
	// For simplicity in this server action, we'll assume the client sends standard FormData
	// and we might need to parse the fields manually if they are sent as `fields[0][label]`.
	// However, a cleaner approach with Shadcn forms is often to just pass the raw data object if using a client component wrapper,
	// OR strictly parse FormData.

	// Let's try to parse the FormData into a raw object first to handle the array structure if possible,
	// but standard FormData doesn't handle nested arrays well without a library like `zod-form-data` or manual parsing.
	// For this implementation, we will assume the client component submits a JSON string for the 'fields' array
	// OR we iterate over keys.

	// ACTUALLY, simpler approach for Server Actions + Complex Forms:
	// The client component will likely use `useForm` and call this action directly with the data object,
	// NOT via a native <form action={...}> submission which limits us to FormData.
	// BUT, Server Actions called from `action={...}` MUST receive FormData.
	// So we will define this function to accept the raw data object directly, and call it from the client's `onSubmit`.

	return { message: 'Use the direct version of this action' }
}

// Direct action to be called from client component's onSubmit
export async function createTournamentDirect(
	data: z.infer<typeof tournamentSchema>,
) {
	const validatedFields = tournamentSchema.safeParse(data)

	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: 'Validation Error',
		}
	}

	const { fields, ...tournamentData } = validatedFields.data

	try {
		await prisma.$transaction(async tx => {
			const tournament = await tx.tournament.create({
				data: {
					...tournamentData,
					fields: {
						create: fields.map((field, index) => ({
							...field,
							order: index,
						})),
					},
				},
			})
		})
	} catch (error) {
		console.error('Database Error:', error)
		return {
			message: 'Database Error: Failed to create tournament.',
		}
	}

	revalidatePath('/admin/tournaments')
	redirect('/admin/tournaments')
}

export async function deleteTournament(id: string) {
	try {
		await prisma.tournament.delete({
			where: { id },
		})
	} catch (error) {
		console.error('Delete Error:', error)
		// In a real app, we might want to return an error state
	}

	revalidatePath('/admin/tournaments')
}

export async function updateTournament(
	id: string,
	data: z.infer<typeof tournamentSchema>,
) {
	const validatedFields = tournamentSchema.safeParse(data)

	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: 'Validation Error',
		}
	}

	const { fields, ...tournamentData } = validatedFields.data

	try {
		await prisma.$transaction(async tx => {
			// 1. Fetch existing fields to check for deletions and data integrity
			const existingFields = await tx.tournamentField.findMany({
				where: { tournamentId: id },
				include: {
					_count: {
						select: { playerData: true },
					},
				},
			})

			const inputFieldIds = new Set(
				fields.filter(f => f.id).map(f => f.id as string),
			)

			// 2. Identify fields to delete
			const fieldsToDelete = existingFields.filter(
				f => !inputFieldIds.has(f.id),
			)

			// 3. Check if any field to be deleted has associated data
			for (const field of fieldsToDelete) {
				if (field._count.playerData > 0) {
					throw new Error(
						`Cannot remove field "${field.label}" as it contains user data.`,
					)
				}
			}

			// 4. Update Tournament Basic Info
			await tx.tournament.update({
				where: { id },
				data: tournamentData,
			})

			// 5. Delete safe fields
			if (fieldsToDelete.length > 0) {
				await tx.tournamentField.deleteMany({
					where: {
						id: { in: fieldsToDelete.map(f => f.id) },
					},
				})
			}

			// 6. Upsert fields (Update existing, Create new)
			// We iterate to maintain the order from the form
			for (let i = 0; i < fields.length; i++) {
				const field = fields[i]

				if (field.id) {
					// Update existing field
					await tx.tournamentField.update({
						where: { id: field.id },
						data: {
							label: field.label,
							required: field.required,
							type: field.type,
							order: i,
						},
					})
				} else {
					// Create new field
					await tx.tournamentField.create({
						data: {
							label: field.label,
							required: field.required,
							type: field.type,
							order: i,
							tournamentId: id,
						},
					})
				}
			}
		})
	} catch (error) {
		console.error('Update Error:', error)
		// Return specific error message if it was a validation error we threw
		if (error instanceof Error && error.message.includes('Cannot remove field')) {
			return { message: error.message }
		}
		return { message: 'Failed to update tournament.' }
	}

	revalidatePath('/admin/tournaments')
	revalidatePath(`/admin/tournaments/${id}`)
	redirect('/admin/tournaments')
}
