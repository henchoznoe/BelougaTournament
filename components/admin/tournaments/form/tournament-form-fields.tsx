/**
 * File: components/admin/tournaments/form/tournament-form-fields.tsx
 * Description: Custom registration fields section of the tournament form.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { AlertTriangle, Plus, Settings } from 'lucide-react'
import {
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
  useFieldArray,
} from 'react-hook-form'
import { OrderableItem } from '@/components/admin/tournaments/form/tournament-form-orderable-item'
import {
  INPUT_CLASSES,
  SECTION_CLASSES,
  SectionHeader,
} from '@/components/admin/tournaments/form/tournament-form-ui'
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
import type { TournamentFormValues } from '@/lib/types/tournament-form'
import { cn } from '@/lib/utils/cn'
import { FieldType } from '@/prisma/generated/prisma/enums'

interface TournamentFormFieldsProps {
  control: Control<TournamentFormValues>
  register: UseFormRegister<TournamentFormValues>
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
      <SectionHeader icon={Settings} title="Champs personnalisés" />

      {fieldsLocked && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
          <AlertTriangle className="size-3.5 shrink-0" />
          Les champs ne peuvent pas être modifiés car le tournoi est publié avec
          des inscrits.
        </div>
      )}

      <div className="space-y-2">
        {fieldArrayFields.map((field, index) => (
          <OrderableItem
            key={field.id}
            index={index}
            total={fieldArrayFields.length}
            disabled={fieldsLocked}
            onMoveUp={() => moveField(index, index - 1)}
            onMoveDown={() => moveField(index, index + 1)}
            onRemove={() => removeField(index)}
            removeLabel={`Supprimer le champ ${index + 1}`}
          >
            <div className="grid items-center gap-3 sm:grid-cols-[1fr_8rem_5rem]">
              {/* Label */}
              <div>
                <Input
                  placeholder="Libellé du champ"
                  disabled={fieldsLocked}
                  aria-label={`Libellé du champ ${index + 1}`}
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

              {/* Type */}
              <Select
                value={watch(`fields.${index}.type`)}
                onValueChange={val => {
                  if (val === FieldType.TEXT || val === FieldType.NUMBER) {
                    setValue(`fields.${index}.type`, val, {
                      shouldValidate: true,
                    })
                  }
                }}
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

              {/* Required toggle */}
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
            </div>
          </OrderableItem>
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
          className="mt-1 gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
        >
          <Plus className="size-3.5" />
          Ajouter un champ
        </Button>
      </div>
    </div>
  )
}
