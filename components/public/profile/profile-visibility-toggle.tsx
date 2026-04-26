/**
 * File: components/public/profile/profile-visibility-toggle.tsx
 * Description: Client toggle for switching user profile between public and private.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { updateProfileVisibility } from '@/lib/actions/profile'

interface ProfileVisibilityToggleProps {
  isPublic: boolean
}

export const ProfileVisibilityToggle = ({
  isPublic: initialIsPublic,
}: ProfileVisibilityToggleProps) => {
  const [isPending, startTransition] = useTransition()

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      const result = await updateProfileVisibility({ isPublic: checked })
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/2 px-4 py-3">
      {initialIsPublic ? (
        <Eye className="size-4 shrink-0 text-blue-400" />
      ) : (
        <EyeOff className="size-4 shrink-0 text-zinc-500" />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[10px] uppercase tracking-wider text-zinc-600">
          Visibilité du profil
        </span>
        <span className="text-sm text-zinc-300">
          {initialIsPublic ? 'Public' : 'Privé'}
        </span>
      </div>
      <Switch
        checked={initialIsPublic}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
    </div>
  )
}
