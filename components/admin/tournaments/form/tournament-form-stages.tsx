/**
 * File: components/admin/tournaments/form/tournament-form-stages.tsx
 * Description: Toornament integration section of the tournament form (ID + stages).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Layers, Plus } from 'lucide-react'
import {
  type Control,
  type FieldErrors,
  type UseFormRegister,
  useFieldArray,
} from 'react-hook-form'
import { OrderableItem } from '@/components/admin/tournaments/form/tournament-form-orderable-item'
import {
  INPUT_CLASSES,
  LABEL_CLASSES,
  SECTION_CLASSES,
  SectionHeader,
} from '@/components/admin/tournaments/form/tournament-form-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TournamentFormValues } from '@/lib/types/tournament-form'
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
      <SectionHeader icon={Layers} title="Intégration Toornament" />
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
        <div className="space-y-2">
          <Label className={LABEL_CLASSES}>Stages</Label>
          {stageArrayFields.map((stage, index) => (
            <OrderableItem
              key={stage.id}
              index={index}
              total={stageArrayFields.length}
              onMoveUp={() => moveStage(index, index - 1)}
              onMoveDown={() => moveStage(index, index + 1)}
              onRemove={() => removeStage(index)}
              removeLabel={`Supprimer le stage ${index + 1}`}
            >
              <div className="grid items-center gap-3 sm:grid-cols-2">
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
              </div>
            </OrderableItem>
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
            className="mt-1 gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            <Plus className="size-3.5" />
            Ajouter un stage
          </Button>
        </div>
      </div>
    </div>
  )
}
