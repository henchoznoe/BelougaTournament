/**
 * File: components/features/tournament/actions/visibility-toggle.tsx
 * Description: Client component for toggling tournament visibility (Public/Private).
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client"

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toggleTournamentVisibility } from "@/lib/actions/tournaments"
import { cn } from "@/lib/utils"
import { Visibility } from "@/prisma/generated/prisma/enums"

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const CONTENT = {
  PUBLIC: "Public",
  PRIVATE: "Privé",
  ERROR_UPDATE: "Erreur lors de la mise à jour",
  ERROR_GENERIC: "Une erreur inattendue est survenue",
} as const

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

interface VisibilityToggleProps {
  tournamentId: string
  currentVisibility: Visibility
}

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

export const VisibilityToggle = ({
  tournamentId,
  currentVisibility,
}: VisibilityToggleProps) => {
  const [isPending, startTransition] = useTransition()

  const handleToggle = (visibility: Visibility) => {
    if (visibility === currentVisibility) return

    startTransition(async () => {
      try {
        const result = await toggleTournamentVisibility({
          id: tournamentId,
          visibility,
        })
        if (result.success) {
          toast.success(result.message)
        } else {
          toast.error(result.message || CONTENT.ERROR_UPDATE)
        }
      } catch (_error) {
        toast.error(CONTENT.ERROR_GENERIC)
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-12 border-white/10 bg-white/5 hover:bg-white/10 transition-colors",
            currentVisibility === Visibility.PUBLIC
              ? "text-green-400 hover:text-green-300 border-green-500/20 bg-green-500/10 hover:bg-green-500/20"
              : "text-zinc-400 hover:text-zinc-300",
          )}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : currentVisibility === Visibility.PUBLIC ? (
            <Eye className="mr-2 h-4 w-4" />
          ) : (
            <EyeOff className="mr-2 h-4 w-4" />
          )}
          {currentVisibility === Visibility.PUBLIC
            ? CONTENT.PUBLIC
            : CONTENT.PRIVATE}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-zinc-950 border-white/10 text-zinc-200 min-w-[150px]"
      >
        <DropdownMenuItem
          onClick={() => handleToggle(Visibility.PUBLIC)}
          className="hover:bg-zinc-900 cursor-pointer focus:bg-zinc-900 focus:text-white gap-2"
        >
          <Eye className="h-4 w-4 text-green-500" />
          <span>{CONTENT.PUBLIC}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleToggle(Visibility.PRIVATE)}
          className="hover:bg-zinc-900 cursor-pointer focus:bg-zinc-900 focus:text-white gap-2"
        >
          <EyeOff className="h-4 w-4 text-zinc-500" />
          <span>{CONTENT.PRIVATE}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
