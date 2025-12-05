/**
 * File: app/admin/tournaments/[id]/edit/page.tsx
 * Description: Page for editing an existing tournament.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { notFound } from 'next/navigation'
import { TournamentForm } from '@/components/admin/tournament-form'
import { updateTournament } from '@/lib/actions/tournaments'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getTournament(id: string) {
    return await prisma.tournament.findUnique({
        where: { id },
        include: {
            fields: {
                orderBy: { order: 'asc' },
            },
        },
    })
}

export default async function EditTournamentPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const tournament = await getTournament(id)

    if (!tournament) {
        notFound()
    }

    // Transform data to match form schema
    const initialData = {
        ...tournament,
        maxParticipants: tournament.maxParticipants || undefined,
        streamUrl: tournament.streamUrl || undefined,
        fields: tournament.fields.map(f => ({
            id: f.id,
            label: f.label,
            type: f.type,
            required: f.required,
        })),
    }

    const updateAction = updateTournament.bind(null, tournament.id)

    return (
        <div className="mx-auto max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="font-bold text-3xl text-white">
                    Edit Tournament
                </h1>
            </div>
            <TournamentForm
                initialData={initialData}
                onSubmit={updateAction}
                submitLabel="Update Tournament"
            />
        </div>
    )
}
