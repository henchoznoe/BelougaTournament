/**
 * File: components/admin/detail/sponsor-detail.tsx
 * Description: Sponsor detail view with image gallery, info cards, status toggle, and delete action.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Handshake,
  Info,
  Loader2,
  Pencil,
  Power,
  Trash2,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { deleteSponsor, toggleSponsorStatus } from '@/lib/actions/sponsors'
import { ROUTES } from '@/lib/config/routes'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/formatting'
import type { Sponsor } from '@/prisma/generated/prisma/client'

// ─── Status Badge (clickable toggle) ─────────────────────────────────────────

interface SponsorStatusBadgeProps {
  sponsor: Sponsor
}

export const SponsorStatusBadge = ({ sponsor }: SponsorStatusBadgeProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleSponsorStatus({ id: sponsor.id })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={`${sponsor.enabled ? 'Désactiver' : 'Activer'} le sponsor`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        'cursor-pointer disabled:cursor-wait disabled:opacity-60',
        sponsor.enabled
          ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
          : 'bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20',
      )}
    >
      {isPending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <Power className="size-3" />
      )}
      {sponsor.enabled ? 'Actif' : 'Inactif'}
    </button>
  )
}

// ─── Action Buttons (Edit + Delete) ──────────────────────────────────────────

interface SponsorDetailActionsProps {
  sponsor: Sponsor
}

export const SponsorDetailActions = ({
  sponsor,
}: SponsorDetailActionsProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteSponsor({ id: sponsor.id })
      if (result.success) {
        toast.success(result.message)
        router.push(ROUTES.ADMIN_SPONSORS)
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={ROUTES.ADMIN_SPONSOR_EDIT(sponsor.id)}>
          <Pencil className="size-4" />
          Modifier
        </Link>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="size-4" />
            Supprimer
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {sponsor.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le sponsor sera définitivement
              supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Image Gallery ───────────────────────────────────────────────────────────

interface SponsorImageGalleryProps {
  imageUrls: string[]
  name: string
}

const SponsorImageGallery = ({ imageUrls, name }: SponsorImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (imageUrls.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-white/5 bg-white/2">
        <p className="text-sm text-zinc-500">Aucune image</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-32/9 overflow-hidden rounded-2xl border border-white/5 bg-white/2">
        <Image
          src={imageUrls[selectedIndex]}
          alt={`${name} — image ${selectedIndex + 1}`}
          fill
          className="object-contain p-4"
          sizes="(max-width: 768px) 100vw, 800px"
          priority
        />
      </div>

      {/* Thumbnails (only if more than 1 image) */}
      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imageUrls.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Voir image ${index + 1}`}
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-lg border transition-all',
                'hover:border-white/20',
                index === selectedIndex
                  ? 'border-blue-500 ring-1 ring-blue-500/50'
                  : 'border-white/5 bg-white/2',
              )}
            >
              <Image
                src={url}
                alt={`${name} — miniature ${index + 1}`}
                fill
                className="object-contain p-1"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Detail Component ───────────────────────────────────────────────────

interface SponsorDetailProps {
  sponsor: Sponsor
}

export const SponsorDetail = ({ sponsor }: SponsorDetailProps) => {
  return (
    <div className="space-y-6">
      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Informations card */}
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Info className="size-4 text-blue-400" />
            Informations
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <Handshake className="size-3.5" />
                Nom
              </dt>
              <dd className="text-right font-medium text-white">
                {sponsor.name}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <Globe className="size-3.5" />
                Site web
              </dt>
              <dd className="text-right">
                {sponsor.url ? (
                  <a
                    href={sponsor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 transition-colors hover:text-blue-300"
                  >
                    {new URL(sponsor.url).hostname}
                    <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <span className="text-zinc-600">Non renseigné</span>
                )}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <Power className="size-3.5" />
                Statut
              </dt>
              <dd>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                    sponsor.enabled
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-zinc-500/10 text-zinc-400',
                  )}
                >
                  {sponsor.enabled ? 'Actif' : 'Inactif'}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Dates card */}
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Calendar className="size-4 text-blue-400" />
            Dates
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <Handshake className="size-3.5" />
                Partenaire depuis
              </dt>
              <dd className="text-right font-medium text-white">
                {formatDate(sponsor.supportedSince)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <Clock className="size-3.5" />
                Créé le
              </dt>
              <dd className="text-right text-zinc-300">
                {formatDate(sponsor.createdAt)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <Clock className="size-3.5" />
                Modifié le
              </dt>
              <dd className="text-right text-zinc-300">
                {formatDate(sponsor.updatedAt)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Image gallery */}
      <SponsorImageGallery imageUrls={sponsor.imageUrls} name={sponsor.name} />
    </div>
  )
}
