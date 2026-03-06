/**
 * File: components/features/profile/registration-edit-dialog.tsx
 * Description: Dialog for editing own registration field values from the profile page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { AlertTriangle, Loader2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateRegistrationFields } from '@/lib/actions/tournaments'
import type {
  TournamentFieldItem,
  UserRegistrationItem,
} from '@/lib/types/tournament'
import { FieldType, RegistrationStatus } from '@/prisma/generated/prisma/enums'

interface RegistrationEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registration: UserRegistrationItem
}

/** Maps dynamic field values from form (all strings) to proper types for the action. */
const buildFieldValues = (
  formData: Record<string, string>,
  fields: TournamentFieldItem[],
): Record<string, string | number> => {
  const result: Record<string, string | number> = {}
  for (const field of fields) {
    const raw = formData[field.label] ?? ''
    if (field.type === FieldType.NUMBER && raw !== '') {
      result[field.label] = Number(raw)
    } else {
      result[field.label] = raw
    }
  }
  return result
}

export const RegistrationEditDialog = ({
  open,
  onOpenChange,
  registration,
}: RegistrationEditDialogProps) => {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const fields = registration.tournament.fields

  const defaultValues = Object.fromEntries(
    fields.map(f => [f.label, String(registration.fieldValues[f.label] ?? '')]),
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<Record<string, string>>({
    defaultValues,
  })

  // Re-populate the form each time the dialog opens
  useEffect(() => {
    if (open) {
      reset(
        Object.fromEntries(
          fields.map(f => [
            f.label,
            String(registration.fieldValues[f.label] ?? ''),
          ]),
        ),
      )
    }
  }, [open, registration, fields, reset])

  const onSubmit = (data: Record<string, string>) => {
    startTransition(async () => {
      const fieldValues = buildFieldValues(data, fields)
      const result = await updateRegistrationFields({
        registrationId: registration.id,
        tournamentId: registration.tournament.id,
        fieldValues,
      })

      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  const willResetStatus = registration.status === RegistrationStatus.APPROVED

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-zinc-950 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            Modifier mon inscription
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {registration.tournament.title}
          </DialogDescription>
        </DialogHeader>

        {willResetStatus && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
            <p className="text-xs text-amber-300">
              Votre inscription est actuellement approuvée. La modifier remettra
              votre inscription en attente de validation.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fields.length > 0 ? (
            <div className="space-y-3">
              {fields.map(field => (
                <div key={field.id} className="space-y-1.5">
                  <Label
                    htmlFor={`edit-field-${field.id}`}
                    className="text-xs text-zinc-400"
                  >
                    {field.label}
                    {field.required && (
                      <span className="ml-0.5 text-red-400">*</span>
                    )}
                  </Label>
                  <Input
                    id={`edit-field-${field.id}`}
                    type={field.type === FieldType.NUMBER ? 'number' : 'text'}
                    disabled={isPending}
                    className="h-9 border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600"
                    {...register(field.label, {
                      required: field.required
                        ? `Le champ « ${field.label} » est requis.`
                        : false,
                    })}
                  />
                  {errors[field.label] && (
                    <p className="text-xs text-red-400">
                      {errors[field.label]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-zinc-500">
              Aucun champ supplémentaire à modifier.
            </p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending || !isDirty}
              className="gap-2 bg-blue-600 text-white hover:bg-blue-500"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
