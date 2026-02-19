/**
 * File: components/features/tournament/actions/visibility-toggle.tsx
 * Description: Client component for toggling tournament visibility (Public/Private).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

"use client"

import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useOptimistic, useTransition } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toggleTournamentVisibility } from "@/lib/actions/tournament"
import { cn } from "@/lib/utils"
import { Visibility } from "@/prisma/generated/prisma/enums"

interface VisibilityToggleProps {
  tournamentId: string
  currentVisibility: Visibility
}

export const VisibilityToggle = ({
  tournamentId,
  currentVisibility,
}: VisibilityToggleProps) => {
  const [isPending, startTransition] = useTransition()
  const [optimisticVisibility, setOptimisticVisibility] = useOptimistic(
    currentVisibility,
    (_, newVisibility: Visibility) => newVisibility,
  )

  const handleToggle = (visibility: Visibility) => {
    if (visibility === currentVisibility) return

    startTransition(async () => {
      setOptimisticVisibility(visibility)
      try {
        const result = await toggleTournamentVisibility({
          id: tournamentId,
          visibility,
        })
        if (!result.success) {
          toast.error(
            result.message ||
              "Une erreur est survenue lors de la mise à jour de la visibilité",
          )
        } else {
          toast.success(
            "La visibilité du tournoi a été mise à jour avec succès",
          )
        }
      } catch (_error) {
        toast.error("Une erreur est survenue")
      }
    })
  }

  const visibilityLabel =
    optimisticVisibility === Visibility.PUBLIC
      ? "Public"
      : "Privé"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-12 border-white/10 bg-white/5 hover:bg-white/10 transition-colors",
            optimisticVisibility === Visibility.PUBLIC
              ? "text-green-400 hover:text-green-300 border-green-500/20 bg-green-500/10 hover:bg-green-500/20"
              : "text-zinc-400 hover:text-zinc-300",
          )}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : optimisticVisibility === Visibility.PUBLIC ? (
            <Eye className="mr-2 h-4 w-4" />
          ) : (
            <EyeOff className="mr-2 h-4 w-4" />
          )}
          {visibilityLabel}
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
          <span>Public</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleToggle(Visibility.PRIVATE)}
          className="hover:bg-zinc-900 cursor-pointer focus:bg-zinc-900 focus:text-white gap-2"
        >
          <EyeOff className="h-4 w-4 text-zinc-500" />
          <span>Privé</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
