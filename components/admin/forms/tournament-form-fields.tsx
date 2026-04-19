/**
 * File: components/admin/forms/tournament-form-fields.tsx
 * Description: Custom registration fields section of the tournament form.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react'
import {
  type Control,
  type FieldErrors,
  type UseFormSetValue,
  type UseFormWatch,
  useFieldArray,
} from 'react-hook-form'
import type { TournamentFormValues } from '@/components/admin/forms/tournament-form-types'
import {
  INPUT_CLASSES,
  SECTION_CLASSES,
  SectionHeader,
} from '@/components/admin/forms/tournament-form-ui'
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
import { cn } from '@/lib/utils/cn'
import { FieldType } from '@/prisma/generated/prisma/enums'

interface TournamentFormFieldsProps {
  control: Control<TournamentFormValues>
  register: ReturnType<
    typeof import('react-hook-form').useForm<TournamentFormValues>
  >['register']
  errors: FieldErrors<TournamentFormValues>
  setValue: UseFormSetValue<TournamentFormValues>
  watch: UseFormWatch<TournamentFormValues>
  fieldsLocked: boolean
}

export const TournamentFormFields = ({
  control,
  register,
  errors,
  setValue,
  watch,
  fieldsLocked,
}: TournamentFormFieldsProps) => {
  const {
    fields: fieldArrayFields,
    append: appendField,
    remove: removeField,
    move: moveField,
  } = useFieldArray({ control, name: 'fields' })

  return (
    <div className={SECTION_CLASSES}>
      <SectionHeader icon={Settings} title="Champs personnalises" />

      {fieldsLocked && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
          <AlertTriangle className="size-3.5 shrink-0" />
          Les champs ne peuvent pas etre modifies car le tournoi est publie avec
          des inscrits.
        </div>
      )}

      <div className="space-y-3">
        {fieldArrayFields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/2 p-3"
          >
            <div className="mt-1 flex shrink-0 flex-col gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={index === 0 || fieldsLocked}
                onClick={() => moveField(index, index - 1)}
                className="text-zinc-500 hover:text-zinc-300"
                aria-label="Monter le champ"
              >
                <ChevronUp className="size-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={index === fieldArrayFields.length - 1 || fieldsLocked}
                onClick={() => moveField(index, index + 1)}
                className="text-zinc-500 hover:text-zinc-300"
                aria-label="Descendre le champ"
              >
                <ChevronDown className="size-3" />
              </Button>
            </div>
            <div className="grid flex-1 gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <Input
                  placeholder="Libelle"
                  disabled={fieldsLocked}
                  aria-label={`Libelle du champ ${index + 1}`}
                  className={cn(
                    INPUT_CLASSES,
                    'h-9 text-xs',
                    fieldsLocked && 'opacity-60',
                  )}
                  {...register(`fields.${index}.label`)}
                />
                {errors.fields?.[index]?.label?.message && (
                  <p className="mt-1 text-[10px] text-red-400">
                    {errors.fields[index].label.message}
                  </p>
                )}
              </div>
              <Select
                value={watch(`fields.${index}.type`)}
                onValueChange={val =>
                  setValue(`fields.${index}.type`, val as FieldType, {
                    shouldValidate: true,
                  })
                }
                disabled={fieldsLocked}
              >
                <SelectTrigger
                  className={cn(
                    INPUT_CLASSES,
                    'h-9 text-xs',
                    fieldsLocked && 'opacity-60',
                  )}
                  aria-label={`Type du champ ${index + 1}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FieldType.TEXT}>Texte</SelectItem>
                  <SelectItem value={FieldType.NUMBER}>Nombre</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Switch
                    size="sm"
                    checked={watch(`fields.${index}.required`)}
                    onCheckedChange={val =>
                      setValue(`fields.${index}.required`, val, {
                        shouldValidate: true,
                      })
                    }
                    disabled={fieldsLocked}
                  />
                  <span className="text-[10px] text-zinc-500">Requis</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={fieldsLocked}
                  onClick={() => removeField(index)}
                  className="size-8 p-0 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                  aria-label="Supprimer le champ"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={fieldsLocked}
          onClick={() =>
            appendField({
              label: '',
              type: FieldType.TEXT,
              required: false,
              order: fieldArrayFields.length,
            })
          }
          className="gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
        >
          <Plus className="size-3.5" />
          Ajouter un champ
        </Button>
      </div>
    </div>
  )
}
