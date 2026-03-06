/**
 * File: components/features/admin/players-list.tsx
 * Description: Client component displaying the players table with search and ban actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Ban, ClipboardList, Pencil, Search, ShieldOff } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { PlayerBanDialog } from '@/components/features/admin/player-ban-dialog'
import { PlayerEditDialog } from '@/components/features/admin/player-edit-dialog'
import { PlayerUnbanDialog } from '@/components/features/admin/player-unban-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { PlayerRow } from '@/lib/types/player'
import { isBanned } from '@/lib/utils/auth.helpers'
import { formatDate } from '@/lib/utils/formatting'

interface PlayersListProps {
  players: PlayerRow[]
}

export const PlayersList = ({ players }: PlayersListProps) => {
  const [search, setSearch] = useState('')
  const [banningPlayer, setBanningPlayer] = useState<PlayerRow | undefined>()
  const [unbanningPlayer, setUnbanningPlayer] = useState<
    PlayerRow | undefined
  >()
  const [editingPlayer, setEditingPlayer] = useState<PlayerRow | undefined>()

  const filtered = useMemo(() => {
    if (!search) return players
    const q = search.toLowerCase()
    return players.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.displayName?.toLowerCase().includes(q) ||
        p.discordId?.includes(q),
    )
  }, [players, search])

  const bannedCount = players.filter(p => isBanned(p.bannedUntil)).length

  return (
    <>
      {/* Search + stats */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Rechercher un joueur..."
            aria-label="Rechercher un joueur"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-white/10 bg-white/5 pl-9 text-zinc-200 placeholder:text-zinc-600"
          />
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span>
            {players.length} joueur{players.length !== 1 ? 's' : ''}
          </span>
          {bannedCount > 0 && (
            <span className="text-red-400">
              {bannedCount} banni{bannedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Players table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-zinc-500">
            {search
              ? 'Aucun joueur trouvé pour cette recherche.'
              : 'Aucun joueur inscrit.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Joueur
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                  Statut
                </TableHead>
                <TableHead className="hidden text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                  Inscriptions
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 lg:table-cell">
                  Inscrit le
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(player => {
                const banned = isBanned(player.bannedUntil)
                const isPermanent =
                  player.bannedUntil &&
                  new Date(player.bannedUntil).getFullYear() >= 9999

                return (
                  <TableRow
                    key={player.id}
                    className="border-white/5 hover:bg-white/2"
                  >
                    {/* Player info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                          {player.image ? (
                            <Image
                              src={player.image}
                              alt={player.name}
                              width={32}
                              height={32}
                              className="size-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-zinc-400">
                              {player.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          {banned && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                              <Ban className="size-3.5 text-red-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-200">
                            {player.name}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {player.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="hidden sm:table-cell">
                      {banned ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                                <Ban className="size-3" />
                                {isPermanent ? 'Ban permanent' : 'Banni'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              className="max-w-64 border-white/10 bg-zinc-900 text-zinc-300"
                            >
                              <div className="space-y-1 text-xs">
                                {!isPermanent && player.bannedUntil && (
                                  <p>
                                    Jusqu'au {formatDate(player.bannedUntil)}
                                  </p>
                                )}
                                {player.banReason && (
                                  <p>Raison : {player.banReason}</p>
                                )}
                                {!player.banReason && (
                                  <p>Aucune raison spécifiée.</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          Actif
                        </span>
                      )}
                    </TableCell>

                    {/* Registrations count */}
                    <TableCell className="hidden text-center md:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                        <ClipboardList className="size-3" />
                        {player._count.registrations}
                      </span>
                    </TableCell>

                    {/* Created at */}
                    <TableCell className="hidden text-xs text-zinc-500 lg:table-cell">
                      {formatDate(player.createdAt)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditingPlayer(player)}
                          className="text-zinc-400 hover:text-white"
                          aria-label="Modifier"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        {banned ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setUnbanningPlayer(player)}
                            className="text-zinc-400 hover:text-emerald-400"
                            aria-label="Débannir"
                          >
                            <ShieldOff className="size-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setBanningPlayer(player)}
                            className="text-zinc-400 hover:text-red-400"
                            aria-label="Bannir"
                          >
                            <Ban className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Ban dialog */}
      {banningPlayer && (
        <PlayerBanDialog
          open={!!banningPlayer}
          onOpenChange={open => {
            if (!open) setBanningPlayer(undefined)
          }}
          player={banningPlayer}
        />
      )}

      {/* Unban dialog */}
      {unbanningPlayer && (
        <PlayerUnbanDialog
          open={!!unbanningPlayer}
          onOpenChange={open => {
            if (!open) setUnbanningPlayer(undefined)
          }}
          player={unbanningPlayer}
        />
      )}

      {/* Edit dialog */}
      {editingPlayer && (
        <PlayerEditDialog
          open={!!editingPlayer}
          onOpenChange={open => {
            if (!open) setEditingPlayer(undefined)
          }}
          player={editingPlayer}
        />
      )}
    </>
  )
}
