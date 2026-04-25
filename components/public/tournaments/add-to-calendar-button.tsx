/**
 * File: components/public/tournaments/add-to-calendar-button.tsx
 * Description: Reusable button to download an iCalendar (.ics) file for a tournament event.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CalendarEventData } from '@/lib/utils/calendar'
import { downloadIcsFile } from '@/lib/utils/calendar'
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
}: AddToCalendarButtonProps) => {
  const handleClick = () => downloadIcsFile(tournament)

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300',
          className,
        )}
        aria-label="Ajouter au calendrier"
      >
        <CalendarPlus className="size-3.5" />
      </button>
    )
  }

  return (
    <Button
      variant="outline"
      className={cn(
        'gap-2 border-white/10 bg-white/5 hover:bg-white/10',
        className,
      )}
      onClick={handleClick}
    >
      <CalendarPlus className="size-4" />
      Ajouter au calendrier
    </Button>
  )
}
