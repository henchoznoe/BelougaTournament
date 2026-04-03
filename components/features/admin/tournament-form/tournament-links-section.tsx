/**
 * File: components/features/admin/tournament-form/tournament-links-section.tsx
 * Description: Links, integrations, and Toornament stages section of the tournament form.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { useFieldArray, useWatch } from 'react-hook-form'
import { TournamentFormField } from '@/components/features/admin/tournament-form/tournament-form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { TournamentFormInput } from '@/lib/validations/tournaments'

interface TournamentLinksSectionProps {
  form: UseFormReturn<TournamentFormInput>
  isPending: boolean
}

export const TournamentLinksSection = ({
  form,
  isPending,
}: TournamentLinksSectionProps) => {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = form

  const {
    fields: stageFields,
    append: appendStage,
    remove: removeStage,
    move: moveStage,
  } = useFieldArray({
    control,
    name: 'toornamentStages',
  })

  const toornamentIdValue = useWatch({ control, name: 'toornamentId' }) ?? ''

  const addStage = () => {
    appendStage({
      name: '',
      stageId: '',
      number: stageFields.length,
    })
  }

  const moveStageItem = (from: number, to: number) => {
    if (to < 0 || to >= stageFields.length) return
    moveStage(from, to)
    // Update number values after move
    for (let i = 0; i < stageFields.length; i++) {
      setValue(`toornamentStages.${i}.number`, i)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
        Liens & intégrations
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <TournamentFormField
          id="toornamentId"
          label="ID Toornament"
          placeholder="1234567890"
          error={errors.toornamentId?.message}
          disabled={isPending}
          {...register('toornamentId')}
        />
        <TournamentFormField
          id="streamUrl"
          label="URL du stream"
          placeholder="https://twitch.tv/..."
          error={errors.streamUrl?.message}
          disabled={isPending}
          {...register('streamUrl')}
        />
      </div>

      {/* Toornament stages (only visible when toornamentId is set) */}
      {toornamentIdValue.trim() !== '' && (
        <div className="space-y-3 rounded-xl border border-white/5 bg-white/2 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              Stages Toornament
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addStage}
              disabled={isPending}
              className="gap-1 text-xs text-blue-400 hover:text-blue-300"
            >
              <Plus className="size-3.5" />
              Ajouter
            </Button>
          </div>

          {stageFields.length === 0 && (
            <p className="text-xs text-zinc-600">
              Aucun stage configuré. Seuls le widget principal et le calendrier
              seront affichés.
            </p>
          )}

          <div className="space-y-2">
            {stageFields.map((stage, index) => (
              <div
                key={stage.id}
                className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/2 p-2.5"
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5 pt-1">
                  <button
                    type="button"
                    onClick={() => moveStageItem(index, index - 1)}
                    disabled={index === 0 || isPending}
                    className="text-zinc-600 hover:text-zinc-400 disabled:opacity-30"
                    aria-label={`Monter le stage ${(index + 1).toString()}`}
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStageItem(index, index + 1)}
                    disabled={index === stageFields.length - 1 || isPending}
                    className="text-zinc-600 hover:text-zinc-400 disabled:opacity-30"
                    aria-label={`Descendre le stage ${(index + 1).toString()}`}
                  >
                    <ChevronDown className="size-4" />
                  </button>
                </div>

                {/* Stage inputs */}
                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  <div>
                    <Input
                      placeholder="Nom du stage (ex: Poules)"
                      aria-label={`Nom du stage ${(index + 1).toString()}`}
                      disabled={isPending}
                      className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600"
                      {...register(`toornamentStages.${index}.name`)}
                    />
                    {errors.toornamentStages?.[index]?.name?.message && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.toornamentStages[index].name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      placeholder="ID du stage (ex: 618983668512789184)"
                      aria-label={`ID du stage ${(index + 1).toString()}`}
                      disabled={isPending}
                      className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600"
                      {...register(`toornamentStages.${index}.stageId`)}
                    />
                    {errors.toornamentStages?.[index]?.stageId?.message && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.toornamentStages[index].stageId.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Hidden number field */}
                <input
                  type="hidden"
                  {...register(`toornamentStages.${index}.number`, {
                    valueAsNumber: true,
                  })}
                />

                {/* Delete stage button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    removeStage(index)
                    // Re-index remaining stages
                    for (let i = index; i < stageFields.length - 1; i++) {
                      setValue(`toornamentStages.${i}.number`, i)
                    }
                  }}
                  disabled={isPending}
                  className="mt-0.5 text-zinc-500 hover:text-red-400"
                  aria-label={`Supprimer le stage ${(index + 1).toString()}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
