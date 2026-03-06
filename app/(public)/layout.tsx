/**
 * File: app/(public)/layout.tsx
 * Description: Layout for public-facing pages.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Suspense } from 'react'
import { PublicFooter } from '@/components/features/layout/public-footer'
import { PublicNavbar } from '@/components/features/layout/public-navbar'

interface LayoutProps {
  children: React.ReactNode
}

const PublicLayout = (props: Readonly<LayoutProps>) => {
  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Aller au contenu principal
      </a>
      <Suspense>
        <PublicNavbar />
      </Suspense>
      <main id="main-content">{props.children}</main>
      <Suspense>
        <PublicFooter />
      </Suspense>
    </div>
  )
}

export default PublicLayout
