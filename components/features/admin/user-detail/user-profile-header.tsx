/**
 * File: components/features/admin/user-detail/user-profile-header.tsx
 * Description: Profile header section displaying user avatar, name, email, role badge, and info cards.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Calendar, ClipboardList, Clock3, Hash } from 'lucide-react'
import Image from 'next/image'
import { RoleBadge } from '@/components/ui/role-badge'
import type { UserDetail } from '@/lib/types/user'
import { formatDate, formatDateTime } from '@/lib/utils/formatting'

interface UserProfileHeaderProps {
  user: UserDetail
}

export const UserProfileHeader = ({ user }: UserProfileHeaderProps) => {
  const hasCustomDisplayName =
    user.displayName && user.displayName !== user.name

  return (
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
            <RoleBadge role={user.role} size="md" />
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
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
          <Clock3 className="size-4 shrink-0 text-zinc-500" />
          <div className="flex min-w-0 flex-col">
            <span className="text-[10px] uppercase tracking-wider text-zinc-600">
              Dernière connexion
            </span>
            <span className="text-sm text-zinc-300">
              {user.lastLoginAt
                ? formatDateTime(user.lastLoginAt)
                : 'Aucune connexion enregistrée'}
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
      </div>
    </div>
  )
}
