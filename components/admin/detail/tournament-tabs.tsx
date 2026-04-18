/**
 * File: components/admin/detail/tournament-tabs.tsx
 * Description: Tab navigation for the admin tournament detail page, driven by URL searchParams.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ClipboardList, LayoutDashboard, Users } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { cn } from '@/lib/utils/cn'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

export type TournamentTab = 'overview' | 'registrations' | 'teams'

const TABS: {
  id: TournamentTab
  label: string
  icon: typeof LayoutDashboard
  teamOnly?: boolean
}[] = [
  { id: 'overview', label: 'Vue d\u2019ensemble', icon: LayoutDashboard },
  { id: 'registrations', label: 'Inscriptions', icon: ClipboardList },
  { id: 'teams', label: '\u00c9quipes', icon: Users, teamOnly: true },
]

interface TournamentTabNavProps {
  format: TournamentFormat
}

export const TournamentTabNav = ({ format }: TournamentTabNavProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentTab = (searchParams.get('tab') as TournamentTab) || 'overview'

  const handleTabChange = useCallback(
    (tab: TournamentTab) => {
      const params = new URLSearchParams(searchParams.toString())
      if (tab === 'overview') {
        params.delete('tab')
      } else {
        params.set('tab', tab)
      }
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname, searchParams],
  )

  const visibleTabs = TABS.filter(
    tab => !tab.teamOnly || format === TournamentFormat.TEAM,
  )

  return (
    <div className="flex gap-1 rounded-xl border border-white/5 bg-white/2 p-1 backdrop-blur-sm">
      {visibleTabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => handleTabChange(tab.id)}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            currentTab === tab.id
              ? 'bg-white/10 text-white'
              : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200',
          )}
        >
          <tab.icon className="size-4" />
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
