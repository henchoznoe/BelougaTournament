/**
 * File: components/features/admin/user-detail/user-ban-section.tsx
 * Description: Ban management section with ban/unban actions and inline confirmation.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Ban, Loader2, ShieldOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { BanUserDialog } from '@/components/features/admin/ban-user-dialog'
import { Button } from '@/components/ui/button'
import { unbanUser } from '@/lib/actions/users'
import type { UserDetail } from '@/lib/types/user'
import { isBanned } from '@/lib/utils/auth.helpers'
import { Role } from '@/prisma/generated/prisma/enums'

interface UserBanSectionProps {
  user: UserDetail
}

export const UserBanSection = ({ user }: UserBanSectionProps) => {
  const router = useRouter()
  const banned = isBanned(user.bannedUntil)
  const [confirmUnban, setConfirmUnban] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [isActionPending, startActionTransition] = useTransition()

  if (user.role !== Role.USER) return null

  const handleUnban = () => {
    startActionTransition(async () => {
      const result = await unbanUser({ userId: user.id })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setConfirmUnban(false)
    })
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Ban className="size-4 text-zinc-500" />
        <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Gestion du ban
        </h3>
      </div>

      {banned ? (
        confirmUnban ? (
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
              onClick={() => setConfirmUnban(false)}
              disabled={isActionPending}
              className="text-zinc-500"
            >
              Annuler
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => setConfirmUnban(true)}
            className="gap-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
          >
            <ShieldOff className="size-4" />
            Débannir
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

      <BanUserDialog
        userId={user.id}
        userName={user.name}
        open={showBanDialog}
        onOpenChange={setShowBanDialog}
      />
    </div>
  )
}
