/**
 * File: components/features/admin/user-detail/user-danger-section.tsx
 * Description: Danger zone section with delete user action and inline confirmation.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { deleteUser } from '@/lib/actions/users'
import { ROUTES } from '@/lib/config/routes'
import type { UserDetail } from '@/lib/types/user'
import { Role } from '@/prisma/generated/prisma/enums'

interface UserDangerSectionProps {
  user: UserDetail
  viewerRole: Role
}

export const UserDangerSection = ({
  user,
  viewerRole,
}: UserDangerSectionProps) => {
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isActionPending, startActionTransition] = useTransition()

  if (viewerRole !== Role.SUPERADMIN || user.role !== Role.USER) return null

  const handleDelete = () => {
    startActionTransition(async () => {
      const result = await deleteUser({ userId: user.id })
      if (result.success) {
        toast.success(result.message)
        router.push(ROUTES.ADMIN_USERS)
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setConfirmDelete(false)
    })
  }

  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Trash2 className="size-4 text-red-400/60" />
        <h2 className="text-sm font-medium uppercase tracking-wider text-red-400/60">
          Zone dangereuse
        </h2>
      </div>

      {confirmDelete ? (
        <div className="space-y-2">
          <p className="text-xs text-red-400">
            Toutes les données associées (inscriptions, équipes, etc.) seront
            définitivement supprimées.
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
              onClick={() => setConfirmDelete(false)}
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
          onClick={() => setConfirmDelete(true)}
          className="gap-2 text-red-400 hover:text-red-300"
        >
          <Trash2 className="size-4" />
          Supprimer l&apos;utilisateur
        </Button>
      )}
    </div>
  )
}
