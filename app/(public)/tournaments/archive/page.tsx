/**
 * File: app/(public)/tournaments/archive/page.tsx
 * Description: Public page listing all archived (past) tournaments with filtering, sorting, and pagination.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { TournamentBrowser } from '@/components/public/tournaments/tournament-browser'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { PUBLIC_TOURNAMENTS_PAGE_SIZE } from '@/lib/config/constants/tournaments'
import { ROUTES } from '@/lib/config/routes'
import { getArchivedTournaments } from '@/lib/services/tournaments-public'

export const metadata: Metadata = {
  title: 'Tournois passés',
  description: 'Consultez les tournois passés de la communauté Belouga.',
}

const TournamentArchiveFallback = () => {
  return (
    <>
      <div className="h-10" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: PUBLIC_TOURNAMENTS_PAGE_SIZE }).map((_, i) => (
          <Skeleton
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
            key={i}
            className="h-64 rounded-2xl border border-surface-border bg-surface"
          />
        ))}
      </div>
    </>
  )
}

const ArchiveContent = async () => {
  const tournaments = await getArchivedTournaments()
  return (
    <>
      <div className="flex justify-center">
        <Link
          href={ROUTES.TOURNAMENTS}
          className="glass group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-zinc-400 transition-all duration-300 hover:border-brand/20 hover:bg-surface-hover hover:text-white"
        >
          <ArrowLeft className="size-4 transition-colors duration-300 group-hover:text-brand" />
          Retour aux tournois
        </Link>
      </div>
      <TournamentBrowser
        tournaments={tournaments}
        basePath={ROUTES.TOURNAMENTS_ARCHIVE}
        defaultSort="date_desc"
        variant="archive"
      />
    </>
  )
}

const ArchivePage = () => {
  return (
    <section className="relative px-4 pb-20 pt-32 md:pt-40">
      <PageHeader
        title="Archives"
        description="Retrouvez tous les tournois passés de la communauté."
      />

      <div className="mx-auto w-full max-w-5xl space-y-6">
        <Suspense fallback={<TournamentArchiveFallback />}>
          <ArchiveContent />
        </Suspense>
      </div>
    </section>
  )
}

export default ArchivePage
