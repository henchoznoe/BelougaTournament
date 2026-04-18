/**
 * File: components/admin/ui/tournament-actions-dropdown.tsx
 * Description: Dropdown menu with quick actions for each tournament row in the admin tournaments table.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Eye, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ROUTES } from '@/lib/config/routes'
import type { TournamentListItem } from '@/lib/types/tournament'

interface TournamentActionsDropdownProps {
  tournament: TournamentListItem
}

export const TournamentActionsDropdown = ({
  tournament,
}: TournamentActionsDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions pour ${tournament.title}`}
          className="text-zinc-400 hover:text-zinc-200"
          onClick={e => e.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-white/10 bg-zinc-950"
        onClick={e => e.stopPropagation()}
      >
        <DropdownMenuItem asChild>
          <Link href={ROUTES.ADMIN_TOURNAMENT_DETAIL(tournament.slug)}>
            <Eye className="size-4" />
            Voir le tournoi
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
