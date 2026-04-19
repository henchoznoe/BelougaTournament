/**
 * File: components/admin/tournaments/tournament-registration-dialogs.tsx
 * Description: Dialogs for editing registration fields and changing teams.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { adminUpdateRegistrationFields } from '@/lib/actions/registrations'
import { adminChangeTeam } from '@/lib/actions/registrations-team'
import type {
  TeamItem,
  TournamentFieldItem,
  TournamentRegistrationItem,
} from '@/lib/types/tournament'
import { parseFieldValues } from '@/lib/utils/tournament-helpers'
import { FieldType } from '@/prisma/generated/prisma/enums'

// ─── Edit Fields Dialog ──────────────────────────────────────────────────────

interface EditFieldsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registration: TournamentRegistrationItem
  fields: TournamentFieldItem[]
}

export const EditFieldsDialog = ({
  open,
  onOpenChange,
  registration,
  fields,
}: EditFieldsDialogProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<Record<string, string | number>>(
    parseFieldValues(registration.fieldValues),
  )

  const handleSave = () => {
    startTransition(async () => {
      const result = await adminUpdateRegistrationFields({
        registrationId: registration.id,
        fieldValues: values,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier les champs</DialogTitle>
          <DialogDescription>
            Modifier les valeurs des champs personnalisés de{' '}
            {registration.user.displayName || registration.user.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {fields.map(field => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={`field-${field.id}`}>
                {field.label}
                {field.required && <span className="ml-1 text-red-400">*</span>}
              </Label>
              <Input
                id={`field-${field.id}`}
                type={field.type === FieldType.NUMBER ? 'number' : 'text'}
                value={values[field.label] ?? ''}
                onChange={e => {
                  const val =
                    field.type === FieldType.NUMBER
                      ? e.target.value === ''
                        ? ''
                        : Number(e.target.value)
                      : e.target.value
                  setValues(prev => ({ ...prev, [field.label]: val }))
                }}
              />
            </div>
          ))}
          {fields.length === 0 && (
            <p className="text-sm text-zinc-500">
              Aucun champ personnalisé configuré.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || fields.length === 0}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Change Team Dialog ──────────────────────────────────────────────────────

interface ChangeTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registration: TournamentRegistrationItem
  teams: TeamItem[]
}

export const ChangeTeamDialog = ({
  open,
  onOpenChange,
  registration,
  teams,
}: ChangeTeamDialogProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [targetTeamId, setTargetTeamId] = useState('')

  // Filter out the current team
  const availableTeams = teams.filter(
    t => t.id !== registration.team?.id && !t.isFull,
  )

  const handleChange = () => {
    if (!targetTeamId) return
    startTransition(async () => {
      const result = await adminChangeTeam({
        registrationId: registration.id,
        targetTeamId,
      })
      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        setTargetTeamId('')
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer d'équipe</DialogTitle>
          <DialogDescription>
            Déplacer {registration.user.displayName || registration.user.name}{' '}
            vers une autre équipe.
            {registration.team && (
              <>
                {' '}
                Équipe actuelle :{' '}
                <span className="font-semibold text-white">
                  {registration.team.name}
                </span>
                .
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Équipe cible</Label>
          {availableTeams.length > 0 ? (
            <Select value={targetTeamId} onValueChange={setTargetTeamId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une équipe" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name} ({team.members.length} membres)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-zinc-500">
              Aucune équipe disponible (non pleine).
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button onClick={handleChange} disabled={isPending || !targetTeamId}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Déplacer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
