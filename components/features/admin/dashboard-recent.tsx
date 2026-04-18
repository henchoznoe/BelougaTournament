/**
 * File: components/features/admin/dashboard-recent.tsx
 * Description: Dashboard panels showing recent logins and recent registrations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { LogIn, Trophy } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { RoleBadge } from '@/components/ui/role-badge'
import { ROUTES } from '@/lib/config/routes'
import type { RecentLogin, RecentRegistration } from '@/lib/types/dashboard'
import { formatDateTime } from '@/lib/utils/formatting'

interface RecentLoginsProps {
  logins: RecentLogin[]
}

interface RecentRegistrationsProps {
  registrations: RecentRegistration[]
}

export const DashboardRecentLogins = ({ logins }: RecentLoginsProps) => {
  return (
    <div className="flex flex-col rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <LogIn className="size-4 text-emerald-400" />
        <h2 className="text-sm font-semibold text-white">
          Connexions récentes
        </h2>
      </div>

      {logins.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-500">
          Aucune connexion récente.
        </p>
      ) : (
        <div className="max-h-105 space-y-2 overflow-y-auto pr-1">
          {logins.map(user => (
            <Link
              key={user.id}
              href={ROUTES.ADMIN_USER_DETAIL(user.id)}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={28}
                    height={28}
                    className="size-7 shrink-0 rounded-full"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {user.displayName}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="truncate text-xs text-zinc-500">
                      {user.name}
                    </span>
                    <RoleBadge role={user.role} />
                  </div>
                </div>
              </div>
              <span className="ml-4 shrink-0 text-[10px] text-zinc-600">
                {formatDateTime(user.lastLoginAt)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export const DashboardRecentRegistrations = ({
  registrations,
}: RecentRegistrationsProps) => {
  return (
    <div className="flex flex-col rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="size-4 text-sky-400" />
        <h2 className="text-sm font-semibold text-white">
          Inscriptions récentes aux tournois
        </h2>
      </div>

      {registrations.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-500">
          Aucune inscription récente.
        </p>
      ) : (
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {registrations.map(reg => (
            <Link
              key={reg.id}
              href={ROUTES.ADMIN_TOURNAMENT_DETAIL(reg.tournament.slug)}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {reg.user.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  {reg.tournament.title}
                </p>
              </div>
              <span className="ml-4 shrink-0 text-[10px] text-zinc-600">
                {formatDateTime(reg.createdAt)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
