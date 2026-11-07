/**
 * File: components/public/tournaments/payment-return-feedback.tsx
 * Description: Persistent payment return feedback verified against registration state.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ActionFeedback } from '@/components/ui/action-feedback'
import { Button } from '@/components/ui/button'
import { PendingLink } from '@/components/ui/pending-link'
import { cancelMyPendingRegistrationForTournament } from '@/lib/actions/tournament-registration'
import { ROUTES } from '@/lib/config/routes'
import type { UserTournamentRegistrationState } from '@/lib/types/tournament'
import { getPaymentReturnFeedback } from '@/lib/utils/registration-feedback'

interface PaymentReturnFeedbackProps {
  tournamentId: string
  state: UserTournamentRegistrationState | null
  loading: boolean
  error: string | null
  onRefresh: () => Promise<UserTournamentRegistrationState | null | undefined>
}

export const PaymentReturnFeedback = ({
  tournamentId,
  state,
  loading,
  error,
  onRefresh,
}: PaymentReturnFeedbackProps) => {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [intent, setIntent] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState(false)
  const handled = useRef<string | null>(null)
  const requested = params.get('stripe')

  useEffect(() => {
    if (
      (requested !== 'success' && requested !== 'cancelled') ||
      handled.current === `${tournamentId}:${requested}`
    )
      return
    handled.current = `${tournamentId}:${requested}`
    setIntent(requested)
    const clean = new URLSearchParams(params.toString())
    clean.delete('stripe')
    router.replace(`${pathname}${clean.size ? `?${clean}` : ''}#inscription`, {
      scroll: false,
    })
    if (requested === 'cancelled') {
      setCancelling(true)
      void cancelMyPendingRegistrationForTournament({ tournamentId })
        .then(async result => {
          setCancelled(result.success)
          setCancelError(!result.success)
          await onRefresh()
        })
        .catch(() => setCancelError(true))
        .finally(() => setCancelling(false))
    } else {
      void onRefresh()
    }
  }, [requested, params, pathname, router, tournamentId, onRefresh])

  if (!intent) return null
  const verifiedFeedback = getPaymentReturnFeedback(
    state,
    intent === 'cancelled',
    cancelled,
  )
  const feedback =
    loading || cancelling
      ? {
          tone: 'info' as const,
          title: 'Vérification de votre inscription…',
          message: 'Nous vérifions votre inscription auprès du serveur.',
        }
      : verifiedFeedback
  return (
    <ActionFeedback
      tone={error || cancelError ? 'error' : feedback.tone}
      title={
        error
          ? 'Vérification indisponible'
          : cancelError
            ? 'Annulation non confirmée'
            : feedback.title
      }
    >
      <p>
        {error ||
          (cancelError
            ? 'Nous ne pouvons pas confirmer la libération de votre place. Consultez votre espace joueur ou contactez l’organisation.'
            : feedback.message)}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={loading || cancelling}
          onClick={() => void onRefresh()}
        >
          {loading || cancelling
            ? 'Vérification…'
            : 'Actualiser mon inscription'}
        </Button>
        <Button asChild variant="ghost">
          <PendingLink href={`${ROUTES.PROFILE}#inscriptions`}>
            Mon espace joueur
          </PendingLink>
        </Button>
      </div>
    </ActionFeedback>
  )
}
