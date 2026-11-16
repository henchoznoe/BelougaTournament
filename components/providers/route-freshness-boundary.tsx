/**
 * File: components/providers/route-freshness-boundary.tsx
 * Description: Rechecks mutable routes on client navigation and history restoration.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { startTransition, useEffect, useRef } from 'react'
import { expireMyPendingRegistrations } from '@/lib/actions/tournament-registration-solo'
import { createRouteFreshnessController } from '@/lib/utils/route-freshness'

export const RouteFreshnessBoundary = () => {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams().toString()
  const controller = useRef<ReturnType<
    typeof createRouteFreshnessController
  > | null>(null)

  useEffect(() => {
    const current = createRouteFreshnessController({
      refresh: () => startTransition(() => router.refresh()),
      schedule: callback => window.requestAnimationFrame(callback),
      cancel: id => window.cancelAnimationFrame(id),
      cleanupProfile: async () => {
        const result = await expireMyPendingRegistrations({})
        return !result.success || Boolean(result.data?.changed)
      },
    })
    controller.current = current
    const onRestore = (event: PageTransitionEvent) => {
      if (event.persisted) current.restore()
    }
    window.addEventListener('popstate', current.restore)
    window.addEventListener('pageshow', onRestore)
    return () => {
      current.dispose()
      controller.current = null
      window.removeEventListener('popstate', current.restore)
      window.removeEventListener('pageshow', onRestore)
    }
  }, [router])

  useEffect(() => {
    void controller.current?.navigate(pathname, search)
  }, [pathname, search])

  return null
}
