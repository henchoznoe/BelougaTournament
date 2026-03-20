/**
 * File: components/features/admin/tournament-detail-tabs.tsx
 * Description: Tab navigation for tournament detail pages (overview, edit, registrations, teams).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ROUTES } from '@/lib/config/routes'
import { cn } from '@/lib/utils/cn'

interface TournamentDetailTabsProps {
  slug: string
  showTeamsTab: boolean
}

export const TournamentDetailTabs = ({
  slug,
  showTeamsTab,
}: TournamentDetailTabsProps) => {
  const pathname = usePathname()

  const tabs = [
    { label: 'Aperçu', href: ROUTES.ADMIN_TOURNAMENT_DETAIL(slug) },
    { label: 'Modifier', href: ROUTES.ADMIN_TOURNAMENT_EDIT(slug) },
    {
      label: 'Inscriptions',
      href: ROUTES.ADMIN_TOURNAMENT_REGISTRATIONS(slug),
    },
    ...(showTeamsTab
      ? [{ label: 'Equipes', href: ROUTES.ADMIN_TOURNAMENT_TEAMS(slug) }]
      : []),
  ]

  return (
    <div className="flex gap-1 rounded-xl border border-white/5 bg-white/2 p-1 backdrop-blur-sm">
      {tabs.map(tab => {
        const isActive = pathname === tab.href

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-white/10 text-white'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
