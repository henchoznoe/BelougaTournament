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

interface PostHogProviderProps {
  children: React.ReactNode
}

export const PostHogProvider = ({ children }: PostHogProviderProps) => {
  return <PHProvider client={posthog}>{children}</PHProvider>
}
