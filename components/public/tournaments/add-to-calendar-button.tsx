/**
 * File: components/public/tournaments/add-to-calendar-button.tsx
 * Description: Reusable dropdown button to add a tournament event to Google Calendar, Apple Calendar, or Outlook.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CalendarEventData } from '@/lib/utils/calendar'
import {
  downloadIcsFile,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
} from '@/lib/utils/calendar'
import { cn } from '@/lib/utils/cn'

interface AddToCalendarButtonProps {
  tournament: CalendarEventData
  variant?: 'icon' | 'full'
  className?: string
}

export const AddToCalendarButton = ({
  tournament,
  variant = 'icon',
  className,
}: AddToCalendarButtonProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {variant === 'icon' ? (
        <button
          type="button"
          className={cn(
            'rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300',
            className,
          )}
          aria-label="Ajouter au calendrier"
        >
          <CalendarPlus className="size-3.5" />
        </button>
      ) : (
        <Button
          variant="outline"
          className={cn(
            'gap-2 border-white/10 bg-white/5 hover:bg-white/10',
            className,
          )}
        >
          <CalendarPlus className="size-4" />
          Ajouter au calendrier
        </Button>
      )}
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="min-w-[200px]">
      <DropdownMenuItem asChild>
        <a
          href={generateGoogleCalendarUrl(tournament)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Calendar
        </a>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <a
          href={generateOutlookCalendarUrl(tournament)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Outlook
        </a>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => downloadIcsFile(tournament)}>
        Apple Calendar (.ics)
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)
