/**
 * File: components/features/profile/profile-page.tsx
 * Description: Server Component displaying user profile information and active inscriptions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import {
  Calendar,
  ChevronRight,
  Lock,
  Mail,
  Shield,
  Trophy,
  User,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ProfileEditForm } from '@/components/features/profile/profile-edit-form'
import { ProfileRegistrations } from '@/components/features/profile/profile-registrations'
import { ROUTES } from '@/lib/config/routes'
import { getSession } from '@/lib/services/auth'
import { getUserRegistrations } from '@/lib/services/tournaments'
import { getUserProfile } from '@/lib/services/users'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/formatting'
import { Role } from '@/prisma/generated/prisma/enums'

const ROLE_CONFIG = {
  [Role.USER]: {
    label: 'Joueur',
    icon: User,
    className: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
  },
  [Role.ADMIN]: {
    label: 'Admin',
    icon: Shield,
    className: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  },
} as const

export const ProfilePage = async () => {
  const session = await getSession()

  if (!session) {
    redirect(ROUTES.LOGIN)
  }

  const [dbUser, registrations] = await Promise.all([
    getUserProfile(session.user.id),
    getUserRegistrations(session.user.id),
  ])

  if (!dbUser) {
    redirect(ROUTES.LOGIN)
  }

  const roleConfig = ROLE_CONFIG[dbUser.role]
  const RoleIcon = roleConfig.icon

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Card 1: Profile Info */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            {dbUser.image ? (
              <Image
                src={dbUser.image}
                alt={dbUser.displayName || dbUser.name}
                width={96}
                height={96}
                className="rounded-full ring-2 ring-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-full bg-zinc-800 ring-2 ring-blue-500/20">
                <User className="size-10 text-zinc-500" />
              </div>
            )}
            {/* Online-style accent dot */}
            <div className="absolute bottom-1 right-1 size-4 rounded-full border-2 border-zinc-950 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          </div>

          {/* Info */}
          <div className="flex min-w-0 flex-1 flex-col items-center gap-4 sm:items-start">
            <div className="text-center sm:text-left">
              <h2 className="font-paladins text-2xl tracking-wider text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                {dbUser.displayName || dbUser.name}
              </h2>
              <div
                className={cn(
                  'mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
                  roleConfig.className,
                )}
              >
                <RoleIcon className="size-3" />
                {roleConfig.label}
              </div>
            </div>

            {/* Details grid */}
            <div className="grid w-full gap-3">
              {/* Display name (editable) */}
              <ProfileEditForm
                currentDisplayName={dbUser.displayName || dbUser.name}
              />

              {/* Discord name (read-only) */}
              <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/2 px-4 py-3">
                <User className="size-4 shrink-0 text-zinc-500" />
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Discord
                  </span>
                  <span className="text-sm text-zinc-300">{dbUser.name}</span>
                </div>
                <Lock className="ml-auto size-3.5 shrink-0 text-zinc-600" />
              </div>

              {/* Email */}
              <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/2 px-4 py-3">
                <Mail className="size-4 shrink-0 text-zinc-500" />
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Mail
                  </span>
                  <span className="truncate text-sm text-zinc-300">
                    {dbUser.email}
                  </span>
                </div>
                <Lock className="ml-auto size-3.5 shrink-0 text-zinc-600" />
              </div>

              {/* Member since */}
              <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/2 px-4 py-3">
                <Calendar className="size-4 shrink-0 text-zinc-500" />
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Inscription
                  </span>
                  <span className="text-sm text-zinc-300">
                    Membre depuis le {formatDate(dbUser.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Mes inscriptions */}
      <div
        id="inscriptions"
        className="relative scroll-mt-32 overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8"
      >
        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-white/5 bg-white/5">
              <Trophy className="size-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Mes inscriptions</h3>
              <p className="text-xs text-zinc-500">
                {registrations.length > 0
                  ? `${registrations.length} tournoi${registrations.length > 1 ? 's' : ''} en cours`
                  : 'Aucune inscription active'}
              </p>
            </div>
          </div>

          {registrations.length > 0 ? (
            <ProfileRegistrations registrations={registrations} />
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="max-w-sm text-sm text-zinc-500">
                Vous n'êtes inscrit à aucun tournoi pour le moment.
              </p>
              <Link
                href={ROUTES.TOURNAMENTS}
                className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/10"
              >
                Voir les tournois
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Link to tournament history page */}
      <Link
        href={ROUTES.PROFILE_TOURNAMENTS}
        className="group flex items-center justify-between rounded-3xl border border-white/5 bg-white/2 px-6 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl transition-colors duration-200 hover:border-white/10 hover:bg-white/4"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-white/5 bg-white/5">
            <Trophy className="size-5 text-zinc-400" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">Mes Tournois</span>
            <p className="text-xs text-zinc-500">
              Consultez votre historique de participations
            </p>
          </div>
        </div>
        <ChevronRight className="size-5 text-zinc-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-zinc-400" />
      </Link>
    </div>
  )
}
