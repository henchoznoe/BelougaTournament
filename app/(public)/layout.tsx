/**
 * File: app/(public)/layout.tsx
 * Description: Layout for public-facing pages.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { PublicFooter } from '@/components/features/layout/public-footer'
import { PublicNavbar } from '@/components/features/layout/public-navbar'

interface LayoutProps {
  children: React.ReactNode
}

const PublicLayout = (props: Readonly<LayoutProps>) => {
  return (
    <div className="min-h-dvh">
      <PublicNavbar />
      <main>{props.children}</main>
      <PublicFooter />
    </div>
  )
}

export default PublicLayout
