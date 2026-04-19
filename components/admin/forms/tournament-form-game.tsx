/**
 * File: components/admin/forms/tournament-form-game.tsx
 * Description: Game and format section of the tournament form.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Gamepad2 } from 'lucide-react'
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form'
import type { TournamentFormValues } from '@/components/admin/forms/tournament-form-types'
import {
  INPUT_CLASSES,
  LABEL_CLASSES,
  LockedIndicator,
  SECTION_CLASSES,
  SectionHeader,
} from '@/components/admin/forms/tournament-form-ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils/cn'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

interface TournamentFormGameProps {
  register: UseFormRegister<TournamentFormValues>
  errors: FieldErrors<TournamentFormValues>
  setValue: UseFormSetValue<TournamentFormValues>
  watchFormat: TournamentFormat
  isEditing: boolean
}

export const TournamentFormGame = ({
  register,
  errors,
  setValue,
  watchFormat,
  isEditing,
}: TournamentFormGameProps) => {
  const isTeam = watchFormat === TournamentFormat.TEAM

  return (
    <div className={SECTION_CLASSES}>
      <SectionHeader icon={Gamepad2} title="Jeu et format" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Game */}
        <div className="space-y-1.5">
          <Label htmlFor="tournament-game" className={LABEL_CLASSES}>
            Jeu
          </Label>
          <Input
            id="tournament-game"
            placeholder="Ex: League of Legends"
            className={INPUT_CLASSES}
            {...register('game')}
          />
          {errors.game?.message && (
            <p className="text-xs text-red-400">{errors.game.message}</p>
          )}
        </div>

        {/* Format */}
        <div className="space-y-1.5">
          <Label htmlFor="tournament-format" className={LABEL_CLASSES}>
            Format * {isEditing && <LockedIndicator />}
          </Label>
          <Select
            value={watchFormat}
            onValueChange={val =>
              setValue('format', val as TournamentFormat, {
                shouldValidate: true,
              })
            }
            disabled={isEditing}
          >
            <SelectTrigger
              id="tournament-format"
              className={cn(INPUT_CLASSES, 'w-full', isEditing && 'opacity-60')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TournamentFormat.SOLO}>Solo</SelectItem>
              <SelectItem value={TournamentFormat.TEAM}>Equipe</SelectItem>
            </SelectContent>
          </Select>
          {errors.format?.message && (
            <p className="text-xs text-red-400">{errors.format.message}</p>
          )}
        </div>

        {/* Team Size */}
        <div className="space-y-1.5">
          <Label htmlFor="tournament-teamSize" className={LABEL_CLASSES}>
            Taille d&apos;equipe *
          </Label>
          <Input
            id="tournament-teamSize"
            type="number"
            min={1}
            max={20}
            disabled={!isTeam}
            className={cn(INPUT_CLASSES, !isTeam && 'opacity-60')}
            {...register('teamSize', { valueAsNumber: true })}
          />
          {errors.teamSize?.message && (
            <p className="text-xs text-red-400">{errors.teamSize.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
