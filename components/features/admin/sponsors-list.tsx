/**
 * File: components/features/admin/sponsors-list.tsx
 * Description: Client component displaying the sponsors table with CRUD actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { SponsorDeleteDialog } from '@/components/features/admin/sponsor-delete-dialog'
import { SponsorFormDialog } from '@/components/features/admin/sponsor-form-dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatShortDate } from '@/lib/utils/formatting'
import type { Sponsor } from '@/prisma/generated/prisma/client'

interface SponsorsListProps {
  sponsors: Sponsor[]
}

export const SponsorsList = ({ sponsors }: SponsorsListProps) => {
  const [formOpen, setFormOpen] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | undefined>()
  const [deletingSponsor, setDeletingSponsor] = useState<Sponsor | undefined>()

  const handleCreate = () => {
    setEditingSponsor(undefined)
    setFormOpen(true)
  }

  const handleEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor)
    setFormOpen(true)
  }

  const handleDelete = (sponsor: Sponsor) => {
    setDeletingSponsor(sponsor)
  }

  return (
    <>
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {sponsors.length === 0
            ? 'Aucun sponsor pour le moment.'
            : `${sponsors.length.toString()} sponsor${sponsors.length > 1 ? 's' : ''}`}
        </p>
        <Button
          onClick={handleCreate}
          className="gap-2 bg-blue-600 text-white hover:bg-blue-500"
        >
          <Plus className="size-4" />
          Ajouter
        </Button>
      </div>

      {/* Sponsors table */}
      {sponsors.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                  Image
                </TableHead>
                <TableHead className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                  Nom
                </TableHead>
                <TableHead className="hidden text-xs font-semibold tracking-wider text-zinc-500 uppercase sm:table-cell">
                  Lien
                </TableHead>
                <TableHead className="hidden text-xs font-semibold tracking-wider text-zinc-500 uppercase sm:table-cell">
                  Depuis
                </TableHead>
                <TableHead className="text-right text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sponsors.map(sponsor => (
                <TableRow
                  key={sponsor.id}
                  className="border-white/5 hover:bg-white/2"
                >
                  <TableCell>
                    <div className="relative flex size-10 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
                      {sponsor.imageUrls[0] ? (
                        <Image
                          src={sponsor.imageUrls[0]}
                          alt={sponsor.name}
                          width={40}
                          height={40}
                          className="size-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-xs text-zinc-600">-</span>
                      )}
                      {sponsor.imageUrls.length > 1 && (
                        <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                          {sponsor.imageUrls.length}
                        </span>
                      )}
                    </div>
                  </TableCell>
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
                      <span className="text-xs text-zinc-600">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm text-zinc-400 sm:table-cell">
                    {formatShortDate(sponsor.supportedSince)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(sponsor)}
                        className="text-zinc-400 hover:text-white"
                        aria-label="Modifier"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(sponsor)}
                        className="text-zinc-400 hover:text-red-400"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Form dialog (create/edit) */}
      <SponsorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        sponsor={editingSponsor}
      />

      {/* Delete confirmation dialog */}
      {deletingSponsor && (
        <SponsorDeleteDialog
          open={!!deletingSponsor}
          onOpenChange={open => {
            if (!open) setDeletingSponsor(undefined)
          }}
          sponsor={deletingSponsor}
        />
      )}
    </>
  )
}
