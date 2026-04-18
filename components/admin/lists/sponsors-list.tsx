/**
 * File: components/admin/lists/sponsors-list.tsx
 * Description: Client component displaying the sponsors table with search, status filter, sortable columns, and pagination.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Plus,
  Search,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { SponsorActionsDropdown } from '@/components/admin/ui/sponsor-actions-dropdown'
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
import { formatShortDate } from '@/lib/utils/formatting'
import type { Sponsor } from '@/prisma/generated/prisma/client'

const PAGE_SIZE = 8

type StatusFilter = 'all' | 'enabled' | 'disabled'
type SortKey = 'name' | 'supportedSince' | 'enabled'
type SortDirection = 'asc' | 'desc'

interface SortState {
  key: SortKey | null
  direction: SortDirection
}

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
  const [sort, setSort] = useState<SortState>({ key: null, direction: 'asc' })
  const [page, setPage] = useState(1)

  const handleSort = (columnKey: SortKey) => {
    setSort(prev => {
      if (prev.key !== columnKey) return { key: columnKey, direction: 'asc' }
      if (prev.direction === 'asc') return { key: columnKey, direction: 'desc' }
      return { key: null, direction: 'asc' }
    })
  }

  const sortIcon = (columnKey: SortKey) => {
    if (sort.key !== columnKey) return null
    return sort.direction === 'asc' ? (
      <ChevronUp className="inline size-3" />
    ) : (
      <ChevronDown className="inline size-3" />
    )
  }

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

    const sorted = [...result]
    if (sort.key) {
      const key = sort.key
      const dir = sort.direction === 'asc' ? 1 : -1
      sorted.sort((a, b) => compareValues(a, b, key) * dir)
    } else {
      sorted.sort(defaultSort)
    }

    return sorted
  }, [sponsors, search, statusFilter, sort])

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value as StatusFilter)
    setPage(1)
  }

  const enabledCount = sponsors.filter(s => s.enabled).length
  const disabledCount = sponsors.filter(s => !s.enabled).length

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

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
                  Nom {sortIcon('name')}
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                  Lien
                </TableHead>
                <TableHead
                  className="hidden cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-300 sm:table-cell"
                  onClick={() => handleSort('supportedSince')}
                >
                  Depuis {sortIcon('supportedSince')}
                </TableHead>
                <TableHead
                  className="hidden cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-300 md:table-cell"
                  onClick={() => handleSort('enabled')}
                >
                  Statut {sortIcon('enabled')}
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
                      className={
                        sponsor.enabled
                          ? 'rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400'
                          : 'rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-medium text-zinc-400'
                      }
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            Page {safePage} sur {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={safePage <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              aria-label="Page précédente"
              className="text-zinc-400 hover:text-zinc-200"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              aria-label="Page suivante"
              className="text-zinc-400 hover:text-zinc-200"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
