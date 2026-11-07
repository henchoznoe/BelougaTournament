/**
 * File: components/public/profile/profile-tabs.tsx
 * Description: URL-aware profile registration tabs preserving legacy history links.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { useSearchParams } from 'next/navigation'
import { type ReactNode, useEffect, useState } from 'react'
import { Tabs } from '@/components/ui/tabs'
import { resolveProfileTab } from '@/lib/utils/profile-tab'

export const ProfileTabs = ({ children }: { children: ReactNode }) => {
  const params = useSearchParams()
  const [hash, setHash] = useState('')
  useEffect(() => {
    const updateHash = () => setHash(window.location.hash)
    updateHash()
    window.addEventListener('hashchange', updateHash)
    window.addEventListener('popstate', updateHash)
    return () => {
      window.removeEventListener('hashchange', updateHash)
      window.removeEventListener('popstate', updateHash)
    }
  }, [])
  return (
    <div id="tournaments-history" className="section-anchor">
      <Tabs
        value={resolveProfileTab(params.get('tab'), hash)}
        onValueChange={tab => {
          const url = new URL(window.location.href)
          url.searchParams.set('tab', tab)
          url.hash = tab === 'history' ? 'tournaments-history' : 'inscriptions'
          window.history.pushState(
            null,
            '',
            `${url.pathname}${url.search}${url.hash}`,
          )
          setHash(url.hash)
        }}
        className="space-y-4"
      >
        {children}
      </Tabs>
    </div>
  )
}
