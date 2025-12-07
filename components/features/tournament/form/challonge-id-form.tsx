/**
 * File: components/features/tournament/form/challonge-id-form.tsx
 * Description: Client form component for updating tournament Challonge ID.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client"

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { useActionState, useEffect } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateChallongeId } from "@/lib/actions/tournament-manager"

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const CONTENT = {
  PLACEHOLDER_ID: "ex: belouga_cup_1",
  BTN_SAVE: "Enregistrer l'ID",
  BTN_SAVING: "Enregistrement...",
} as const

const INITIAL_STATE = {
  success: false,
  message: "",
  errors: {},
}

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

interface ChallongeIdFormProps {
  tournamentId: string
  initialChallongeId: string | null
}

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

export const ChallongeIdForm = ({
  tournamentId,
  initialChallongeId,
}: ChallongeIdFormProps) => {
  const updateAction = updateChallongeId.bind(null, tournamentId)
  const [state, formAction, isPending] = useActionState(
    updateAction,
    INITIAL_STATE,
  )

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast.success(state.message)
      } else {
        toast.error(state.message)
      }
    }
  }, [state])

  return (
    <form action={formAction} className="flex max-w-xl gap-4">
      <div className="flex-1">
        <Input
          name="challongeId"
          placeholder={CONTENT.PLACEHOLDER_ID}
          defaultValue={initialChallongeId || ""}
          className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20"
        />
        {state?.errors?.challongeId && (
          <p className="mt-1 text-sm text-red-500">
            {state.errors.challongeId[0]}
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isPending}
        className="bg-blue-600 text-white hover:bg-blue-500"
      >
        {isPending ? CONTENT.BTN_SAVING : CONTENT.BTN_SAVE}
      </Button>
    </form>
  )
}
