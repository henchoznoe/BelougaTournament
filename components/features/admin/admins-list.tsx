/**
 * File: components/features/admin/admins-list.tsx
 * Description: Client component displaying the admins table with actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Crown, Pencil, Plus, ShieldCheck, Trash2, Trophy } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { AdminEditDialog } from '@/components/features/admin/admin-assignment-dialog'
import { AdminDemoteDialog } from '@/components/features/admin/admin-demote-dialog'
import { AdminPromoteDialog } from '@/components/features/admin/admin-promote-dialog'
import { Button } from '@/components/ui/button'
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
import type { AdminUser, TournamentOption } from '@/lib/types/admin'
import { Role } from '@/prisma/generated/prisma/enums'

interface AdminsListProps {
  admins: AdminUser[]
  tournaments: TournamentOption[]
}

export const AdminsList = ({ admins, tournaments }: AdminsListProps) => {
  const [promoteOpen, setPromoteOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | undefined>()
  const [demotingAdmin, setDemotingAdmin] = useState<AdminUser | undefined>()

  return (
    <>
      {/* Header with promote button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {admins.length === 0
            ? 'Aucun administrateur.'
            : `${admins.length.toString()} administrateur${admins.length > 1 ? 's' : ''}`}
        </p>
        <Button
          onClick={() => setPromoteOpen(true)}
          className="gap-2 bg-blue-600 text-white hover:bg-blue-500"
        >
          <Plus className="size-4" />
          Promouvoir
        </Button>
      </div>

      {/* Admins table */}
      {admins.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Utilisateur
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                  Rôle
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                  Tournois assignés
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map(admin => (
                <TableRow
                  key={admin.id}
                  className="border-white/5 hover:bg-white/2"
                >
                  {/* User info */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                        {admin.image ? (
                          <Image
                            src={admin.image}
                            alt={admin.name}
                            width={32}
                            height={32}
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium text-zinc-400">
                            {admin.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {admin.name}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {admin.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Role badge */}
                  <TableCell className="hidden sm:table-cell">
                    {admin.role === Role.SUPERADMIN ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                        <Crown className="size-3" />
                        Super Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                        <ShieldCheck className="size-3" />
                        Admin
                      </span>
                    )}
                  </TableCell>

                  {/* Tournament assignments */}
                  <TableCell className="hidden md:table-cell">
                    {admin.role === Role.SUPERADMIN ? (
                      <span className="text-xs text-zinc-500 italic">
                        Accès total
                      </span>
                    ) : admin.adminOf.length === 0 ? (
                      <span className="text-xs text-zinc-600">Aucun</span>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex cursor-default items-center gap-1 text-xs text-zinc-400">
                              <Trophy className="size-3" />
                              {admin.adminOf.length} tournoi
                              {admin.adminOf.length > 1 ? 's' : ''}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            className="max-w-64 border-white/10 bg-zinc-900 text-zinc-300"
                          >
                            <ul className="space-y-0.5 text-xs">
                              {admin.adminOf.map(a => (
                                <li key={a.id}>{a.tournament.title}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {admin.role === Role.ADMIN && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditingAdmin(admin)}
                            className="text-zinc-400 hover:text-white"
                            aria-label="Gérer les tournois"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDemotingAdmin(admin)}
                            className="text-zinc-400 hover:text-red-400"
                            aria-label="Rétrograder"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      )}
                      {admin.role === Role.SUPERADMIN && (
                        <span className="px-2 text-xs text-zinc-600">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Promote dialog */}
      <AdminPromoteDialog open={promoteOpen} onOpenChange={setPromoteOpen} />

      {/* Edit dialog */}
      {editingAdmin && (
        <AdminEditDialog
          open={!!editingAdmin}
          onOpenChange={open => {
            if (!open) setEditingAdmin(undefined)
          }}
          admin={editingAdmin}
          tournaments={tournaments}
        />
      )}

      {/* Demote dialog */}
      {demotingAdmin && (
        <AdminDemoteDialog
          open={!!demotingAdmin}
          onOpenChange={open => {
            if (!open) setDemotingAdmin(undefined)
          }}
          admin={demotingAdmin}
        />
      )}
    </>
  )
}
