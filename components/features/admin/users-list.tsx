/**
 * File: components/features/admin/users-list.tsx
 * Description: Client component displaying the admin users table with search, filters, pagination, and actions dropdown.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Ban, ChevronLeft, ChevronRight, Search, Trophy } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { UserActionsDropdown } from '@/components/features/admin/user-actions-dropdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RoleBadge } from '@/components/ui/role-badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
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
import { ROUTES } from '@/lib/config/routes'
import type { UserRow } from '@/lib/types/user'
import { isBanned } from '@/lib/utils/auth.helpers'
import { formatShortDate } from '@/lib/utils/formatting'
import { Role } from '@/prisma/generated/prisma/enums'

const PAGE_SIZE = 20

type RoleFilter = 'all' | Role
type StatusFilter = 'all' | 'active' | 'banned'

interface UsersListProps {
  users: UserRow[]
  viewerRole: Role
  viewerIsOwner: boolean
}

export const UsersList = ({
  users,
  viewerRole,
  viewerIsOwner,
}: UsersListProps) => {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let result = users

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter)
    }

    // Status filter
    if (statusFilter === 'active') {
      result = result.filter(u => !isBanned(u.bannedUntil))
    } else if (statusFilter === 'banned') {
      result = result.filter(u => isBanned(u.bannedUntil))
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        u =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.displayName?.toLowerCase().includes(q) ||
          u.discordId?.includes(q),
      )
    }

    return result
  }, [users, search, roleFilter, statusFilter])

  // Reset to page 1 when filters change
  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value as RoleFilter)
    setPage(1)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value as StatusFilter)
    setPage(1)
  }

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  const bannedCount = users.filter(u => isBanned(u.bannedUntil)).length

  return (
    <>
      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Rechercher un utilisateur..."
            aria-label="Rechercher un utilisateur"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="border-white/10 bg-white/5 pl-9 text-zinc-200 placeholder:text-zinc-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={roleFilter} onValueChange={handleRoleFilter}>
            <SelectTrigger
              aria-label="Filtrer par rôle"
              className="w-36 border-white/10 bg-white/5 text-zinc-200"
            >
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-950">
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value={Role.SUPERADMIN}>Super Admin</SelectItem>
              <SelectItem value={Role.ADMIN}>Admin</SelectItem>
              <SelectItem value={Role.USER}>Joueur</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger
              aria-label="Filtrer par statut"
              className="w-28 border-white/10 bg-white/5 text-zinc-200"
            >
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-950">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="banned">Bannis</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span>
          {filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''}
        </span>
        {bannedCount > 0 && (
          <span className="text-red-400">
            {bannedCount} banni{bannedCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Users table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-zinc-500">
            {search || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Aucun utilisateur trouvé pour ces critères.'
              : 'Aucun utilisateur inscrit.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Utilisateur
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                  Rôle
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                  Statut
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                  Inscriptions
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                  Tournois assignés
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 lg:table-cell">
                  Inscrit le
                </TableHead>
                <TableHead className="w-10 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(user => {
                const banned = isBanned(user.bannedUntil)

                return (
                  <TableRow
                    key={user.id}
                    tabIndex={0}
                    role="link"
                    className="cursor-pointer border-white/5 hover:bg-white/4"
                    onClick={() =>
                      router.push(ROUTES.ADMIN_USER_DETAIL(user.id))
                    }
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        router.push(ROUTES.ADMIN_USER_DETAIL(user.id))
                      }
                    }}
                  >
                    {/* User info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name}
                              width={32}
                              height={32}
                              className="size-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-zinc-400">
                              {user.name.charAt(0).toUpperCase()}
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
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Role badge */}
                    <TableCell className="hidden sm:table-cell">
                      <RoleBadge role={user.role} />
                    </TableCell>

                    {/* Status */}
                    <TableCell className="hidden sm:table-cell">
                      <StatusBadge bannedUntil={user.bannedUntil} />
                    </TableCell>

                    {/* Registrations count */}
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs text-zinc-400">
                        {user._count.registrations > 0 ? (
                          <>
                            {user._count.registrations} tournoi
                            {user._count.registrations > 1 ? 's' : ''}
                          </>
                        ) : (
                          <span className="text-zinc-600">&mdash;</span>
                        )}
                      </span>
                    </TableCell>

                    {/* Tournament assignments */}
                    <TableCell className="hidden md:table-cell">
                      {user.role === Role.SUPERADMIN ? (
                        <span className="text-xs text-zinc-500 italic">
                          Accès total
                        </span>
                      ) : user.role === Role.ADMIN ? (
                        user.adminOf.length === 0 ? (
                          <span className="text-xs text-zinc-600">Aucun</span>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex cursor-default items-center gap-1 text-xs text-zinc-400">
                                  <Trophy className="size-3" />
                                  {user.adminOf.length} tournoi
                                  {user.adminOf.length > 1 ? 's' : ''}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent
                                side="bottom"
                                className="max-w-64 border-white/10 bg-zinc-900 text-zinc-300"
                              >
                                <ul className="space-y-0.5 text-xs">
                                  {user.adminOf.map(a => (
                                    <li key={a.id}>{a.tournament.title}</li>
                                  ))}
                                </ul>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      ) : (
                        <span className="text-xs text-zinc-600">&mdash;</span>
                      )}
                    </TableCell>

                    {/* Created at */}
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs text-zinc-500">
                        {formatShortDate(user.createdAt)}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell onClick={e => e.stopPropagation()}>
                      <UserActionsDropdown
                        user={user}
                        viewerRole={viewerRole}
                        viewerIsOwner={viewerIsOwner}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {(safePage - 1) * PAGE_SIZE + 1}&ndash;
            {Math.min(safePage * PAGE_SIZE, filtered.length)} sur{' '}
            {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={safePage <= 1}
              onClick={() => setPage(p => p - 1)}
              aria-label="Page précédente"
              className="text-zinc-400"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-2 text-xs text-zinc-400">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage(p => p + 1)}
              aria-label="Page suivante"
              className="text-zinc-400"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
