/**
 * File: components/features/admin/user-detail/user-edit-section.tsx
 * Description: Edit section with displayName form and tournament assignment picker for admin users.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Loader2, Pencil, Save, Trophy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateUser } from '@/lib/actions/users'
import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_STATUS_STYLES,
} from '@/lib/config/constants'
import type { TournamentOption, UserDetail } from '@/lib/types/user'
import { cn } from '@/lib/utils/cn'
import { updateUserSchema } from '@/lib/validations/users'
import { Role } from '@/prisma/generated/prisma/enums'

type FormInput = { displayName: string }

interface UserEditSectionProps {
  user: UserDetail
  tournaments: TournamentOption[]
  viewerRole: Role
}

export const UserEditSection = ({
  user,
  tournaments,
  viewerRole,
}: UserEditSectionProps) => {
  const router = useRouter()
  const viewerIsSuperAdmin = viewerRole === Role.SUPERADMIN
  const showAssignments = user.role === Role.ADMIN && viewerIsSuperAdmin
  const [isSavePending, startSaveTransition] = useTransition()

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

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(user.adminOf.map(a => a.tournamentId)),
  )

  useEffect(() => {
    reset({ displayName: user.displayName || '' })
    setSelectedIds(new Set(user.adminOf.map(a => a.tournamentId)))
  }, [user, reset])

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

  return (
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
            <p className="text-xs text-red-400">{errors.displayName.message}</p>
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
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {tournaments.map(tournament => {
                  const isChecked = selectedIds.has(tournament.id)
                  const statusLabel =
                    TOURNAMENT_STATUS_LABELS[tournament.status] ??
                    tournament.status
                  const statusClassName =
                    TOURNAMENT_STATUS_STYLES[tournament.status] ??
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
              sélectionné
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
  )
}
