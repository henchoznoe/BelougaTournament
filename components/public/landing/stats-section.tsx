/**
 * File: components/public/landing/stats-section.tsx
 * Description: Landing social-proof band showing community-wide counts.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Gamepad2, Swords, Trophy, Users } from 'lucide-react'
import { Reveal } from '@/components/public/shared/reveal'
import { StatItem } from '@/components/public/shared/stat-item'
import { getPublicStats } from '@/lib/services/public-stats'

export const StatsSection = async () => {
  const stats = await getPublicStats()

  // Nothing meaningful to show yet — keep the landing clean.
  if (stats.tournaments === 0 && stats.players === 0) {
    return null
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <Reveal>
        <div className="glass mx-auto grid max-w-5xl grid-cols-2 gap-8 rounded-3xl px-6 py-10 sm:px-10 md:grid-cols-4">
          <StatItem
            value={stats.tournaments}
            label="Tournois organisés"
            icon={Trophy}
          />
          <StatItem
            value={stats.players}
            label="Joueurs inscrits"
            icon={Users}
          />
          <StatItem
            value={stats.registrations}
            label="Participations"
            icon={Swords}
          />
          <StatItem value={stats.games} label="Jeux disputés" icon={Gamepad2} />
        </div>
      </Reveal>
    </section>
  )
}
