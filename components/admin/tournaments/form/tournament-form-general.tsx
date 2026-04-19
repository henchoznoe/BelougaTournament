/**
 * File: components/admin/tournaments/form/tournament-form-general.tsx
 * Description: General information section of the tournament form (title, description).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { FileText } from 'lucide-react'
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form'
import type { TournamentFormValues } from '@/components/admin/tournaments/form/tournament-form-types'
import {
  INPUT_CLASSES,
  LABEL_CLASSES,
  SECTION_CLASSES,
  SectionHeader,
} from '@/components/admin/tournaments/form/tournament-form-ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { VALIDATION_LIMITS } from '@/lib/config/constants'

interface TournamentFormGeneralProps {
  register: UseFormRegister<TournamentFormValues>
  control: Control<TournamentFormValues>
  errors: FieldErrors<TournamentFormValues>
  setValue: UseFormSetValue<TournamentFormValues>
}

export const TournamentFormGeneral = ({
  register,
  control,
  errors,
  setValue,
}: TournamentFormGeneralProps) => {
  return (
    <div className={SECTION_CLASSES}>
      <SectionHeader icon={FileText} title="Informations générales" />
      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="tournament-title" className={LABEL_CLASSES}>
            Titre *
          </Label>
          <Input
            id="tournament-title"
            placeholder="Nom du tournoi"
            maxLength={VALIDATION_LIMITS.TITLE_MAX}
            className={INPUT_CLASSES}
            {...register('title')}
          />
          {errors.title?.message && (
            <p className="text-xs text-red-400">{errors.title.message}</p>
          )}
        </div>

        {/* Description (rich text) */}
        <div className="space-y-1.5">
          <Label className={LABEL_CLASSES}>Description *</Label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                id="tournament-description"
                value={field.value}
                onChange={val =>
                  setValue('description', val, { shouldValidate: true })
                }
                placeholder="Description du tournoi..."
              />
            )}
          />
          {errors.description?.message && (
            <p className="text-xs text-red-400">{errors.description.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
