/**
 * File: app/(public)/tournaments/page.tsx
 * Description: Public page listing all upcoming tournaments with premium aesthetic.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { Archive, Gamepad2, Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { TournamentCard } from '@/components/features/tournament/card/tournament-card'
import { Button } from '@/components/ui/button'
import { APP_METADATA } from '@/lib/config/constants'
import { APP_ROUTES } from '@/lib/config/routes'
import { fr } from '@/lib/i18n/dictionaries/fr'
import { getPublicTournaments } from '@/lib/services/tournament.service'

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: fr?.pages?.tournaments?.list?.title || 'Tournaments',
  description: fr?.pages?.tournaments?.list?.description || 'View tournaments',
}

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const TournamentsPage = async () => {
  const tournaments = await getPublicTournaments()

  return (
    <div className="relative min-h-screen pb-24">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <Image
          alt="Belouga Tournament Arena Background"
          src={APP_METADATA.DEFAULT_BG_IMG}
          fill
          priority
          className="object-cover opacity-50"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-b from-zinc-950/80 via-zinc-950/50 to-zinc-950" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-top-8 duration-700">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-blue-500/10 ring-1 ring-blue-500/20 mb-4">
            <Trophy className="size-8 text-blue-400" />
          </div>
          <h1 className="font-paladins text-4xl md:text-6xl text-white tracking-wider drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            {fr.pages.tournaments.list.title}
          </h1>
          <p className="max-w-2xl text-lg text-zinc-400">
            {fr.pages.tournaments.list.description}
          </p>

          <div className="pt-4">
            <Button
              asChild
              variant="outline"
              className="border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600 transition-all"
            >
              <Link href={APP_ROUTES.TOURNAMENTS_ARCHIVE}>
                <Archive className="mr-2 size-4" />
                {fr.pages.tournaments.list.btnArchive}
              </Link>
            </Button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.length > 0 ? (
            tournaments.map((tournament, index) => (
              <div
                key={tournament.id}
                className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <TournamentCard tournament={tournament} />
              </div>
            ))
          ) : (
            <div className="col-span-full py-24 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-zinc-900/50 ring-1 ring-zinc-800">
                <Gamepad2 className="size-10 text-zinc-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {fr.pages.tournaments.list.empty.title}
              </h3>
              <p className="text-zinc-500">
                {fr.pages.tournaments.list.empty.desc}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TournamentsPage
