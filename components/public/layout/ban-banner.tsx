/**
 * File: components/public/layout/ban-banner.tsx
 * Description: Client wrapper that loads ban state only for authenticated users.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { useEffect, useState } from 'react'
import { usePublicSession } from '@/components/providers/public-session-provider'
import { formatDateTime } from '@/lib/utils/formatting'
import { BanBannerClient } from './ban-banner-client'

interface ActiveBanResponse {
  bannedUntil: string | null
  banReason: string | null
}

export const BanBanner = () => {
  const { sessionUser } = usePublicSession()
  const [activeBan, setActiveBan] = useState<ActiveBanResponse | null>(null)

  useEffect(() => {
    if (!sessionUser) {
      setActiveBan(null)
      return
    }

    const controller = new AbortController()
    fetch('/api/user/active-ban', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(response => (response.ok ? response.json() : null))
      .then((ban: ActiveBanResponse | null) => setActiveBan(ban))
      .catch(() => {
        if (!controller.signal.aborted) setActiveBan(null)
      })

    return () => controller.abort()
  }, [sessionUser])

  if (!activeBan) return null

  return (
    <BanBannerClient
      bannedUntil={activeBan.bannedUntil}
      banReason={activeBan.banReason}
      formattedDate={
        activeBan.bannedUntil
          ? formatDateTime(new Date(activeBan.bannedUntil))
          : null
      }
    />
  )
}
