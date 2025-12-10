/**
 * File: components/features/tournament/actions/delete-button.tsx
 * Description: Client component for deleting tournaments with confirmation dialog.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client"

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { Trash2 } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { deleteTournament } from "@/lib/actions/tournament"
import { fr } from "@/lib/i18n/dictionaries/fr"

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------



// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

interface DeleteTournamentButtonProps {
  id: string
}

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

export const DeleteTournamentButton = ({ id }: DeleteTournamentButtonProps) => {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const result = await deleteTournament({ id })
        if (result?.message && result.message.includes("successfully")) {
          toast.success(result.message)
          setOpen(false)
        } else if (result?.message) {
          toast.error(result.message)
        }
      } catch (_error) {
        toast.error(fr.common.errors.generic)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-zinc-800 bg-zinc-950 text-zinc-50">
        <AlertDialogHeader>
          <AlertDialogTitle>{fr.pages.admin.actions.delete.title}</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            {fr.pages.admin.actions.delete.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-zinc-800 bg-transparent hover:bg-zinc-900 hover:text-white">
            {fr.pages.admin.actions.delete.btnCancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={isPending}
          >
            {isPending ? fr.pages.admin.actions.delete.btnDeleting : fr.pages.admin.actions.delete.btnDelete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
