/**
 * File: components/features/admin/tournament-form/tournament-format-section.tsx
 * Description: Format section (format type, team size, max teams) of the tournament form.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { UseFormReturn } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { TournamentFormField } from '@/components/features/admin/tournament-form/tournament-form-field'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils/cn'
import type { TournamentFormInput } from '@/lib/validations/tournaments'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

interface TournamentFormatSectionProps {
  form: UseFormReturn<TournamentFormInput>
  isPending: boolean
  isEditing: boolean
}

export const TournamentFormatSection = ({
  form,
  isPending,
  isEditing,
}: TournamentFormatSectionProps) => {
  const {
    register,
    setValue,
    formState: { errors },
    control,
  } = form

  const format = useWatch({ control, name: 'format' })
  const isSolo = format === TournamentFormat.SOLO

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
        Format
      </h3>
      <div
        className={cn(
          'grid gap-4',
          isSolo ? 'sm:grid-cols-2' : 'sm:grid-cols-3',
        )}
      >
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-zinc-400">
            Type de format
          </Label>
          <Select
            value={format}
            onValueChange={val => {
              setValue('format', val as TournamentFormat, {
                shouldDirty: true,
              })
              if (val === TournamentFormat.SOLO) {
                setValue('teamSize', 1, { shouldDirty: true })
              }
            }}
            disabled={isPending || isEditing}
          >
            <SelectTrigger className="h-10 w-full rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TournamentFormat.SOLO}>Solo</SelectItem>
              <SelectItem value={TournamentFormat.TEAM}>Équipe</SelectItem>
            </SelectContent>
          </Select>
          {isEditing && (
            <p className="text-xs text-zinc-500">
              Le format ne peut pas être modifié après la création.
            </p>
          )}
          {errors.format?.message && (
            <p className="text-xs text-red-400">{errors.format.message}</p>
          )}
        </div>
        {!isSolo && (
          <TournamentFormField
            id="teamSize"
            label="Taille d'équipe"
            type="number"
            placeholder="1"
            error={errors.teamSize?.message}
            disabled={isPending}
            {...register('teamSize', { valueAsNumber: true })}
          />
        )}
        <div className="space-y-1.5">
          <TournamentFormField
            id="maxTeams"
            label={isSolo ? 'Nombre max. de joueurs' : "Nombre max. d'équipes"}
            type="number"
            placeholder="Illimité"
            error={errors.maxTeams?.message}
            disabled={isPending}
            {...register('maxTeams', {
              setValueAs: (v: string) =>
                v === '' || v === undefined ? null : Number(v),
            })}
          />
          <p className="text-xs text-zinc-500">Si vide, places illimitées.</p>
        </div>
      </div>
    </div>
  )
}
