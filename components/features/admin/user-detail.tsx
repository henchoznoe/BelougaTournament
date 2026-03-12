/**
 * File: components/features/admin/user-detail.tsx
 * Description: Client component for the admin user detail page with profile, registrations, edit form, role/ban management, and danger zone.
 * Author: Noe Henchoz
 * License: MIT
 * Copyright (c) 2026 Noe Henchoz
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Ban,
  Calendar,
  Check,
  ClipboardList,
  Crown,
  ExternalLink,
  Hash,
  Loader2,
  Pencil,
  Save,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { BanUserDialog } from '@/components/features/admin/ban-user-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  deleteUser,
  demoteAdmin,
  promoteToAdmin,
  promoteToSuperAdmin,
  unbanUser,
  updateUser,
} from '@/lib/actions/users'
import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_STATUS_STYLES,
} from '@/lib/config/constants'
import { ROUTES } from '@/lib/config/routes'
import type {
  TournamentOption,
  UserDetail as UserDetailType,
} from '@/lib/types/user'
import { isBanned } from '@/lib/utils/auth.helpers'
import { cn } from '@/lib/utils/cn'
import { formatDate, formatShortDate } from '@/lib/utils/formatting'
import { updateUserSchema } from '@/lib/validations/users'
import type { TournamentStatus } from '@/prisma/generated/prisma/enums'
import { Role, TournamentFormat } from '@/prisma/generated/prisma/enums'

interface UserDetailProps {
  user: UserDetailType
  tournaments: TournamentOption[]
  viewerRole: Role
  viewerIsOwner: boolean
}

type FormInput = { displayName: string }

export const UserDetail = ({
  user,
  tournaments,
  viewerRole,
  viewerIsOwner,
}: UserDetailProps) => {
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
  const showRoleManagement =
    viewerIsSuperAdmin &&
    ((user.role === Role.USER && !banned) ||
      user.role === Role.ADMIN ||
      (user.role === Role.SUPERADMIN && viewerIsOwner))
  const showDangerZone = viewerIsSuperAdmin && user.role === Role.USER

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(user.adminOf.map(a => a.tournamentId)),
  )

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

  // Ban dialog state
  const [showBanDialog, setShowBanDialog] = useState(false)

  // Transitions
  const [isSavePending, startSaveTransition] = useTransition()
  const [isActionPending, startActionTransition] = useTransition()

  // Reset form when user changes
  useEffect(() => {
    reset({ displayName: user.displayName || '' })
    setSelectedIds(new Set(user.adminOf.map(a => a.tournamentId)))
    setConfirmAction(null)
  }, [user, reset])

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
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setConfirmAction(null)
    })
  }

  const handlePromote = () => {
    startActionTransition(async () => {
      const result = await promoteToAdmin({ userId: user.id })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setConfirmAction(null)
    })
  }

  const handlePromoteToSuperAdmin = () => {
    startActionTransition(async () => {
      const result = await promoteToSuperAdmin({ userId: user.id })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setConfirmAction(null)
    })
  }

  const handleDemote = () => {
    startActionTransition(async () => {
      const result = await demoteAdmin({ userId: user.id })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setConfirmAction(null)
    })
  }

  const handleDelete = () => {
    startActionTransition(async () => {
      const result = await deleteUser({ userId: user.id })
      if (result.success) {
        toast.success(result.message)
        router.push(ROUTES.ADMIN_USERS)
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setConfirmAction(null)
    })
  }

  // -- Role & Status badges --

  const getRoleBadge = () => {
    if (user.role === Role.SUPERADMIN) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
          <Crown className="size-3" />
          Super Admin
        </span>
      )
    }
    if (user.role === Role.ADMIN) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400">
          <ShieldCheck className="size-3" />
          Admin
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2.5 py-1 text-xs font-semibold text-zinc-400">
        Joueur
      </span>
    )
  }

  const getStatusBadge = () => {
    if (banned) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400">
          <Ban className="size-3" />
          {isPermanentBan ? 'Ban permanent' : 'Banni'}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
        Actif
      </span>
    )
  }

  const hasCustomDisplayName =
    user.displayName && user.displayName !== user.name

  return (
    <div className="space-y-6">
      {/* ── Profile Header ── */}
      <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={64}
                height={64}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-lg font-medium text-zinc-400">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
            {banned && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                <Ban className="size-5 text-red-400" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold text-white">
              {hasCustomDisplayName ? user.displayName : user.name}
            </h2>
            {hasCustomDisplayName && (
              <p className="truncate text-sm text-zinc-500">{user.name}</p>
            )}
            <p className="truncate text-sm text-zinc-400">{user.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {getRoleBadge()}
              {getStatusBadge()}
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/2 px-4 py-3">
            <Calendar className="size-4 shrink-0 text-zinc-500" />
            <div className="flex min-w-0 flex-col">
              <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                Inscrit le
              </span>
              <span className="text-sm text-zinc-300">
                {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/2 px-4 py-3">
            <ClipboardList className="size-4 shrink-0 text-zinc-500" />
            <div className="flex min-w-0 flex-col">
              <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                Inscriptions
              </span>
              <span className="text-sm text-zinc-300">
                {user.registrations.length} inscription
                {user.registrations.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          {user.discordId && (
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/2 px-4 py-3">
              <Hash className="size-4 shrink-0 text-zinc-500" />
              <div className="flex min-w-0 flex-col">
                <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                  Discord ID
                </span>
                <span className="truncate text-sm text-zinc-300">
                  {user.discordId}
                </span>
              </div>
            </div>
          )}
          {user.role === Role.ADMIN && (
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/2 px-4 py-3">
              <Trophy className="size-4 shrink-0 text-zinc-500" />
              <div className="flex min-w-0 flex-col">
                <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                  Tournois assignes
                </span>
                <span className="text-sm text-zinc-300">
                  {user.adminOf.length} tournoi
                  {user.adminOf.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Ban alert ── */}
      {banned && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300">
          {isPermanentBan ? (
            <p className="font-medium">Ban permanent</p>
          ) : (
            user.bannedUntil && (
              <p className="font-medium">
                Banni jusqu&apos;au {formatDate(user.bannedUntil)}
              </p>
            )
          )}
          {user.banReason ? (
            <p className="mt-1 text-red-400">Raison : {user.banReason}</p>
          ) : (
            <p className="mt-1 text-red-400/60">Aucune raison specifiee.</p>
          )}
        </div>
      )}

      {/* ── Registrations ── */}
      <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="size-4 text-zinc-500" />
          <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Inscriptions aux tournois ({user.registrations.length})
          </h3>
        </div>

        {user.registrations.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">
            Aucune inscription.
          </p>
        ) : (
          <div className="rounded-xl border border-white/5">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Tournoi
                  </TableHead>
                  <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                    Format
                  </TableHead>
                  <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                    Equipe
                  </TableHead>
                  <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                    Statut
                  </TableHead>
                  <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                    Date
                  </TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Lien</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.registrations.map(reg => {
                  const status = reg.tournament.status as TournamentStatus
                  const statusLabel =
                    TOURNAMENT_STATUS_LABELS[status] ?? reg.tournament.status
                  const statusClassName =
                    TOURNAMENT_STATUS_STYLES[status] ??
                    'bg-zinc-500/10 text-zinc-400'

                  return (
                    <TableRow
                      key={reg.id}
                      className="border-white/5 hover:bg-white/4"
                    >
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-200">
                          <Trophy className="size-3 shrink-0 text-zinc-500" />
                          {reg.tournament.title}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-xs text-zinc-400">
                          {reg.tournament.format === TournamentFormat.SOLO
                            ? 'Solo'
                            : 'Equipe'}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {reg.team ? (
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                            <Users className="size-3" />
                            {reg.team.name}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClassName}`}
                        >
                          {statusLabel}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs text-zinc-500">
                          {formatShortDate(reg.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`${ROUTES.ADMIN_REGISTRATIONS}?registrationId=${reg.id}`}
                          className="inline-flex items-center text-zinc-500 transition-colors hover:text-zinc-300"
                          aria-label={`Voir l'inscription au tournoi ${reg.tournament.title}`}
                        >
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── Modification ── */}
      {canEdit && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
            <div className="flex items-center gap-2">
              <Pencil className="size-4 text-zinc-500" />
              <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
                Modification
              </h3>
            </div>

            <div className="max-w-md space-y-1.5">
              <label
                htmlFor="userDisplayName"
                className="text-sm font-medium text-zinc-300"
              >
                Pseudo d&apos;affichage
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
                  Tournois assignes
                </p>
                {tournaments.length === 0 ? (
                  <p className="py-3 text-center text-sm text-zinc-500">
                    Aucun tournoi disponible.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {tournaments.map(tournament => {
                      const isChecked = selectedIds.has(tournament.id)
                      const tStatus = tournament.status as TournamentStatus
                      const statusLabel =
                        TOURNAMENT_STATUS_LABELS[tStatus] ?? tournament.status
                      const statusClassName =
                        TOURNAMENT_STATUS_STYLES[tStatus] ??
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

            <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-4">
              {showAssignments && (
                <p className="text-xs text-zinc-500">
                  {selectedIds.size} tournoi{selectedIds.size !== 1 ? 's' : ''}{' '}
                  selectionne
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

      {/* ── Role Management ── */}
      {showRoleManagement && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="size-4 text-zinc-500" />
            <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
              Gestion du role
            </h3>
          </div>

          <div className="space-y-3">
            {/* Promote USER -> ADMIN */}
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

            {/* Promote ADMIN -> SUPERADMIN (owner only) */}
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

            {/* Separator between promote and demote */}
            {user.role === Role.ADMIN && viewerIsOwner && (
              <div className="border-t border-white/5" />
            )}

            {/* Demote ADMIN -> USER */}
            {user.role === Role.ADMIN &&
              (confirmAction === 'demote' ? (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-400">
                    Les assignations de tournois seront supprimees.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      disabled={isActionPending}
                      onClick={handleDemote}
                      className="gap-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
                    >
                      {isActionPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ShieldOff className="size-4" />
                      )}
                      Confirmer la retrogradation
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
                  className="gap-2 text-orange-400 hover:text-orange-300"
                >
                  <ShieldOff className="size-4" />
                  Retrograder a joueur
                </Button>
              ))}

            {/* Demote SUPERADMIN -> ADMIN (owner only) */}
            {user.role === Role.SUPERADMIN &&
              viewerIsOwner &&
              (confirmAction === 'demoteSuperAdmin' ? (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-400">
                    Le super admin sera retrograde a admin.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      disabled={isActionPending}
                      onClick={handleDemote}
                      className="gap-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
                    >
                      {isActionPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ShieldOff className="size-4" />
                      )}
                      Confirmer la retrogradation
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
                  className="gap-2 text-orange-400 hover:text-orange-300"
                >
                  <ShieldOff className="size-4" />
                  Retrograder a admin
                </Button>
              ))}
          </div>
        </div>
      )}

      {/* ── Ban Management ── */}
      {showBanManagement && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <Ban className="size-4 text-zinc-500" />
            <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
              Gestion du ban
            </h3>
          </div>

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
                  Confirmer le deban
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
                Debannir
              </Button>
            )
          ) : (
            <Button
              size="sm"
              onClick={() => setShowBanDialog(true)}
              className="gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20"
            >
              <Ban className="size-4" />
              Bannir
            </Button>
          )}
        </div>
      )}

      {/* ── Danger Zone ── */}
      {showDangerZone && (
        <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Trash2 className="size-4 text-red-400/60" />
            <h3 className="text-sm font-medium uppercase tracking-wider text-red-400/60">
              Zone dangereuse
            </h3>
          </div>

          {confirmAction === 'delete' ? (
            <div className="space-y-2">
              <p className="text-xs text-red-400">
                Toutes les donnees associees (inscriptions, equipes, etc.)
                seront definitivement supprimees.
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
              Supprimer l&apos;utilisateur
            </Button>
          )}
        </div>
      )}

      {/* ── Ban Dialog ── */}
      <BanUserDialog
        userId={user.id}
        userName={user.name}
        open={showBanDialog}
        onOpenChange={setShowBanDialog}
      />
    </div>
  )
}
