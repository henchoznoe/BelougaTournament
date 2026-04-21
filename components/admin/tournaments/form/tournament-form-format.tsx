/**
 * File: components/admin/tournaments/form/tournament-form-format.tsx
 * Description: Format and registrations section of the tournament form (format, team size, max teams, team logo).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Users } from 'lucide-react'
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form'
import {
  INPUT_CLASSES,
  LABEL_CLASSES,
  LockedIndicator,
  SECTION_CLASSES,
  SectionHeader,
} from '@/components/admin/tournaments/form/tournament-form-ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { VALIDATION_LIMITS } from '@/lib/config/constants'
import type { TournamentFormValues } from '@/lib/types/tournament-form'
import { cn } from '@/lib/utils/cn'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

interface TournamentFormFormatProps {
  register: UseFormRegister<TournamentFormValues>
  errors: FieldErrors<TournamentFormValues>
  setValue: UseFormSetValue<TournamentFormValues>
  watchFormat: TournamentFormat
  watchMaxTeams: number | null
  watchTeamLogoEnabled: boolean
  isEditing: boolean
}

export const TournamentFormFormat = ({
  register,
  errors,
  setValue,
  watchFormat,
  watchMaxTeams,
  watchTeamLogoEnabled,
  isEditing,
}: TournamentFormFormatProps) => {
  const isTeam = watchFormat === TournamentFormat.TEAM

  return (
    <div className={SECTION_CLASSES}>
      <SectionHeader icon={Users} title="Format et inscriptions" />
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Format */}
          <div className="space-y-1.5">
            <Label htmlFor="tournament-format" className={LABEL_CLASSES}>
              Format * {isEditing && <LockedIndicator />}
            </Label>
            <Select
              value={watchFormat}
              onValueChange={val => {
                if (
                  val === TournamentFormat.SOLO ||
                  val === TournamentFormat.TEAM
                ) {
                  setValue('format', val, { shouldValidate: true })
                }
              }}
              disabled={isEditing}
            >
              <SelectTrigger
                id="tournament-format"
                className={cn(
                  INPUT_CLASSES,
                  'w-full',
                  isEditing && 'opacity-60',
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TournamentFormat.SOLO}>Solo</SelectItem>
                <SelectItem value={TournamentFormat.TEAM}>Équipe</SelectItem>
              </SelectContent>
            </Select>
            {errors.format?.message && (
              <p className="text-xs text-red-400">{errors.format.message}</p>
            )}
          </div>

          {/* Team Size */}
          <div className="space-y-1.5">
            <Label htmlFor="tournament-teamSize" className={LABEL_CLASSES}>
              Taille d&apos;équipe *
            </Label>
            <Input
              id="tournament-teamSize"
              type="number"
              min={VALIDATION_LIMITS.TEAM_SIZE_MIN}
              max={VALIDATION_LIMITS.TEAM_SIZE_MAX}
              disabled={!isTeam}
              className={cn(INPUT_CLASSES, !isTeam && 'opacity-60')}
              {...register('teamSize', { valueAsNumber: true })}
            />
            {errors.teamSize?.message && (
              <p className="text-xs text-red-400">{errors.teamSize.message}</p>
            )}
          </div>

          {/* Max Teams */}
          <div className="space-y-1.5">
            <Label htmlFor="tournament-maxTeams" className={LABEL_CLASSES}>
              Nombre d'équipe max
            </Label>
            <Input
              id="tournament-maxTeams"
              type="number"
              min={2}
              placeholder="Illimité"
              className={INPUT_CLASSES}
              value={watchMaxTeams ?? ''}
              onChange={e => {
                const val =
                  e.target.value === '' ? null : Number(e.target.value)
                setValue('maxTeams', val, { shouldValidate: true })
              }}
            />
            {errors.maxTeams?.message && (
              <p className="text-xs text-red-400">{errors.maxTeams.message}</p>
            )}
          </div>
        </div>

        {/* Team logo toggle (only for team format) */}
        {isTeam && (
          <div className="flex items-center gap-3">
            <Switch
              id="tournament-teamLogoEnabled"
              checked={watchTeamLogoEnabled}
              onCheckedChange={val =>
                setValue('teamLogoEnabled', val, { shouldValidate: true })
              }
            />
            <Label
              htmlFor="tournament-teamLogoEnabled"
              className="cursor-pointer text-sm text-zinc-300"
            >
              Autoriser les capitaines d'équipe à uploader un logo d&apos;équipe
            </Label>
          </div>
        )}
      </div>
    </div>
  )
}
