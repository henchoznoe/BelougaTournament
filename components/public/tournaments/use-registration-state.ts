/**
 * File: components/public/tournaments/use-registration-state.ts
 * Description: Race-safe registration verification with explicit failure and retry states.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { UserTournamentRegistrationState } from '@/lib/types/tournament'
import { fetchRegistrationState } from '@/lib/utils/registration-feedback'

export const useRegistrationState = (
  tournamentId: string,
  userId: string | undefined,
) => {
  const request = useRef(0)
  const [result, setResult] = useState<{
    state: UserTournamentRegistrationState | null
    userId?: string
    tournamentId?: string
    loading: boolean
    error: string | null
  }>({ state: null, loading: false, error: null })
  const reload = useCallback(async () => {
    const currentRequest = ++request.current
    if (!userId) {
      setResult({ state: null, loading: false, error: null })
      return null
    }
    setResult(previous => ({ ...previous, loading: true, error: null }))
    try {
      const state = await fetchRegistrationState(tournamentId)
      if (currentRequest !== request.current) return undefined
      setResult({ state, userId, tournamentId, loading: false, error: null })
      return state
    } catch {
      if (currentRequest === request.current)
        setResult({
          state: null,
          userId,
          tournamentId,
          loading: false,
          error:
            'Impossible de vérifier votre inscription. Réessayez pour continuer.',
        })
      return undefined
    }
  }, [tournamentId, userId])
  useEffect(() => {
    void reload()
    return () => {
      request.current++
    }
  }, [reload])
  const isCurrent =
    result.userId === userId && result.tournamentId === tournamentId
  return {
    state: isCurrent ? result.state : null,
    loading: Boolean(userId) && (!isCurrent || result.loading),
    error: isCurrent ? result.error : null,
    reload,
  }
}
