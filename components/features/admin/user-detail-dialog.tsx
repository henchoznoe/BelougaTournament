/**
 * File: components/features/admin/user-detail-dialog.tsx
 * Description: Unified dialog for viewing user details and managing user actions (edit, ban, promote, demote, delete).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { addDays } from 'date-fns'
import {
  Ban,
  Calendar,
  Check,
  ClipboardList,
  Crown,
  Loader2,
  Save,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Trophy,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  banUser,
  deleteUser,
  demoteAdmin,
  promoteToAdmin,
  promoteToSuperAdmin,
  unbanUser,
  updateUser,
} from '@/lib/actions/users'
import {
  BAN_DURATION_OPTIONS,
  PERMANENT_BAN_DATE,
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_STATUS_STYLES,
} from '@/lib/config/constants'
import type {
  BanDurationValue,
  TournamentOption,
  UserRow,
} from '@/lib/types/user'
import { isBanned } from '@/lib/utils/auth.helpers'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/formatting'
import { updateUserSchema } from '@/lib/validations/users'
import type { TournamentStatus } from '@/prisma/generated/prisma/enums'
import { Role } from '@/prisma/generated/prisma/enums'

const DURATION_TO_DAYS: Record<string, number> = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

interface UserDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserRow
  tournaments: TournamentOption[]
  viewerRole: Role
  viewerIsOwner: boolean
}

type FormInput = { displayName: string }

export const UserDetailDialog = ({
  open,
  onOpenChange,
  user,
  tournaments,
  viewerRole,
  viewerIsOwner,
}: UserDetailDialogProps) => {
  const router = useRouter()
  const viewerIsSuperAdmin = viewerRole === Role.SUPERADMIN
  const banned = isBanned(user.bannedUntil)
  const isPermanentBan =
    user.bannedUntil && new Date(user.bannedUntil).getFullYear() >= 9999

  // Determine permissions
  const canEdit =
    user.role !== Role.SUPERADMIN &&
    (viewerIsSuperAdmin || user.role === Role.USER)
  const showAssignments = user.role === Role.ADMIN && viewerIsSuperAdmin
  const showBanManagement = user.role === Role.USER
  const showDangerZone =
    viewerIsSuperAdmin &&
    (user.role === Role.ADMIN ||
      user.role === Role.USER ||
      (user.role === Role.SUPERADMIN && viewerIsOwner))

  // Form state for displayName
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<FormInput>({
    resolver: zodResolver(
      updateUserSchema.omit({ userId: true, tournamentIds: true }),
    ),
    defaultValues: { displayName: user.displayName || '' },
    mode: 'onChange',
  })

  // Tournament assignments state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Ban form state
  const [showBanForm, setShowBanForm] = useState(false)
  const [duration, setDuration] = useState<BanDurationValue>('permanent')
  const [customDate, setCustomDate] = useState('')
  const [banReason, setBanReason] = useState('')

  // Inline confirmation state
  const [confirmAction, setConfirmAction] = useState<
    | 'promote'
    | 'promoteSuperAdmin'
    | 'demote'
    | 'demoteSuperAdmin'
    | 'delete'
    | 'unban'
    | null
  >(null)

  // Transitions
  const [isSavePending, startSaveTransition] = useTransition()
  const [isActionPending, startActionTransition] = useTransition()

  // Reset state when dialog opens or user changes
  useEffect(() => {
    if (open) {
      reset({ displayName: user.displayName || '' })
      setSelectedIds(new Set(user.adminOf.map(a => a.tournamentId)))
      setShowBanForm(false)
      setDuration('permanent')
      setCustomDate('')
      setBanReason('')
      setConfirmAction(null)
    }
  }, [open, user, reset])

  // Compute whether assignments have changed
  const originalIds = new Set(user.adminOf.map(a => a.tournamentId))
  const assignmentsChanged =
    selectedIds.size !== originalIds.size ||
    [...selectedIds].some(id => !originalIds.has(id))
  const hasChanges = isDirty || (showAssignments && assignmentsChanged)

  const handleToggle = (tournamentId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(tournamentId)) {
        next.delete(tournamentId)
      } else {
        next.add(tournamentId)
      }
      return next
    })
  }

  // -- Handlers --

  const handleSave = (data: FormInput) => {
    startSaveTransition(async () => {
      const payload: {
        userId: string
        displayName: string
        tournamentIds?: string[]
      } = {
        userId: user.id,
        displayName: data.displayName,
      }
      if (showAssignments) {
        payload.tournamentIds = [...selectedIds]
      }
      const result = await updateUser(payload)
      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  const computeBanDate = (): Date | null => {
    if (duration === 'permanent') return PERMANENT_BAN_DATE
    if (duration === 'custom') {
      if (!customDate) return null
      const d = new Date(customDate)
      if (Number.isNaN(d.getTime())) return null
      return d
    }
    const days = DURATION_TO_DAYS[duration]
    if (days) return addDays(new Date(), days)
    return null
  }

  const handleBan = () => {
    const bannedUntil = computeBanDate()
    if (!bannedUntil) {
      toast.error('Veuillez sélectionner une date valide.')
      return
    }
    startActionTransition(async () => {
      const result = await banUser({
        userId: user.id,
        bannedUntil,
        banReason: banReason || undefined,
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

  const handleUnban = () => {
    startActionTransition(async () => {
      const result = await unbanUser({ userId: user.id })
      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  const handlePromote = () => {
    startActionTransition(async () => {
      const result = await promoteToAdmin({ userId: user.id })
      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  const handlePromoteToSuperAdmin = () => {
    startActionTransition(async () => {
      const result = await promoteToSuperAdmin({ userId: user.id })
      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  const handleDemote = () => {
    startActionTransition(async () => {
      const result = await demoteAdmin({ userId: user.id })
      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  const handleDelete = () => {
    startActionTransition(async () => {
      const result = await deleteUser({ userId: user.id })
      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  // -- Role & Status badges --

  const getRoleBadge = () => {
    if (user.role === Role.SUPERADMIN) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">
          <Crown className="size-3" />
          Super Admin
        </span>
      )
    }
    if (user.role === Role.ADMIN) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">
          <ShieldCheck className="size-3" />
          Admin
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs font-semibold text-zinc-400">
        Joueur
      </span>
    )
  }

  const getStatusBadge = () => {
    if (banned) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400">
          <Ban className="size-3" />
          {isPermanentBan ? 'Ban permanent' : 'Banni'}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
        Actif
      </span>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-white/10 bg-zinc-950 sm:max-w-lg">
        {/* ── Header ── */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={48}
                  height={48}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-zinc-400">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
              {banned && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                  <Ban className="size-4 text-red-400" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-lg text-white">
                {user.name}
              </DialogTitle>
              <DialogDescription className="truncate text-sm text-zinc-400">
                {user.email}
              </DialogDescription>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {getRoleBadge()}
                {getStatusBadge()}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* ── Informations ── */}
        <div className="rounded-xl border border-white/5 bg-white/2 p-3">
          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            <div className="flex items-center gap-2 text-zinc-400">
              <Calendar className="size-3 shrink-0 text-zinc-600" />
              <span>Inscrit le {formatDate(user.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <ClipboardList className="size-3 shrink-0 text-zinc-600" />
              <span>
                {user._count.registrations} inscription
                {user._count.registrations !== 1 ? 's' : ''}
              </span>
            </div>
            {user.role === Role.ADMIN && (
              <div className="flex items-center gap-2 text-zinc-400">
                <Trophy className="size-3 shrink-0 text-zinc-600" />
                <span>
                  {user.adminOf.length} tournoi
                  {user.adminOf.length !== 1 ? 's' : ''} assigné
                  {user.adminOf.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {banned && (
            <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
              {isPermanentBan ? (
                <p>Ban permanent</p>
              ) : (
                user.bannedUntil && (
                  <p>Banni jusqu'au {formatDate(user.bannedUntil)}</p>
                )
              )}
              {user.banReason ? (
                <p className="mt-1 text-red-400">Raison : {user.banReason}</p>
              ) : (
                <p className="mt-1 text-red-400/60">Aucune raison spécifiée.</p>
              )}
            </div>
          )}
        </div>

        {/* ── Modification ── */}
        {canEdit && (
          <div className="rounded-xl border border-white/5 bg-white/2 p-4">
            <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Modification
              </p>

              <div className="space-y-1.5">
                <label
                  htmlFor="userDisplayName"
                  className="text-sm font-medium text-zinc-300"
                >
                  Pseudo d'affichage
                </label>
                <Input
                  id="userDisplayName"
                  {...register('displayName')}
                  placeholder="Ex: PlayerXYZ"
                  className="border-white/10 bg-white/5 text-zinc-200 placeholder:text-zinc-600"
                />
                {errors.displayName && (
                  <p className="text-xs text-red-400">
                    {errors.displayName.message}
                  </p>
                )}
              </div>

              {showAssignments && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-300">
                    Tournois assignés
                  </p>
                  {tournaments.length === 0 ? (
                    <p className="py-3 text-center text-sm text-zinc-500">
                      Aucun tournoi disponible.
                    </p>
                  ) : (
                    <div className="max-h-48 space-y-1 overflow-y-auto">
                      {tournaments.map(tournament => {
                        const isChecked = selectedIds.has(tournament.id)
                        const status = tournament.status as TournamentStatus
                        const statusLabel =
                          TOURNAMENT_STATUS_LABELS[status] ?? tournament.status
                        const statusClassName =
                          TOURNAMENT_STATUS_STYLES[status] ??
                          'bg-zinc-500/10 text-zinc-400'

                        return (
                          <button
                            key={tournament.id}
                            type="button"
                            onClick={() => handleToggle(tournament.id)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
                              isChecked
                                ? 'border-blue-500/30 bg-blue-500/5'
                                : 'border-white/5 bg-white/2 hover:border-white/10',
                            )}
                          >
                            <div
                              className={cn(
                                'flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-colors',
                                isChecked
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-input dark:bg-input/30',
                              )}
                            >
                              {isChecked && <Check className="size-3" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5 truncate text-sm font-medium text-zinc-200">
                                <Trophy className="size-3 shrink-0 text-zinc-500" />
                                {tournament.title}
                              </span>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClassName}`}
                            >
                              {statusLabel}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-3">
                {showAssignments && (
                  <p className="text-xs text-zinc-500">
                    {selectedIds.size} tournoi
                    {selectedIds.size !== 1 ? 's' : ''} sélectionné
                    {selectedIds.size !== 1 ? 's' : ''}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={isSavePending || !isValid || !hasChanges}
                  className={cn(
                    'gap-2 bg-blue-600 text-white hover:bg-blue-500',
                    !showAssignments && 'ml-auto',
                  )}
                >
                  {isSavePending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ── Gestion du ban ── */}
        {showBanManagement && (
          <div className="rounded-xl border border-white/5 bg-white/2 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Gestion du ban
            </p>

            {banned ? (
              confirmAction === 'unban' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    disabled={isActionPending}
                    onClick={handleUnban}
                    className="gap-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                  >
                    {isActionPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ShieldOff className="size-4" />
                    )}
                    Confirmer le déban
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmAction(null)}
                    disabled={isActionPending}
                    className="text-zinc-500"
                  >
                    Annuler
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setConfirmAction('unban')}
                  className="gap-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                >
                  <ShieldOff className="size-4" />
                  Débannir
                </Button>
              )
            ) : showBanForm ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {BAN_DURATION_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDuration(option.value)}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-sm transition-colors',
                        duration === option.value
                          ? 'border-red-500/30 bg-red-500/10 text-red-400'
                          : 'border-white/5 bg-white/2 text-zinc-400 hover:border-white/10 hover:text-zinc-200',
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {duration === 'custom' && (
                  <DateTimePicker
                    value={customDate}
                    onChange={setCustomDate}
                    disabled={isActionPending}
                    placeholder="Date et heure de fin de ban"
                  />
                )}

                <Input
                  placeholder="Raison (optionnel)"
                  value={banReason}
                  onChange={e => setBanReason(e.target.value)}
                  maxLength={500}
                  className="border-white/10 bg-white/5 text-zinc-200 placeholder:text-zinc-600"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    disabled={
                      isActionPending || (duration === 'custom' && !customDate)
                    }
                    onClick={handleBan}
                    className="gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  >
                    {isActionPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Ban className="size-4" />
                    )}
                    Bannir
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBanForm(false)}
                    disabled={isActionPending}
                    className="text-zinc-500"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => setShowBanForm(true)}
                className="gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20"
              >
                <Ban className="size-4" />
                Bannir
              </Button>
            )}
          </div>
        )}

        {/* ── Gestion du rôle ── */}
        {viewerIsSuperAdmin &&
          ((user.role === Role.USER && !banned) ||
            (user.role === Role.ADMIN && viewerIsOwner)) && (
            <div className="rounded-xl border border-white/5 bg-white/2 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Gestion du rôle
              </p>

              {/* Promote USER → ADMIN */}
              {user.role === Role.USER &&
                !banned &&
                (confirmAction === 'promote' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      disabled={isActionPending}
                      onClick={handlePromote}
                      className="gap-2 bg-blue-600 text-white hover:bg-blue-500"
                    >
                      {isActionPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="size-4" />
                      )}
                      Confirmer la promotion
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmAction(null)}
                      disabled={isActionPending}
                      className="text-zinc-500"
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmAction('promote')}
                    className="gap-2 text-blue-400 hover:text-blue-300"
                  >
                    <ShieldCheck className="size-4" />
                    Promouvoir admin
                  </Button>
                ))}

              {/* Promote ADMIN → SUPERADMIN (owner only) */}
              {user.role === Role.ADMIN &&
                viewerIsOwner &&
                (confirmAction === 'promoteSuperAdmin' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      disabled={isActionPending}
                      onClick={handlePromoteToSuperAdmin}
                      className="gap-2 bg-amber-600 text-white hover:bg-amber-500"
                    >
                      {isActionPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Crown className="size-4" />
                      )}
                      Confirmer la promotion
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmAction(null)}
                      disabled={isActionPending}
                      className="text-zinc-500"
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmAction('promoteSuperAdmin')}
                    className="gap-2 text-amber-400 hover:text-amber-300"
                  >
                    <Crown className="size-4" />
                    Promouvoir super admin
                  </Button>
                ))}
            </div>
          )}

        {/* ── Zone dangereuse ── */}
        {showDangerZone && (
          <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-red-400/60">
              Zone dangereuse
            </p>

            <div className="space-y-2">
              {/* Demote SUPERADMIN → ADMIN (owner only) */}
              {user.role === Role.SUPERADMIN &&
                viewerIsOwner &&
                (confirmAction === 'demoteSuperAdmin' ? (
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400">
                      Le super admin sera rétrogradé à admin.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        disabled={isActionPending}
                        onClick={handleDemote}
                        className="gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      >
                        {isActionPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <ShieldOff className="size-4" />
                        )}
                        Confirmer la rétrogradation
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmAction(null)}
                        disabled={isActionPending}
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
                    onClick={() => setConfirmAction('demoteSuperAdmin')}
                    className="gap-2 text-red-400 hover:text-red-300"
                  >
                    <ShieldOff className="size-4" />
                    Rétrograder à admin
                  </Button>
                ))}

              {/* Demote ADMIN → USER */}
              {user.role === Role.ADMIN &&
                (confirmAction === 'demote' ? (
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400">
                      Les assignations de tournois seront supprimées.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        disabled={isActionPending}
                        onClick={handleDemote}
                        className="gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      >
                        {isActionPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <ShieldOff className="size-4" />
                        )}
                        Confirmer la rétrogradation
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmAction(null)}
                        disabled={isActionPending}
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
                    onClick={() => setConfirmAction('demote')}
                    className="gap-2 text-red-400 hover:text-red-300"
                  >
                    <ShieldOff className="size-4" />
                    Rétrograder
                  </Button>
                ))}

              {/* Delete (USER only) */}
              {user.role === Role.USER &&
                (confirmAction === 'delete' ? (
                  <div className="space-y-2">
                    <p className="text-xs text-red-400">
                      Toutes les données associées (inscriptions, équipes, etc.)
                      seront définitivement supprimées.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        disabled={isActionPending}
                        onClick={handleDelete}
                        className="gap-2 bg-red-600 text-white hover:bg-red-500"
                      >
                        {isActionPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                        Confirmer la suppression
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmAction(null)}
                        disabled={isActionPending}
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
                    onClick={() => setConfirmAction('delete')}
                    className="gap-2 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="size-4" />
                    Supprimer l'utilisateur
                  </Button>
                ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
