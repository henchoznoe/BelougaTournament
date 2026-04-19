/**
 * File: components/public/profile/registration-edit-dialog.tsx
 * Description: Dialog for editing own registration field values and team name (captain) from the profile page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ImagePlus, Loader2, Save, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
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
import { updateRegistrationFields } from '@/lib/actions/tournament-registration'
import { updateTeamName } from '@/lib/actions/tournament-team'
import type {
  TournamentFieldItem,
  UserRegistrationItem,
} from '@/lib/types/tournament'
import { FieldType } from '@/prisma/generated/prisma/enums'

interface RegistrationEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registration: UserRegistrationItem
  userId: string
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
  userId,
}: RegistrationEditDialogProps) => {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const fields = registration.tournament.fields
  const isCaptain =
    !!registration.team && registration.team.captainId === userId

  const defaultValues = Object.fromEntries(
    fields.map(f => [f.label, String(registration.fieldValues[f.label] ?? '')]),
  )

  const [teamName, setTeamName] = useState(registration.team?.name ?? '')
  const [logoUrl, setLogoUrl] = useState(registration.team?.logoUrl ?? null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const showLogoUpload = isCaptain && registration.tournament.teamLogoEnabled

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<Record<string, string>>({
    defaultValues,
  })

  // Track whether the team name has changed
  const teamNameDirty =
    isCaptain && teamName !== (registration.team?.name ?? '')

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
      setTeamName(registration.team?.name ?? '')
      setLogoUrl(registration.team?.logoUrl ?? null)
    }
  }, [open, registration, fields, reset])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !registration.team) return

    setIsUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('teamId', registration.team.id)

      const res = await fetch('/api/blobs/team-logo', {
        method: 'POST',
        body: formData,
      })
      const data = (await res.json()) as { url?: string; error?: string }

      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Erreur lors de l'upload du logo.")
        return
      }

      setLogoUrl(data.url)
      toast.success('Logo importé avec succès.')
      router.refresh()
    } catch (error) {
      console.error('Error uploading team logo:', error)
      toast.error('Une erreur inattendue est survenue.')
    } finally {
      setIsUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  const handleLogoDelete = async () => {
    if (!registration.team) return

    setIsUploadingLogo(true)
    try {
      const res = await fetch('/api/blobs/team-logo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: registration.team.id }),
      })
      const data = (await res.json()) as { success?: boolean; error?: string }

      if (!res.ok || !data.success) {
        toast.error(data.error ?? 'Erreur lors de la suppression du logo.')
        return
      }

      setLogoUrl(null)
      toast.success('Logo supprimé.')
      router.refresh()
    } catch (error) {
      console.error('Error deleting team logo:', error)
      toast.error('Une erreur inattendue est survenue.')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const onSubmit = (data: Record<string, string>) => {
    startTransition(async () => {
      // Update field values if changed
      if (isDirty) {
        const fieldValues = buildFieldValues(data, fields)
        const result = await updateRegistrationFields({
          registrationId: registration.id,
          tournamentId: registration.tournament.id,
          fieldValues,
        })

        if (!result.success) {
          toast.error(result.message ?? 'Une erreur est survenue.')
          return
        }
      }

      // Update team name if captain changed it
      if (teamNameDirty && registration.team) {
        const result = await updateTeamName({
          teamId: registration.team.id,
          name: teamName.trim(),
        })

        if (!result.success) {
          toast.error(result.message ?? 'Une erreur est survenue.')
          return
        }
      }

      toast.success('Modifications enregistrées.')
      onOpenChange(false)
      router.refresh()
    })
  }

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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isCaptain && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-team-name" className="text-xs text-zinc-400">
                Nom d'équipe
              </Label>
              <Input
                id="edit-team-name"
                type="text"
                disabled={isPending}
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                maxLength={30}
                className="h-9 border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600"
              />
            </div>
          )}

          {showLogoUpload && (
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Logo d'équipe</Label>
              {logoUrl ? (
                <div className="flex items-center gap-3">
                  <div className="relative size-12 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                    <Image
                      src={logoUrl}
                      alt="Logo d'équipe"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isUploadingLogo || isPending}
                    className="gap-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    onClick={handleLogoDelete}
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                    Supprimer
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isUploadingLogo || isPending}
                    className="gap-1.5 text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <ImagePlus className="size-3.5" />
                    )}
                    Changer
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingLogo || isPending}
                  className="gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {isUploadingLogo ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ImagePlus className="size-4" />
                  )}
                  {isUploadingLogo ? 'Import en cours...' : 'Uploader un logo'}
                </Button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                aria-label="Sélectionner un logo d'équipe"
                onChange={handleLogoUpload}
              />
              <p className="text-xs text-zinc-500">
                PNG, JPEG ou WebP. 2 Mo maximum.
              </p>
            </div>
          )}

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
            !isCaptain && (
              <p className="text-center text-sm text-zinc-500">
                Aucun champ supplémentaire à modifier.
              </p>
            )
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending || (!isDirty && !teamNameDirty)}
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
