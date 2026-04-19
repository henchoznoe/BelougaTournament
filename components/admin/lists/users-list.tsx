/**
 * File: components/admin/lists/users-list.tsx
 * Description: Client component displaying the admin users table with search, role filter, sortable columns, and pagination.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import {
  applySortToList,
  useListSort,
} from '@/components/admin/lists/use-list-sort'
import { UserActionsDropdown } from '@/components/admin/ui/user-actions-dropdown'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ROUTES } from '@/lib/config/routes'
import type { UserRow } from '@/lib/types/user'
import { formatDateTime, formatShortDate } from '@/lib/utils/formatting'
import { Role } from '@/prisma/generated/prisma/enums'

const PAGE_SIZE = 20

type RoleFilter = 'all' | Role
type SortKey = 'user' | 'role' | 'createdAt' | 'lastLoginAt'

interface UsersListProps {
  users: UserRow[]
  viewerIsOwner: boolean
}

/** Default sort: admins first, then alphabetical by name. */
const defaultSort = (a: UserRow, b: UserRow): number => {
  if (a.role !== b.role) {
    return a.role === Role.ADMIN ? -1 : 1
  }
  return a.name.localeCompare(b.name)
}

const compareValues = (a: UserRow, b: UserRow, key: SortKey): number => {
  switch (key) {
    case 'user':
      return a.name.localeCompare(b.name)
    case 'role':
      if (a.role === b.role) return 0
      return a.role === Role.ADMIN ? -1 : 1
    case 'createdAt':
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    case 'lastLoginAt': {
      const aTime = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0
      const bTime = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0
      return aTime - bTime
    }
    default:
      return 0
  }
}

export const UsersList = ({ users, viewerIsOwner }: UsersListProps) => {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [page, setPage] = useState(1)
  const resetPage = useCallback(() => setPage(1), [])
  const { sort, handleSort, sortIndicator } = useListSort<SortKey>(resetPage)

  const filtered = useMemo(() => {
    let result = users

    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter)
    }

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

    return applySortToList(result, sort, compareValues, defaultSort)
  }, [users, search, roleFilter, sort])

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value as RoleFilter)
    setPage(1)
  }

  const adminCount = users.filter(t => t.role === Role.ADMIN).length
  const userCount = users.filter(t => t.role === Role.USER).length

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  return (
    <>
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
              className="w-28 border-white/10 bg-white/5 text-zinc-200"
            >
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-950">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value={Role.ADMIN}>Admin</SelectItem>
              <SelectItem value={Role.USER}>Joueur</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats line */}
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span className="mr-2">
          {filtered.length} utilisateur{filtered.length > 0 ? 's' : ''}
        </span>

        <span className="text-amber-400">
          {adminCount} admin{adminCount > 0 ? 's' : ''}
        </span>

        <span className="text-emerald-400">
          {userCount} joueur{userCount > 0 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-zinc-500">
            {search || roleFilter !== 'all'
              ? 'Aucun utilisateur trouvé pour ces critères.'
              : 'Aucun utilisateur inscrit.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead
                  className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
                  onClick={() => handleSort('user')}
                >
                  Utilisateur {sortIndicator('user')}
                </TableHead>
                <TableHead
                  className="hidden cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 sm:table-cell"
                  onClick={() => handleSort('role')}
                >
                  Rôle {sortIndicator('role')}
                </TableHead>
                <TableHead
                  className="hidden cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 md:table-cell"
                  onClick={() => handleSort('createdAt')}
                >
                  Inscrit le {sortIndicator('createdAt')}
                </TableHead>
                <TableHead
                  className="hidden cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 lg:table-cell"
                  onClick={() => handleSort('lastLoginAt')}
                >
                  Dernière connexion {sortIndicator('lastLoginAt')}
                </TableHead>
                <TableHead className="w-10 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(user => (
                <TableRow
                  key={user.id}
                  tabIndex={0}
                  role="link"
                  className="cursor-pointer border-white/5 hover:bg-white/4"
                  onClick={() => router.push(ROUTES.ADMIN_USER_DETAIL(user.id))}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      router.push(ROUTES.ADMIN_USER_DETAIL(user.id))
                    }
                  }}
                >
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

                  <TableCell className="hidden sm:table-cell">
                    <RoleBadge role={user.role} />
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    <span className="text-xs text-zinc-500">
                      {formatShortDate(user.createdAt)}
                    </span>
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    <span className="text-xs text-zinc-500">
                      {user.lastLoginAt
                        ? formatDateTime(user.lastLoginAt)
                        : 'Jamais'}
                    </span>
                  </TableCell>

                  <TableCell onClick={e => e.stopPropagation()}>
                    <UserActionsDropdown
                      user={user}
                      viewerIsOwner={viewerIsOwner}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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
