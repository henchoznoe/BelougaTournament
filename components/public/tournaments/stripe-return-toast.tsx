/**
 * File: components/public/tournaments/stripe-return-toast.tsx
 * Description: Client component that reads Stripe return query params and displays a toast.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

export const StripeReturnToast = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const stripe = searchParams.get('stripe')
    if (!stripe) return

    // Clean up the query param from the URL immediately
    router.replace(pathname)

    if (stripe === 'success') {
      toast.success('Ton inscription est confirm\u00e9e !')
    } else if (stripe === 'cancelled') {
      toast.error(
        'Paiement annul\u00e9. Ta place n\u2019est plus r\u00e9serv\u00e9e.',
      )
    }
  }, [searchParams, router, pathname])

  return null
}
