/**
 * File: app/admin/tournaments/[id]/edit/page.tsx
 * Description: Page for editing an existing tournament.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { notFound } from 'next/navigation'
import type { z } from 'zod'
import { TournamentForm } from '@/components/features/tournament/form/tournament-form'
import { updateTournament } from '@/lib/actions/tournament'
import prisma from '@/lib/core/db'
import { fr } from '@/lib/i18n/dictionaries/fr'
import type { tournamentSchema } from '@/lib/validations/tournament'

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

export const dynamic = 'force-dynamic'

const getTournament = async (id: string) => {
  return await prisma.tournament.findUnique({
    where: { id },
    include: {
      fields: {
        orderBy: { order: 'asc' },
      },
    },
  })
}

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const EditTournamentPage = async ({
  params,
}: {
  params: Promise<{ id: string }>
}) => {
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

  /*
    Wrap the server action to match the form's onSubmit signature.
    The form passes `values`, but `updateTournament` needs `{ id, data: values }`.
  */
  const updateAction = async (values: z.infer<typeof tournamentSchema>) => {
    'use server'
    return await updateTournament({ id: tournament.id, data: values })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-3xl text-white">
          {fr.pages.admin.tournaments.form.editTitle}
        </h1>
      </div>
      <TournamentForm
        initialData={initialData}
        onSubmit={updateAction}
        submitLabel={fr.pages.admin.tournaments.form.editSubtitle}
      />
    </div>
  )
}

export default EditTournamentPage
