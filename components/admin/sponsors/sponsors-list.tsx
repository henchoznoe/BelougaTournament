/**
 * File: components/admin/sponsors/sponsors-list.tsx
 * Description: Client component displaying the sponsors table with search, status filter, sortable columns, and pagination.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ExternalLink, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useClientPagination } from '@/components/admin/hooks/use-client-pagination'
import {
  applySortToList,
  useListSort,
} from '@/components/admin/hooks/use-list-sort'
import { SponsorActionsDropdown } from '@/components/admin/sponsors/sponsor-actions-dropdown'
import { AdminPagination } from '@/components/admin/ui/admin-pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { cn } from '@/lib/utils/cn'
import { formatShortDate } from '@/lib/utils/formatting'
import type { Sponsor } from '@/prisma/generated/prisma/client'

const PAGE_SIZE = 8

type StatusFilter = 'all' | 'enabled' | 'disabled'
type SortKey = 'name' | 'supportedSince' | 'enabled'

interface SponsorsListProps {
  sponsors: Sponsor[]
}

/** Default sort: most recently partnered first. */
const defaultSort = (a: Sponsor, b: Sponsor): number => {
  return (
    new Date(b.supportedSince).getTime() - new Date(a.supportedSince).getTime()
  )
}

const compareValues = (a: Sponsor, b: Sponsor, key: SortKey): number => {
  switch (key) {
    case 'name':
      return a.name.localeCompare(b.name, 'fr')
    case 'supportedSince':
      return (
        new Date(a.supportedSince).getTime() -
        new Date(b.supportedSince).getTime()
      )
    case 'enabled':
      return Number(a.enabled) - Number(b.enabled)
  }
}

export const SponsorsList = ({ sponsors }: SponsorsListProps) => {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const { paginate, resetPage } = useClientPagination<Sponsor>(PAGE_SIZE)
  const { sort, handleSort, sortIndicator } = useListSort<SortKey>(resetPage)

  const filtered = useMemo(() => {
    let result = sponsors

    if (statusFilter === 'enabled') {
      result = result.filter(s => s.enabled)
    } else if (statusFilter === 'disabled') {
      result = result.filter(s => !s.enabled)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(s => s.name.toLowerCase().includes(q))
    }

    return applySortToList(result, sort, compareValues, defaultSort)
  }, [sponsors, search, statusFilter, sort])

  const { page, totalPages, paginated, prevPage, nextPage } = paginate(filtered)

  const handleSearch = (value: string) => {
    setSearch(value)
    resetPage()
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value as StatusFilter)
    resetPage()
  }

  const enabledCount = sponsors.filter(s => s.enabled).length
  const disabledCount = sponsors.filter(s => !s.enabled).length

  return (
    <>
      {/* Search + status filter + create button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Rechercher un sponsor..."
            aria-label="Rechercher un sponsor"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="border-white/10 bg-white/5 pl-9 text-zinc-200 placeholder:text-zinc-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger
              aria-label="Filtrer par statut"
              className="w-28 border-white/10 bg-white/5 text-zinc-200"
            >
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-950">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="enabled">Activé</SelectItem>
              <SelectItem value="disabled">Désactivé</SelectItem>
            </SelectContent>
          </Select>
          <Button
            asChild
            className="gap-2 bg-blue-600 text-white hover:bg-blue-500"
          >
            <Link href={ROUTES.ADMIN_SPONSOR_NEW}>
              <Plus className="size-4" />
              Créer
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats line */}
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span className="mr-2">
          {sponsors.length} sponsor{sponsors.length !== 1 ? 's' : ''}
        </span>

        <span className="text-emerald-400">
          {enabledCount} activé{enabledCount !== 1 ? 's' : ''}
        </span>

        <span className="text-zinc-400">
          {disabledCount} désactivé{disabledCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-zinc-500">
            {search || statusFilter !== 'all'
              ? 'Aucun sponsor trouvé pour ces critères.'
              : 'Aucun sponsor pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead
                  className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-300"
                  onClick={() => handleSort('name')}
                >
                  Nom {sortIndicator('name')}
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                  Lien
                </TableHead>
                <TableHead
                  className="hidden cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-300 sm:table-cell"
                  onClick={() => handleSort('supportedSince')}
                >
                  Depuis {sortIndicator('supportedSince')}
                </TableHead>
                <TableHead
                  className="hidden cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-300 md:table-cell"
                  onClick={() => handleSort('enabled')}
                >
                  Statut {sortIndicator('enabled')}
                </TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(sponsor => (
                <TableRow
                  key={sponsor.id}
                  tabIndex={0}
                  role="link"
                  className="cursor-pointer border-white/5 hover:bg-white/4"
                  onClick={() =>
                    router.push(ROUTES.ADMIN_SPONSOR_DETAIL(sponsor.id))
                  }
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      router.push(ROUTES.ADMIN_SPONSOR_DETAIL(sponsor.id))
                    }
                  }}
                >
                  <TableCell className="font-medium text-zinc-200">
                    {sponsor.name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {sponsor.url ? (
                      <a
                        href={sponsor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                      >
                        <ExternalLink className="size-3" />
                        <span className="max-w-48 truncate">{sponsor.url}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-600">&mdash;</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm text-zinc-400 sm:table-cell">
                    {formatShortDate(sponsor.supportedSince)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-medium',
                        sponsor.enabled
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-zinc-500/10 text-zinc-400',
                      )}
                    >
                      {sponsor.enabled ? 'Activé' : 'Désactivé'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <SponsorActionsDropdown sponsor={sponsor} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        onPrev={prevPage}
        onNext={nextPage}
      />
    </>
  )
}
