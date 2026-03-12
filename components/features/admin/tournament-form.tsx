/**
 * File: components/features/admin/tournament-form.tsx
 * Description: Orchestrator form for creating or editing a tournament, composing section sub-components.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { TournamentDatesSection } from '@/components/features/admin/tournament-form/tournament-dates-section'
import { TournamentFieldsSection } from '@/components/features/admin/tournament-form/tournament-fields-section'
import { TournamentFormatSection } from '@/components/features/admin/tournament-form/tournament-format-section'
import { TournamentGeneralSection } from '@/components/features/admin/tournament-form/tournament-general-section'
import { TournamentLinksSection } from '@/components/features/admin/tournament-form/tournament-links-section'
import { TournamentRulesSection } from '@/components/features/admin/tournament-form/tournament-rules-section'
import { Button } from '@/components/ui/button'
import { createTournament, updateTournament } from '@/lib/actions/tournaments'
import { ROUTES } from '@/lib/config/routes'
import type { TournamentDetail } from '@/lib/types/tournament'
import { fromNullable } from '@/lib/utils/formatting'
import {
  type TournamentFormInput,
  type TournamentInput,
  tournamentSchema,
} from '@/lib/validations/tournaments'
import {
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

interface TournamentFormProps {
  tournament?: TournamentDetail
}

/** Generates a slug from a title. */
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const TournamentForm = ({ tournament }: TournamentFormProps) => {
  const isEditing = !!tournament
  const fieldsLocked =
    isEditing &&
    tournament.status === TournamentStatus.PUBLISHED &&
    tournament._count.registrations > 0
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<TournamentFormInput>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: tournament
      ? {
          title: tournament.title,
          slug: tournament.slug,
          description: tournament.description,
          startDate: new Date(tournament.startDate).toISOString(),
          endDate: new Date(tournament.endDate).toISOString(),
          registrationOpen: new Date(tournament.registrationOpen).toISOString(),
          registrationClose: new Date(
            tournament.registrationClose,
          ).toISOString(),
          maxTeams: tournament.maxTeams,
          format: tournament.format,
          teamSize: tournament.teamSize,
          game: fromNullable(tournament.game),
          rules: fromNullable(tournament.rules),
          prize: fromNullable(tournament.prize),
          toornamentId: fromNullable(tournament.toornamentId),
          streamUrl: fromNullable(tournament.streamUrl),
          fields: tournament.fields.map(f => ({
            id: f.id,
            label: f.label,
            type: f.type,
            required: f.required,
            order: f.order,
          })),
          toornamentStages: tournament.toornamentStages.map(s => ({
            id: s.id,
            name: s.name,
            stageId: s.stageId,
            number: s.number,
          })),
        }
      : {
          title: '',
          slug: '',
          description: '',
          startDate: '',
          endDate: '',
          registrationOpen: '',
          registrationClose: '',
          maxTeams: null,
          format: TournamentFormat.SOLO,
          teamSize: 1,
          game: '',
          rules: '',
          prize: '',
          toornamentId: '',
          streamUrl: '',
          fields: [],
          toornamentStages: [],
        },
  })

  const { isDirty } = form.formState

  const onSubmit = (data: TournamentFormInput) => {
    // Date fields are already ISO strings from the DateTimePicker
    const payload = data as TournamentInput

    startTransition(async () => {
      const result = isEditing
        ? await updateTournament({ ...payload, id: tournament.id })
        : await createTournament(payload)

      if (result.success) {
        toast.success(result.message)
        router.push(ROUTES.ADMIN_TOURNAMENTS)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    if (!isEditing) {
      form.setValue('slug', slugify(title), {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-8 rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm"
    >
      <TournamentGeneralSection
        form={form}
        isPending={isPending}
        isEditing={isEditing}
        onTitleChange={handleTitleChange}
      />

      <div className="h-px bg-white/5" />

      <TournamentFormatSection
        form={form}
        isPending={isPending}
        isEditing={isEditing}
      />

      <div className="h-px bg-white/5" />

      <TournamentDatesSection form={form} isPending={isPending} />

      <div className="h-px bg-white/5" />

      <TournamentRulesSection form={form} isPending={isPending} />

      <div className="h-px bg-white/5" />

      <TournamentLinksSection form={form} isPending={isPending} />

      <div className="h-px bg-white/5" />

      <TournamentFieldsSection
        form={form}
        isPending={isPending}
        fieldsLocked={fieldsLocked}
      />

      <div className="h-px bg-white/5" />

      {/* Submit */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          asChild
          className="gap-2 text-zinc-400"
        >
          <Link href={ROUTES.ADMIN_TOURNAMENTS}>
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        </Button>
        <Button
          type="submit"
          disabled={isPending || (!isDirty && isEditing)}
          className="gap-2 bg-blue-600 text-white hover:bg-blue-500"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {isEditing ? 'Enregistrer' : 'Créer le tournoi'}
        </Button>
      </div>
    </form>
  )
}
