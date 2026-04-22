/**
 * File: components/admin/tournaments/tournament-archived-toast.tsx
 * Description: Client component that shows a warning toast when redirected from the edit page
 *              because the tournament is archived.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export const TournamentArchivedToast = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const shownRef = useRef(false)

  useEffect(() => {
    if (searchParams.get('archived') !== '1' || shownRef.current) return
    shownRef.current = true

    toast.warning('Ce tournoi est archivé.', {
      description:
        'Passez-le en brouillon ou publiez-le avant de pouvoir le modifier.',
      duration: 6000,
    })

    // Clean up the query param from the URL
    const params = new URLSearchParams(searchParams.toString())
    params.delete('archived')
    const newUrl =
      params.size > 0 ? `?${params.toString()}` : window.location.pathname
    router.replace(newUrl)
  }, [searchParams, router])

  return null
}
