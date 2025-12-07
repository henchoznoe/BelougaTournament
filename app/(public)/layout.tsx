/**
 * File: app/(public)/layout.tsx
 * Description: Layout for public-facing pages (navbar, footer).
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { Footer } from '@/components/layout/footer'
import { Navbar } from '@/components/layout/navbar/navbar'

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

interface LayoutProps {
  children: React.ReactNode
}

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const PublicLayout = (props: Readonly<LayoutProps>) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{props.children}</main>
      <Footer />
    </div>
  )
}

export default PublicLayout
