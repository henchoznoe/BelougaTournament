/**
 * File: components/features/admin/registration-detail-dialog.tsx
 * Description: Dialog for viewing/editing registration details with team management and admin actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  Ban,
  Calendar,
  Check,
  Crown,
  ExternalLink,
  Loader2,
  Pencil,
  Save,
  Shield,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  adminChangeTeam,
  adminDeleteRegistration,
  adminPromoteCaptain,
  adminUpdateRegistrationFields,
} from '@/lib/actions/registrations'
import { ROUTES } from '@/lib/config/routes'
import type { RegistrationRow, TeamOption } from '@/lib/types/registration'
import { isBanned } from '@/lib/utils/auth.helpers'
import { formatDateTime } from '@/lib/utils/formatting'
import {
  FieldType,
  Role,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

interface RegistrationDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registration: RegistrationRow
  teamsByTournament: Record<string, TeamOption[]>
  viewerRole: Role
}

export const RegistrationDetailDialog = ({
  open,
  onOpenChange,
  registration,
  teamsByTournament,
  viewerRole,
}: RegistrationDetailDialogProps) => {
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Edit custom fields state
  const [isEditingFields, setIsEditingFields] = useState(false)
  const [editedFieldValues, setEditedFieldValues] = useState<
    Record<string, string | number>
  >({})

  // Change team state
  const [isChangingTeam, setIsChangingTeam] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState('')

  // Promote captain state
  const [confirmPromote, setConfirmPromote] = useState(false)

  const canManage = viewerRole === Role.SUPERADMIN || viewerRole === Role.ADMIN
  const isTeam = registration.tournament.format === TournamentFormat.TEAM
  const banned = isBanned(registration.user.bannedUntil)
  const isCaptain = registration.team?.captainId === registration.user.id

  const fieldEntries = registration.tournament.fields
    .map(f => ({
      label: f.label,
      type: f.type,
      value: registration.fieldValues[f.label] ?? '',
    }))
    .filter(e => e.value !== '' || isEditingFields)

  // Available teams for "change team" dropdown (exclude current team and full teams)
  const availableTeams = (
    teamsByTournament[registration.tournament.id] ?? []
  ).filter(t => t.id !== registration.team?.id && !t.isFull)

  const resetState = () => {
    setConfirmDelete(false)
    setIsEditingFields(false)
    setEditedFieldValues({})
    setIsChangingTeam(false)
    setSelectedTeamId('')
    setConfirmPromote(false)
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await adminDeleteRegistration({
        registrationId: registration.id,
      })
      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setConfirmDelete(false)
    })
  }

  const handleStartEditFields = () => {
    const values: Record<string, string | number> = {}
    for (const f of registration.tournament.fields) {
      values[f.label] =
        registration.fieldValues[f.label] ??
        (f.type === FieldType.NUMBER ? 0 : '')
    }
    setEditedFieldValues(values)
    setIsEditingFields(true)
  }

  const handleSaveFields = () => {
    startTransition(async () => {
      const result = await adminUpdateRegistrationFields({
        registrationId: registration.id,
        fieldValues: editedFieldValues,
      })
      if (result.success) {
        toast.success(result.message)
        setIsEditingFields(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  const handleChangeTeam = () => {
    if (!selectedTeamId) return
    startTransition(async () => {
      const result = await adminChangeTeam({
        registrationId: registration.id,
        targetTeamId: selectedTeamId,
      })
      if (result.success) {
        toast.success(result.message)
        setIsChangingTeam(false)
        setSelectedTeamId('')
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  const handlePromoteCaptain = () => {
    const teamId = registration.team?.id
    if (!teamId) return
    startTransition(async () => {
      const result = await adminPromoteCaptain({
        teamId,
        userId: registration.user.id,
      })
      if (result.success) {
        toast.success(result.message)
        setConfirmPromote(false)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v) resetState()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-white/10 bg-zinc-950 sm:max-w-lg">
        {/* ── Header ── */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Link
              href={`${ROUTES.ADMIN_USERS}?userId=${registration.user.id}`}
              onClick={() => onOpenChange(false)}
              aria-label={`Voir le profil de ${registration.user.displayName}`}
              className="group relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 transition-colors hover:border-blue-500/30"
            >
              {registration.user.image ? (
                <Image
                  src={registration.user.image}
                  alt={registration.user.name}
                  width={48}
                  height={48}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-zinc-400">
                  {registration.user.name.charAt(0).toUpperCase()}
                </span>
              )}
              {banned && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                  <Ban className="size-4 text-red-400" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <ExternalLink className="size-3.5 text-white" />
              </div>
            </Link>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-lg text-white">
                {registration.user.displayName}
              </DialogTitle>
              <DialogDescription className="truncate text-sm text-zinc-400">
                {registration.user.name}
              </DialogDescription>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Link
                  href={ROUTES.ADMIN_EDIT_TOURNAMENT(
                    registration.tournament.slug,
                  )}
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400 transition-colors hover:bg-blue-500/20"
                >
                  <Trophy className="size-3" />
                  {registration.tournament.title}
                </Link>
                {banned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400">
                    <Ban className="size-3" />
                    Banni
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* ── Informations ── */}
        <div className="rounded-xl border border-white/5 bg-white/2 p-3">
          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            <div className="flex items-center gap-2 text-zinc-400">
              <Calendar className="size-3 shrink-0 text-zinc-600" />
              <span>Inscrit le {formatDateTime(registration.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <Trophy className="size-3 shrink-0 text-zinc-600" />
              <span>{isTeam ? 'Equipe' : 'Solo'}</span>
            </div>
            {registration.team && (
              <div className="flex items-center gap-2 text-zinc-400">
                <Users className="size-3 shrink-0 text-zinc-600" />
                <span className="truncate">{registration.team.name}</span>
                {isCaptain && (
                  <Crown className="size-3 shrink-0 text-amber-400" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Champs personnalises ── */}
        {(fieldEntries.length > 0 ||
          registration.tournament.fields.length > 0) && (
          <div className="rounded-xl border border-white/5 bg-white/2 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Champs personnalises
              </p>
              {canManage &&
                registration.tournament.fields.length > 0 &&
                !isEditingFields && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartEditFields}
                    className="h-6 gap-1 px-2 text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    <Pencil className="size-3" />
                    Modifier
                  </Button>
                )}
            </div>

            {isEditingFields ? (
              <div className="space-y-3">
                {registration.tournament.fields.map(field => (
                  <div key={field.label}>
                    <p className="mb-1 text-xs text-zinc-400">{field.label}</p>
                    <Input
                      type={field.type === FieldType.NUMBER ? 'number' : 'text'}
                      value={editedFieldValues[field.label] ?? ''}
                      onChange={e => {
                        setEditedFieldValues(prev => ({
                          ...prev,
                          [field.label]:
                            field.type === FieldType.NUMBER
                              ? e.target.value === ''
                                ? 0
                                : Number(e.target.value)
                              : e.target.value,
                        }))
                      }}
                      className="h-8 border-white/10 bg-white/5 text-sm text-zinc-200"
                    />
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={handleSaveFields}
                    disabled={isPending}
                    className="h-7 gap-1.5 bg-blue-600 text-xs text-white hover:bg-blue-500"
                  >
                    {isPending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Save className="size-3" />
                    )}
                    Enregistrer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingFields(false)}
                    disabled={isPending}
                    className="h-7 text-xs text-zinc-500"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : fieldEntries.length > 0 ? (
              <div className="space-y-2">
                {fieldEntries.map(entry => (
                  <div
                    key={entry.label}
                    className="flex items-baseline justify-between gap-4"
                  >
                    <span className="text-sm text-zinc-400">{entry.label}</span>
                    <span className="text-sm font-medium text-zinc-200">
                      {String(entry.value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-600">Aucune valeur renseignee.</p>
            )}
          </div>
        )}

        {/* ── Gestion de l'equipe ── */}
        {canManage && isTeam && registration.team && (
          <div className="rounded-xl border border-white/5 bg-white/2 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Gestion de l'equipe
            </p>
            <div className="space-y-3">
              {/* Promote to captain */}
              {!isCaptain &&
                (confirmPromote ? (
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400">
                      Promouvoir {registration.user.displayName} capitaine de{' '}
                      {registration.team.name} ?
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handlePromoteCaptain}
                        disabled={isPending}
                        className="h-7 gap-1.5 bg-amber-600 text-xs text-white hover:bg-amber-500"
                      >
                        {isPending ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Crown className="size-3" />
                        )}
                        Confirmer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmPromote(false)}
                        disabled={isPending}
                        className="h-7 text-xs text-zinc-500"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmPromote(true)}
                    className="h-7 gap-1.5 text-xs text-amber-400 hover:text-amber-300"
                  >
                    <Crown className="size-3" />
                    Promouvoir capitaine
                  </Button>
                ))}

              {/* Change team */}
              {availableTeams.length > 0 &&
                (isChangingTeam ? (
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400">
                      Deplacer vers une autre equipe :
                    </p>
                    <Select
                      value={selectedTeamId}
                      onValueChange={setSelectedTeamId}
                    >
                      <SelectTrigger className="h-8 border-white/10 bg-white/5 text-sm text-zinc-200">
                        <SelectValue placeholder="Choisir une equipe..." />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-zinc-950">
                        {availableTeams.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleChangeTeam}
                        disabled={isPending || !selectedTeamId}
                        className="h-7 gap-1.5 bg-blue-600 text-xs text-white hover:bg-blue-500"
                      >
                        {isPending ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Check className="size-3" />
                        )}
                        Deplacer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsChangingTeam(false)
                          setSelectedTeamId('')
                        }}
                        disabled={isPending}
                        className="h-7 text-xs text-zinc-500"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsChangingTeam(true)}
                    className="h-7 gap-1.5 text-xs text-blue-400 hover:text-blue-300"
                  >
                    <Shield className="size-3" />
                    Changer d'equipe
                  </Button>
                ))}
            </div>
          </div>
        )}

        {/* ── Zone dangereuse ── */}
        {canManage && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-red-400/60">
              Zone dangereuse
            </p>

            {confirmDelete ? (
              <div className="space-y-2">
                <p className="text-xs text-red-400">
                  {isTeam
                    ? "L'inscription et l'appartenance a l'equipe seront supprimees."
                    : "L'inscription sera definitivement supprimee."}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={handleDelete}
                    className="gap-2 bg-red-600 text-white hover:bg-red-500"
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                    Confirmer la suppression
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                    disabled={isPending}
                    className="text-zinc-500"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
                className="gap-2 text-red-400 hover:text-red-300"
              >
                <Trash2 className="size-4" />
                Supprimer l'inscription
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
