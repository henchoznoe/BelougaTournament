/**
 * File: components/admin/forms/tournament-form-stages.tsx
 * Description: Toornament integration section of the tournament form (ID + stages).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ChevronDown, ChevronUp, Layers, Plus, Trash2 } from 'lucide-react'
import {
  type Control,
  type FieldErrors,
  type UseFormRegister,
  useFieldArray,
} from 'react-hook-form'
import type { TournamentFormValues } from '@/components/admin/forms/tournament-form-types'
import {
  INPUT_CLASSES,
  LABEL_CLASSES,
  SECTION_CLASSES,
  SectionHeader,
} from '@/components/admin/forms/tournament-form-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/cn'

interface TournamentFormStagesProps {
  control: Control<TournamentFormValues>
  register: UseFormRegister<TournamentFormValues>
  errors: FieldErrors<TournamentFormValues>
}

export const TournamentFormStages = ({
  control,
  register,
  errors,
}: TournamentFormStagesProps) => {
  const {
    fields: stageArrayFields,
    append: appendStage,
    remove: removeStage,
    move: moveStage,
  } = useFieldArray({ control, name: 'toornamentStages' })

  return (
    <div className={SECTION_CLASSES}>
      <SectionHeader icon={Layers} title="Integration Toornament" />
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="tournament-toornamentId" className={LABEL_CLASSES}>
            ID Toornament
          </Label>
          <Input
            id="tournament-toornamentId"
            placeholder="ID du tournoi sur Toornament.com"
            className={INPUT_CLASSES}
            {...register('toornamentId')}
          />
          <p className="text-[10px] text-zinc-600">
            Trouvable dans l&apos;URL du tournoi sur toornament.com (ex:
            toornament.com/tournaments/
            <strong>ID</strong>/information).
          </p>
          {errors.toornamentId?.message && (
            <p className="text-xs text-red-400">
              {errors.toornamentId.message}
            </p>
          )}
        </div>

        {/* Stages */}
        <div className="space-y-3">
          <Label className={LABEL_CLASSES}>Stages</Label>
          {stageArrayFields.map((stage, index) => (
            <div
              key={stage.id}
              className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/2 p-3"
            >
              <div className="mt-1 flex shrink-0 flex-col gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === 0}
                  onClick={() => moveStage(index, index - 1)}
                  className="text-zinc-500 hover:text-zinc-300"
                  aria-label="Monter le stage"
                >
                  <ChevronUp className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === stageArrayFields.length - 1}
                  onClick={() => moveStage(index, index + 1)}
                  className="text-zinc-500 hover:text-zinc-300"
                  aria-label="Descendre le stage"
                >
                  <ChevronDown className="size-3" />
                </Button>
              </div>
              <div className="grid flex-1 gap-3 sm:grid-cols-3">
                <Input
                  placeholder="Nom du stage"
                  aria-label={`Nom du stage ${index + 1}`}
                  className={cn(INPUT_CLASSES, 'h-9 text-xs')}
                  {...register(`toornamentStages.${index}.name`)}
                />
                <Input
                  placeholder="ID du stage (depuis Toornament)"
                  aria-label={`ID du stage ${index + 1}`}
                  className={cn(INPUT_CLASSES, 'h-9 font-mono text-xs')}
                  {...register(`toornamentStages.${index}.stageId`)}
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">#{index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStage(index)}
                    className="size-8 p-0 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Supprimer le stage"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {errors.toornamentStages?.message && (
            <p className="text-xs text-red-400">
              {errors.toornamentStages.message}
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendStage({
                name: '',
                stageId: '',
                number: stageArrayFields.length,
              })
            }
            className="gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            <Plus className="size-3.5" />
            Ajouter un stage
          </Button>
        </div>
      </div>
    </div>
  )
}
