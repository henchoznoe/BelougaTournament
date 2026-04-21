/**
 * File: components/admin/tournaments/form/tournament-form-content.tsx
 * Description: Content section of the tournament form (rules, prize) with rich text editors.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Trophy } from 'lucide-react'
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormSetValue,
} from 'react-hook-form'
import {
  LABEL_CLASSES,
  SECTION_CLASSES,
  SectionHeader,
} from '@/components/admin/tournaments/form/tournament-form-ui'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import type { TournamentFormValues } from '@/lib/types/tournament-form'

interface TournamentFormContentProps {
  control: Control<TournamentFormValues>
  errors: FieldErrors<TournamentFormValues>
  setValue: UseFormSetValue<TournamentFormValues>
}

export const TournamentFormContent = ({
  control,
  errors,
  setValue,
}: TournamentFormContentProps) => {
  return (
    <div className={SECTION_CLASSES}>
      <SectionHeader icon={Trophy} title="Contenu" color="text-amber-400" />
      <div className="space-y-4">
        {/* Rules */}
        <div className="space-y-1.5">
          <Label className={LABEL_CLASSES}>Règles</Label>
          <Controller
            name="rules"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                id="tournament-rules"
                value={field.value}
                onChange={val =>
                  setValue('rules', val, { shouldValidate: true })
                }
                placeholder="Règles du tournoi..."
              />
            )}
          />
          {errors.rules?.message && (
            <p className="text-xs text-red-400">{errors.rules.message}</p>
          )}
        </div>

        {/* Prize */}
        <div className="space-y-1.5">
          <Label className={LABEL_CLASSES}>Prix</Label>
          <Controller
            name="prize"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                id="tournament-prize"
                value={field.value}
                onChange={val =>
                  setValue('prize', val, { shouldValidate: true })
                }
                placeholder="Description des prix..."
              />
            )}
          />
          {errors.prize?.message && (
            <p className="text-xs text-red-400">{errors.prize.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
