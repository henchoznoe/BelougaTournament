/**
 * File: app/(public)/classement/page.tsx
 * Description: Public leaderboard page (placeholder for future implementation).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { BarChart3, Lock, Trophy, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = {
  title: 'Classement',
  description: 'Classement des joueurs de la communauté Belouga.',
}

const LeaderboardPage = () => {
  return (
    <section className="relative px-4 pb-20 pt-32 md:pt-40">
      <PageHeader
        title="Classement"
        description="Découvrez les meilleurs joueurs de la communauté."
      />

      <div className="mx-auto w-full max-w-2xl space-y-6">
        {/* Card: Leaderboard teaser */}
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
          {/* Background glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center gap-6 py-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-white/5 bg-white/5">
              <Trophy className="size-8 text-zinc-600" />
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-white">
                Classement des joueurs
              </h2>
              <p className="mx-auto max-w-md text-sm text-zinc-500">
                Le classement des joueurs sera prochainement disponible. Suivez
                vos performances, comparez-vous aux autres membres de la
                communauté et grimpez dans le classement.
              </p>
            </div>

            {/* Feature preview pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/2 px-3 py-1.5 text-xs text-zinc-400">
                <BarChart3 className="size-3" />
                Statistiques
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/2 px-3 py-1.5 text-xs text-zinc-400">
                <Users className="size-3" />
                Classement global
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/2 px-3 py-1.5 text-xs text-zinc-400">
                <Lock className="size-3" />
                Profil public/privé
              </span>
            </div>

            <span className="mt-2 inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1 text-xs font-medium text-blue-400">
              Prochainement disponible
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LeaderboardPage
