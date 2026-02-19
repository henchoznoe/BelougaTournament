/**
 * File: app/(public)/layout.tsx
 * Description: Layout for public-facing pages.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Footer } from '@/components/layout/footer'
import { Navbar } from '@/components/layout/navbar/navbar'

interface LayoutProps {
  children: React.ReactNode
}

const PublicLayout = (props: Readonly<LayoutProps>) => {
  return (
    <div className="min-h-dvh">
      <Navbar />
      <main>{props.children}</main>
      <Footer />
    </div>
  )
}

export default PublicLayout
