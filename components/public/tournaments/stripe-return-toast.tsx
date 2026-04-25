/**
 * File: components/public/tournaments/stripe-return-toast.tsx
 * Description: Client component that reads Stripe return query params, cancels any pending
 *              registration on the cancelled path, and displays a toast notification.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { cancelMyPendingRegistrationForTournament } from '@/lib/actions/tournament-registration'
import type { CalendarEventData } from '@/lib/utils/calendar'
import { downloadIcsFile } from '@/lib/utils/calendar'

interface StripeReturnToastProps {
  tournamentId: string
  calendarData?: CalendarEventData
}

export const StripeReturnToast = ({
  tournamentId,
  calendarData,
}: StripeReturnToastProps) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  // Prevent double-execution in React strict mode / concurrent rendering
  const handledRef = useRef(false)

  useEffect(() => {
    const stripe = searchParams.get('stripe')
    if (!stripe || handledRef.current) return
    handledRef.current = true

    // Clean up the query param from the URL immediately
    router.replace(pathname)

    if (stripe === 'success') {
      toast.success('Ton inscription est confirmée !', {
        ...(calendarData && {
          action: {
            label: 'Ajouter au calendrier',
            onClick: () => downloadIcsFile(calendarData),
          },
        }),
      })
      router.refresh()
    } else if (stripe === 'cancelled') {
      // Cancel the PENDING registration server-side, then notify the user
      cancelMyPendingRegistrationForTournament({ tournamentId })
        .then(() => {
          toast.error('Paiement annulé. Ta place a été libérée.')
          router.refresh()
        })
        .catch(() => {
          toast.error('Paiement annulé. Ta place a été libérée.')
          router.refresh()
        })
    }
  }, [searchParams, router, pathname, tournamentId, calendarData])

  return null
}
