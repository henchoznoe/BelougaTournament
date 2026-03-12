/**
 * File: components/features/admin/user-detail/user-role-section.tsx
 * Description: Role management section with promote/demote actions and inline confirmations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Crown, Loader2, ShieldCheck, ShieldOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  demoteAdmin,
  promoteToAdmin,
  promoteToSuperAdmin,
} from '@/lib/actions/users'
import type { ActionState } from '@/lib/types/actions'
import type { UserDetail } from '@/lib/types/user'
import { isBanned } from '@/lib/utils/auth.helpers'
import { Role } from '@/prisma/generated/prisma/enums'

type RoleAction =
  | 'promote'
  | 'promoteSuperAdmin'
  | 'demote'
  | 'demoteSuperAdmin'

interface UserRoleSectionProps {
  user: UserDetail
  viewerRole: Role
  viewerIsOwner: boolean
}

export const UserRoleSection = ({
  user,
  viewerRole,
  viewerIsOwner,
}: UserRoleSectionProps) => {
  const router = useRouter()
  const viewerIsSuperAdmin = viewerRole === Role.SUPERADMIN
  const banned = isBanned(user.bannedUntil)
  const [confirmAction, setConfirmAction] = useState<RoleAction | null>(null)
  const [isActionPending, startActionTransition] = useTransition()

  const showRoleManagement =
    viewerIsSuperAdmin &&
    ((user.role === Role.USER && !banned) ||
      user.role === Role.ADMIN ||
      (user.role === Role.SUPERADMIN && viewerIsOwner))

  if (!showRoleManagement) return null

  const handleAction = (action: RoleAction) => {
    startActionTransition(async () => {
      let result: ActionState
      switch (action) {
        case 'promote':
          result = await promoteToAdmin({ userId: user.id })
          break
        case 'promoteSuperAdmin':
          result = await promoteToSuperAdmin({ userId: user.id })
          break
        case 'demote':
        case 'demoteSuperAdmin':
          result = await demoteAdmin({ userId: user.id })
          break
      }
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setConfirmAction(null)
    })
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="size-4 text-zinc-500" />
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Gestion du rôle
        </h2>
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
                onClick={() => handleAction('promote')}
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
                onClick={() => handleAction('promoteSuperAdmin')}
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
                Les assignations de tournois seront supprimées.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  disabled={isActionPending}
                  onClick={() => handleAction('demote')}
                  className="gap-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
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
              className="gap-2 text-orange-400 hover:text-orange-300"
            >
              <ShieldOff className="size-4" />
              Rétrograder à joueur
            </Button>
          ))}

        {/* Demote SUPERADMIN -> ADMIN (owner only) */}
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
                  onClick={() => handleAction('demoteSuperAdmin')}
                  className="gap-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
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
              className="gap-2 text-orange-400 hover:text-orange-300"
            >
              <ShieldOff className="size-4" />
              Rétrograder à admin
            </Button>
          ))}
      </div>
    </div>
  )
}
