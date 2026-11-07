/**
 * File: components/admin/users/users-list.tsx
 * Description: Client component displaying the admin users table with search, role filter, sortable columns, and pagination.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { OctagonX, Search } from 'lucide-react'
import Image from 'next/image'
import { useMemo } from 'react'
import { useClientPagination } from '@/components/admin/hooks/use-client-pagination'
import { useListQuery } from '@/components/admin/hooks/use-list-query'
import {
  applySortToList,
  useListSort,
} from '@/components/admin/hooks/use-list-sort'
import { AdminPagination } from '@/components/admin/ui/admin-pagination'
import { PendingTableRow } from '@/components/admin/ui/pending-table-row'
import { UserActionsDropdown } from '@/components/admin/users/user-actions-dropdown'
import { Input } from '@/components/ui/input'
import { PendingLink as Link } from '@/components/ui/pending-link'
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
import { ADMIN_PAGE_SIZES } from '@/lib/config/constants'
import { ROUTES } from '@/lib/config/routes'
import type { UserRow } from '@/lib/types/user'
import {
  formatDateTime,
  formatShortDate,
  pluralize,
} from '@/lib/utils/formatting'
import { Role } from '@/prisma/generated/prisma/enums'

/** Returns true when a user is currently banned (active ban, not expired). */
const isRowBanned = (user: UserRow): boolean => {
  if (!user.bannedAt) return false
  if (!user.bannedUntil) return true
  return user.bannedUntil > new Date()
}

const SORT_KEYS = ['user', 'role', 'createdAt', 'lastLoginAt'] as const

const PAGE_SIZE = ADMIN_PAGE_SIZES.USERS

type RoleFilter = 'all' | Role
type SortKey = 'user' | 'role' | 'createdAt' | 'lastLoginAt'

interface UsersListProps {
  users: UserRow[]
  viewerIsSuperAdmin: boolean
}

const ROLE_WEIGHT: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 0,
  [Role.ADMIN]: 1,
  [Role.USER]: 2,
}

/** Default sort: super admins first, then admins, then alphabetical by name. */
const defaultSort = (a: UserRow, b: UserRow): number => {
  if (a.role !== b.role) {
    return ROLE_WEIGHT[a.role] - ROLE_WEIGHT[b.role]
  }
  return a.name.localeCompare(b.name)
}

const compareValues = (a: UserRow, b: UserRow, key: SortKey): number => {
  switch (key) {
    case 'user':
      return a.name.localeCompare(b.name)
    case 'role':
      if (a.role === b.role) return 0
      return ROLE_WEIGHT[a.role] - ROLE_WEIGHT[b.role]
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

export const UsersList = ({ users, viewerIsSuperAdmin }: UsersListProps) => {
  const [search, setSearch] = useListQuery<string>('search', '')
  const [roleFilter, setRoleFilter] = useListQuery<RoleFilter>(
    'role',
    'all',
    (value): value is RoleFilter =>
      value === 'all' || Object.values(Role).some(role => role === value),
  )

  const { paginate, resetPage } = useClientPagination<UserRow>(PAGE_SIZE)
  const { sort, handleSort, sortIndicator } = useListSort<SortKey>(
    resetPage,
    SORT_KEYS,
  )

  const filtered = useMemo(() => {
    let items = users

    if (roleFilter !== 'all') {
      items = items.filter(u => u.role === roleFilter)
    }

    if (search) {
      const searchQuery = search.toLowerCase()
      items = items.filter(
        u =>
          u.name.toLowerCase().includes(searchQuery) ||
          u.email.toLowerCase().includes(searchQuery) ||
          u.displayName?.toLowerCase().includes(searchQuery) ||
          u.discordId?.includes(searchQuery),
      )
    }

    return applySortToList(items, sort, compareValues, defaultSort)
  }, [users, search, roleFilter, sort])

  const {
    page,
    totalPages,
    paginated,
    rangeStart,
    rangeEnd,
    total,
    prevPage,
    nextPage,
  } = paginate(filtered)

  const handleSearch = (value: string) => {
    setSearch(value)
    resetPage()
  }

  const handleRoleFilter = (value: string) => {
    if (
      value === 'all' ||
      value === Role.SUPER_ADMIN ||
      value === Role.ADMIN ||
      value === Role.USER
    ) {
      setRoleFilter(value)
    }
    resetPage()
  }

  const superAdminCount = users.filter(t => t.role === Role.SUPER_ADMIN).length
  const adminCount = users.filter(t => t.role === Role.ADMIN).length
  const userCount = users.filter(t => t.role === Role.USER).length
  const bannedCount = users.filter(isRowBanned).length

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Rechercher un utilisateur..."
            aria-label="Rechercher un utilisateur"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="border-white/10 bg-white/5 pl-9 text-zinc-200 placeholder:text-zinc-400"
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
              <SelectItem value={Role.SUPER_ADMIN}>Super Admin</SelectItem>
              <SelectItem value={Role.ADMIN}>Admin</SelectItem>
              <SelectItem value={Role.USER}>Joueur</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats line */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
        <span className="mr-2">
          {filtered.length} utilisateur{pluralize(filtered.length)}
        </span>

        {superAdminCount > 0 && (
          <span className="text-amber-400">
            {superAdminCount} super admin{pluralize(superAdminCount)}
          </span>
        )}

        <span className="text-blue-400">
          {adminCount} admin{pluralize(adminCount)}
        </span>

        <span className="text-emerald-400">
          {userCount} joueur{pluralize(userCount)}
        </span>

        <span className="text-red-400">
          {bannedCount} banni{pluralize(bannedCount)}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-zinc-400">
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
                  className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-300"
                  onSort={() => handleSort('user')}
                  sortDirection={
                    sort.key === 'user' ? sort.direction : undefined
                  }
                >
                  Utilisateur {sortIndicator('user')}
                </TableHead>
                <TableHead
                  className="hidden cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-300 sm:table-cell"
                  onSort={() => handleSort('role')}
                  sortDirection={
                    sort.key === 'role' ? sort.direction : undefined
                  }
                >
                  Rôle {sortIndicator('role')}
                </TableHead>
                <TableHead
                  className="hidden cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-300 md:table-cell"
                  onSort={() => handleSort('createdAt')}
                  sortDirection={
                    sort.key === 'createdAt' ? sort.direction : undefined
                  }
                >
                  Inscrit le {sortIndicator('createdAt')}
                </TableHead>
                <TableHead
                  className="hidden cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-300 lg:table-cell"
                  onSort={() => handleSort('lastLoginAt')}
                  sortDirection={
                    sort.key === 'lastLoginAt' ? sort.direction : undefined
                  }
                >
                  Dernière connexion {sortIndicator('lastLoginAt')}
                </TableHead>
                <TableHead className="w-10 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(user => (
                <PendingTableRow
                  key={user.id}
                  href={ROUTES.ADMIN_USER_DETAIL(user.id)}
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
                        <Link
                          href={ROUTES.ADMIN_USER_DETAIL(user.id)}
                          className="inline-flex items-center text-sm font-semibold text-white hover:text-blue-300"
                        >
                          {user.name}
                        </Link>
                        <p className="text-xs text-zinc-400">
                          {isRowBanned(user) && (
                            <OctagonX
                              className="ml-1.5 inline size-3 text-red-400"
                              aria-label="Banni"
                            />
                          )}
                        </p>
                        <p className="truncate text-xs text-zinc-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="hidden sm:table-cell">
                    <RoleBadge role={user.role} />
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    <span className="text-xs text-zinc-400">
                      {formatShortDate(user.createdAt)}
                    </span>
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    <span className="text-xs text-zinc-400">
                      {user.lastLoginAt
                        ? formatDateTime(user.lastLoginAt)
                        : 'Jamais'}
                    </span>
                  </TableCell>

                  <TableCell onClick={e => e.stopPropagation()}>
                    <UserActionsDropdown
                      user={user}
                      viewerIsSuperAdmin={viewerIsSuperAdmin}
                    />
                  </TableCell>
                </PendingTableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdminPagination
        page={page}
        totalPages={totalPages}
        onPrev={prevPage}
        onNext={nextPage}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        total={total}
      />
    </>
  )
}
