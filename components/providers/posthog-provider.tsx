/**
 * File: components/providers/posthog-provider.tsx
 * Description: PostHog context provider wrapping the React tree for hook access and session replay.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, useRef } from 'react'

interface PostHogProviderProps {
  children: React.ReactNode
}

export const PostHogProvider = ({ children }: PostHogProviderProps) => {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    if (process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') return

    initialized.current = true
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? '', {
      api_host: '/ingest',
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      defaults: '2026-01-30',
      capture_pageview: false,
      capture_exceptions: true,
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
