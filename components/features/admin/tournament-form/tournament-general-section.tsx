/**
 * File: components/features/admin/tournament-form/tournament-general-section.tsx
 * Description: General information section (title, slug, description, game) of the tournament form.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { UseFormReturn } from 'react-hook-form'
import { TournamentFormField } from '@/components/features/admin/tournament-form/tournament-form-field'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { TournamentFormInput } from '@/lib/validations/tournaments'

interface TournamentGeneralSectionProps {
  form: UseFormReturn<TournamentFormInput>
  isPending: boolean
  isEditing: boolean
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const TournamentGeneralSection = ({
  form,
  isPending,
  onTitleChange,
}: TournamentGeneralSectionProps) => {
  const {
    register,
    formState: { errors },
  } = form

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
        Informations générales
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <TournamentFormField
          id="title"
          label="Titre"
          placeholder="Coupe Belouga #1"
          error={errors.title?.message}
          disabled={isPending}
          {...register('title', { onChange: onTitleChange })}
        />
        <TournamentFormField
          id="slug"
          label="Slug (URL)"
          placeholder="coupe-belouga-1"
          error={errors.slug?.message}
          disabled={isPending}
          {...register('slug')}
        />
      </div>
      <div className="space-y-1.5">
        <Label
          htmlFor="description"
          className="text-xs font-medium text-zinc-400"
        >
          Description
        </Label>
        <Textarea
          id="description"
          placeholder="Décrivez le tournoi..."
          disabled={isPending}
          className="min-h-24 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20"
          {...register('description')}
        />
        {errors.description?.message && (
          <p className="text-xs text-red-400">{errors.description.message}</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TournamentFormField
          id="game"
          label="Jeu"
          placeholder="Rocket League"
          error={errors.game?.message}
          disabled={isPending}
          {...register('game')}
        />
      </div>
    </div>
  )
}
