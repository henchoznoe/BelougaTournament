'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateChallongeId } from '@/lib/actions/tournament-manager'

interface ChallongeIdFormProps {
    tournamentId: string
    initialChallongeId: string | null
}

const initialState = {
    success: false,
    message: '',
    errors: {},
}

export function ChallongeIdForm({
    tournamentId,
    initialChallongeId,
}: ChallongeIdFormProps) {
    const updateAction = updateChallongeId.bind(null, tournamentId)
    const [state, formAction, isPending] = useActionState(
        updateAction,
        initialState,
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
        <form action={formAction} className="flex gap-4 max-w-xl">
            <div className="flex-1">
                <Input
                    name="challongeId"
                    placeholder="ex: belouga_cup_1"
                    defaultValue={initialChallongeId || ''}
                    className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                />
                {state?.errors?.challongeId && (
                    <p className="text-sm text-red-500 mt-1">
                        {state.errors.challongeId[0]}
                    </p>
                )}
            </div>
            <Button
                type="submit"
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-500 text-white"
            >
                {isPending ? 'Enregistrement...' : "Enregistrer l'ID"}
            </Button>
        </form>
    )
}
