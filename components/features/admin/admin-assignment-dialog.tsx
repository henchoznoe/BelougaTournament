/**
 * File: components/features/admin/admin-assignment-dialog.tsx
 * Description: Dialog for editing an admin's display name and tournament assignments (SUPERADMIN only).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, Trophy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { updateAdmin } from '@/lib/actions/admins'
import type { AdminUser, TournamentOption } from '@/lib/types/admin'
import { cn } from '@/lib/utils/cn'
import { updateAdminSchema } from '@/lib/validations/admins'

interface AdminEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  admin: AdminUser
  tournaments: TournamentOption[]
}

type FormInput = { displayName: string }

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Brouillon', className: 'bg-zinc-500/10 text-zinc-400' },
  PUBLISHED: {
    label: 'Publié',
    className: 'bg-emerald-500/10 text-emerald-400',
  },
  ARCHIVED: { label: 'Archivé', className: 'bg-amber-500/10 text-amber-400' },
}

export const AdminEditDialog = ({
  open,
  onOpenChange,
  admin,
  tournaments,
}: AdminEditDialogProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<FormInput>({
    resolver: zodResolver(
      updateAdminSchema.omit({ userId: true, tournamentIds: true }),
    ),
    defaultValues: { displayName: admin.displayName || '' },
    mode: 'onChange',
  })

  // Re-populate fields each time the dialog opens or the admin changes
  useEffect(() => {
    if (open) {
      reset({ displayName: admin.displayName || '' })
      setSelectedIds(new Set(admin.adminOf.map(a => a.tournamentId)))
    }
  }, [open, admin, reset])

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

  const originalIds = new Set(admin.adminOf.map(a => a.tournamentId))
  const assignmentsChanged =
    selectedIds.size !== originalIds.size ||
    [...selectedIds].some(id => !originalIds.has(id))
  const hasChanges = isDirty || assignmentsChanged

  const onSubmit = (data: FormInput) => {
    startTransition(async () => {
      const result = await updateAdmin({
        userId: admin.id,
        displayName: data.displayName,
        tournamentIds: [...selectedIds],
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

  const currentCount = selectedIds.size

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-white/10 bg-zinc-950 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            Modifier l'administrateur
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Modifiez les informations de{' '}
            <span className="font-medium text-zinc-200">{admin.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Display name field */}
          <div className="space-y-1.5">
            <label
              htmlFor="adminDisplayName"
              className="text-sm font-medium text-zinc-300"
            >
              Pseudo d'affichage
            </label>
            <Input
              id="adminDisplayName"
              {...register('displayName')}
              placeholder="Ex: AdminXYZ"
              className="border-white/10 bg-white/5 text-zinc-200 placeholder:text-zinc-600"
            />
            {errors.displayName && (
              <p className="text-xs text-red-400">
                {errors.displayName.message}
              </p>
            )}
          </div>

          {/* Separator */}
          <div className="border-t border-white/5" />

          {/* Tournament assignments */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-zinc-300">
              Tournois assignés
            </p>
            {tournaments.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-500">
                Aucun tournoi disponible.
              </p>
            ) : (
              <div className="max-h-60 space-y-1 overflow-y-auto">
                {tournaments.map(tournament => {
                  const isChecked = selectedIds.has(tournament.id)
                  const statusInfo = STATUS_LABELS[tournament.status] ?? {
                    label: tournament.status,
                    className: 'bg-zinc-500/10 text-zinc-400',
                  }

                  return (
                    <button
                      key={tournament.id}
                      type="button"
                      onClick={() => handleToggle(tournament.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                        isChecked
                          ? 'border-blue-500/30 bg-blue-500/5'
                          : 'border-white/5 bg-white/2 hover:border-white/10',
                      )}
                    >
                      <Checkbox
                        checked={isChecked}
                        tabIndex={-1}
                        className="pointer-events-none"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Trophy className="size-3 shrink-0 text-zinc-500" />
                          <span className="truncate text-sm font-medium text-zinc-200">
                            {tournament.title}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
            <p className="text-xs text-zinc-500">
              {currentCount} tournoi{currentCount !== 1 ? 's' : ''} sélectionné
              {currentCount !== 1 ? 's' : ''}
            </p>
            <Button
              type="submit"
              disabled={isPending || !isValid || !hasChanges}
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
