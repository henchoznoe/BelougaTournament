/**
 * File: components/admin/tournaments/tournament-registration-dialogs.tsx
 * Description: Dialogs for editing registration fields, changing teams, deleting, refunding, and renaming teams.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import {
  adminDeleteRegistration,
  adminRefundRegistration,
  adminUpdateRegistrationFields,
} from '@/lib/actions/registrations'
import {
  adminChangeTeam,
  adminUpdateTeamName,
} from '@/lib/actions/registrations-team'
import { VALIDATION_LIMITS } from '@/lib/config/constants'
import type {
  TeamItem,
  TournamentFieldItem,
  TournamentRegistrationItem,
} from '@/lib/types/tournament'
import { parseFieldValues } from '@/lib/utils/tournament-helpers'
import { FieldType, PaymentStatus } from '@/prisma/generated/prisma/enums'

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

// ─── Delete Registration Dialog ───────────────────────────────────────────────

interface DeleteRegistrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registration: TournamentRegistrationItem
}

export const DeleteRegistrationDialog = ({
  open,
  onOpenChange,
  registration,
}: DeleteRegistrationDialogProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const displayName = registration.user.displayName || registration.user.name

  const handleDelete = () => {
    startTransition(async () => {
      const result = await adminDeleteRegistration({
        registrationId: registration.id,
      })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      onOpenChange(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Supprimer l\u2019inscription de {displayName} ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Cette action supprimera l\u2019inscription.
            {registration.team && ' Le joueur sera retiré de son équipe.'}
            {registration.paymentStatus === PaymentStatus.PAID && (
              <>
                {' '}
                <span className="font-semibold text-amber-400">
                  Attention : le paiement ne sera pas automatiquement remboursé.
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Refund Registration Dialog ───────────────────────────────────────────────

interface RefundRegistrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registration: TournamentRegistrationItem
}

export const RefundRegistrationDialog = ({
  open,
  onOpenChange,
  registration,
}: RefundRegistrationDialogProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const displayName = registration.user.displayName || registration.user.name

  const handleRefund = () => {
    startTransition(async () => {
      const result = await adminRefundRegistration({
        registrationId: registration.id,
      })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      onOpenChange(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rembourser {displayName} ?</AlertDialogTitle>
          <AlertDialogDescription>
            Un remboursement Stripe sera initié pour cette inscription. Le
            joueur sera désinscrit et retiré de son équipe le cas échéant.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleRefund} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Rembourser
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Rename Team Dialog ───────────────────────────────────────────────────────

interface RenameTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registration: TournamentRegistrationItem
}

export const RenameTeamDialog = ({
  open,
  onOpenChange,
  registration,
}: RenameTeamDialogProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newTeamName, setNewTeamName] = useState(registration.team?.name ?? '')

  const handleRename = () => {
    const teamId = registration.team?.id
    if (!teamId) return
    startTransition(async () => {
      const result = await adminUpdateTeamName({
        teamId,
        name: newTeamName.trim(),
      })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      onOpenChange(false)
    })
  }

  if (!registration.team) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renommer l\u2019équipe</DialogTitle>
          <DialogDescription>
            Équipe actuelle : {registration.team.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="admin-rename-team" className="text-sm">
            Nouveau nom
          </Label>
          <Input
            id="admin-rename-team"
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            maxLength={VALIDATION_LIMITS.TEAM_NAME_MAX}
            disabled={isPending}
          />
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
            onClick={handleRename}
            disabled={
              isPending ||
              newTeamName.trim().length < VALIDATION_LIMITS.TEAM_NAME_MIN ||
              newTeamName.trim() === registration.team.name
            }
          >
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Renommer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
