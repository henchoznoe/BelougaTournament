/**
 * File: components/features/admin/team-detail.tsx
 * Description: Page component for viewing team details with member list and admin actions (kick, promote, dissolve).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  Calendar,
  Crown,
  Loader2,
  Trash2,
  UserMinus,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { adminPromoteCaptain } from '@/lib/actions/registrations'
import { dissolveTeam, kickPlayer } from '@/lib/actions/tournaments'
import { ROUTES } from '@/lib/config/routes'
import type { TeamItem } from '@/lib/types/tournament'
import { formatDateTime } from '@/lib/utils/formatting'

interface TeamDetailProps {
  team: TeamItem
  tournamentId: string
  slug: string
}

export const TeamDetail = ({ team, tournamentId, slug }: TeamDetailProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Kick member state
  const [confirmKickUserId, setConfirmKickUserId] = useState<
    string | undefined
  >()

  // Promote captain state
  const [confirmPromoteUserId, setConfirmPromoteUserId] = useState<
    string | undefined
  >()

  // Dissolve team state
  const [confirmDissolve, setConfirmDissolve] = useState(false)

  const handleKick = (userId: string) => {
    startTransition(async () => {
      const result = await kickPlayer({ tournamentId, teamId: team.id, userId })
      if (result.success) {
        toast.success(result.message)
        router.push(ROUTES.ADMIN_TOURNAMENT_TEAMS(slug))
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setConfirmKickUserId(undefined)
    })
  }

  const handlePromote = (userId: string) => {
    startTransition(async () => {
      const result = await adminPromoteCaptain({ teamId: team.id, userId })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setConfirmPromoteUserId(undefined)
    })
  }

  const handleDissolve = () => {
    startTransition(async () => {
      const result = await dissolveTeam({ tournamentId, teamId: team.id })
      if (result.success) {
        toast.success(result.message)
        router.push(ROUTES.ADMIN_TOURNAMENT_TEAMS(slug))
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setConfirmDissolve(false)
    })
  }

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Users className="size-6 text-zinc-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-white">
              {team.name}
            </h2>
            <p className="text-sm text-zinc-400">
              {team.members.length} membre{team.members.length !== 1 ? 's' : ''}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {team.isFull ? (
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                  Complète
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">
                  Incomplète
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Informations */}
      <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Informations
        </p>
        <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <Calendar className="size-3 shrink-0 text-zinc-600" />
            <span>Créée le {formatDateTime(team.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <Crown className="size-3 shrink-0 text-amber-400" />
            <span className="truncate">
              Capitaine : {team.captain.displayName}
            </span>
          </div>
        </div>
      </div>

      {/* Members list */}
      <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Membres
        </p>
        <div className="space-y-1">
          {team.members.map(member => {
            const isCaptain = member.user.id === team.captain.id
            const isConfirmingKick = confirmKickUserId === member.user.id
            const isConfirmingPromote = confirmPromoteUserId === member.user.id

            return (
              <div key={member.id}>
                <div className="flex items-center gap-3 rounded-lg px-3 py-2">
                  {/* Avatar */}
                  <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                    {member.user.image ? (
                      <Image
                        src={member.user.image}
                        alt={member.user.name}
                        width={32}
                        height={32}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-zinc-400">
                        {member.user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name + join date */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-200">
                      {member.user.displayName}
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      Rejoint le {formatDateTime(member.joinedAt)}
                    </p>
                  </div>

                  {/* Captain badge */}
                  {isCaptain && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                      <Crown className="size-3" />
                      Capitaine
                    </span>
                  )}

                  {/* Actions for non-captain members */}
                  {!isCaptain && !isConfirmingKick && !isConfirmingPromote && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setConfirmPromoteUserId(member.user.id)}
                        disabled={isPending}
                        className="text-zinc-500 hover:text-amber-400"
                        aria-label={`Promouvoir ${member.user.displayName} capitaine`}
                      >
                        <Crown className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setConfirmKickUserId(member.user.id)}
                        disabled={isPending}
                        className="text-zinc-500 hover:text-red-400"
                        aria-label={`Retirer ${member.user.displayName}`}
                      >
                        <UserMinus className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Inline confirm: kick */}
                {isConfirmingKick && (
                  <div className="ml-14 space-y-2 pb-2">
                    <p className="text-xs text-red-400">
                      Retirer {member.user.displayName} de l'équipe ? Son
                      inscription sera supprimée.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleKick(member.user.id)}
                        disabled={isPending}
                        className="h-7 gap-1.5 bg-red-600 text-xs text-white hover:bg-red-500"
                      >
                        {isPending ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <UserMinus className="size-3" />
                        )}
                        Confirmer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmKickUserId(undefined)}
                        disabled={isPending}
                        className="h-7 text-xs text-zinc-500"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}

                {/* Inline confirm: promote */}
                {isConfirmingPromote && (
                  <div className="ml-14 space-y-2 pb-2">
                    <p className="text-xs text-amber-400">
                      Promouvoir {member.user.displayName} capitaine de{' '}
                      {team.name} ?
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handlePromote(member.user.id)}
                        disabled={isPending}
                        className="h-7 gap-1.5 bg-amber-600 text-xs text-white hover:bg-amber-500"
                      >
                        {isPending ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Crown className="size-3" />
                        )}
                        Confirmer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmPromoteUserId(undefined)}
                        disabled={isPending}
                        className="h-7 text-xs text-zinc-500"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-red-400/60">
          Zone dangereuse
        </p>

        {confirmDissolve ? (
          <div className="space-y-2">
            <p className="text-xs text-red-400">
              Dissoudre l'équipe {team.name} ? Tous les membres (
              {team.members.length}) seront désinscris du tournoi. Cette action
              est irréversible.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                disabled={isPending}
                onClick={handleDissolve}
                className="gap-2 bg-red-600 text-white hover:bg-red-500"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Confirmer la dissolution
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDissolve(false)}
                disabled={isPending}
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
            onClick={() => setConfirmDissolve(true)}
            className="gap-2 text-red-400 hover:text-red-300"
          >
            <Trash2 className="size-4" />
            Dissoudre l'équipe
          </Button>
        )}
      </div>
    </div>
  )
}
