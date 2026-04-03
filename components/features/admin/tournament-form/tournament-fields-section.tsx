/**
 * File: components/features/admin/tournament-form/tournament-fields-section.tsx
 * Description: Custom fields section with dynamic field management for the tournament form.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ChevronDown, ChevronUp, Info, Plus, Trash2 } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { TournamentFormInput } from '@/lib/validations/tournaments'
import { FieldType } from '@/prisma/generated/prisma/enums'

interface TournamentFieldsSectionProps {
  form: UseFormReturn<TournamentFormInput>
  isPending: boolean
  fieldsLocked: boolean
}

export const TournamentFieldsSection = ({
  form,
  isPending,
  fieldsLocked,
}: TournamentFieldsSectionProps) => {
  const {
    register,
    setValue,
    watch,
    control,
    formState: { errors },
  } = form

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'fields',
  })

  const addField = () => {
    append({
      label: '',
      type: FieldType.TEXT,
      required: false,
      order: fields.length,
    })
  }

  const moveField = (from: number, to: number) => {
    if (to < 0 || to >= fields.length) return
    move(from, to)
    // Update order values after move
    for (let i = 0; i < fields.length; i++) {
      setValue(`fields.${i}.order`, i)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
          Champs personnalisés
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addField}
          disabled={isPending || fieldsLocked}
          className="gap-1 text-xs text-blue-400 hover:text-blue-300"
        >
          <Plus className="size-3.5" />
          Ajouter
        </Button>
      </div>

      {fieldsLocked && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <Info className="size-4 shrink-0 text-amber-400" />
          <p className="text-xs text-amber-300">
            Les champs personnalisés ne peuvent pas être modifiés car le tournoi
            est publié et a des inscriptions.
          </p>
        </div>
      )}

      {fields.length === 0 && (
        <p className="text-sm text-zinc-600">
          Aucun champ personnalisé pour le moment.
        </p>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/2 p-3"
          >
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5 pt-1">
              <button
                type="button"
                onClick={() => moveField(index, index - 1)}
                disabled={index === 0 || isPending || fieldsLocked}
                className="text-zinc-600 hover:text-zinc-400 disabled:opacity-30"
                aria-label={`Monter le champ ${(index + 1).toString()}`}
              >
                <ChevronUp className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => moveField(index, index + 1)}
                disabled={
                  index === fields.length - 1 || isPending || fieldsLocked
                }
                className="text-zinc-600 hover:text-zinc-400 disabled:opacity-30"
                aria-label={`Descendre le champ ${(index + 1).toString()}`}
              >
                <ChevronDown className="size-4" />
              </button>
            </div>

            {/* Field inputs */}
            <div className="grid flex-1 gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <Input
                  placeholder="Libellé du champ"
                  aria-label={`Libellé du champ ${(index + 1).toString()}`}
                  disabled={isPending || fieldsLocked}
                  className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600"
                  {...register(`fields.${index}.label`)}
                />
                {errors.fields?.[index]?.label?.message && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.fields[index].label.message}
                  </p>
                )}
              </div>

              <div>
                <Select
                  value={watch(`fields.${index}.type`)}
                  onValueChange={val =>
                    setValue(`fields.${index}.type`, val as FieldType, {
                      shouldDirty: true,
                    })
                  }
                  disabled={isPending || fieldsLocked}
                >
                  <SelectTrigger className="h-9 w-full rounded-lg border-white/10 bg-white/5 text-sm text-zinc-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FieldType.TEXT}>Texte</SelectItem>
                    <SelectItem value={FieldType.NUMBER}>Nombre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={watch(`fields.${index}.required`)}
                  onCheckedChange={checked =>
                    setValue(`fields.${index}.required`, checked, {
                      shouldDirty: true,
                    })
                  }
                  disabled={isPending || fieldsLocked}
                  size="sm"
                />
                <span className="text-xs text-zinc-400">Requis</span>
              </div>
            </div>

            {/* Hidden order field */}
            <input
              type="hidden"
              {...register(`fields.${index}.order`, { valueAsNumber: true })}
            />

            {/* Delete field button */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                remove(index)
                // Re-index remaining fields
                for (let i = index; i < fields.length - 1; i++) {
                  setValue(`fields.${i}.order`, i)
                }
              }}
              disabled={isPending || fieldsLocked}
              className="mt-0.5 text-zinc-500 hover:text-red-400"
              aria-label={`Supprimer le champ ${(index + 1).toString()}`}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
