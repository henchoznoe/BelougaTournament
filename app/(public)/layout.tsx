/**
 * File: app/(public)/layout.tsx
 * Description: Layout for public-facing pages (navbar, footer).
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { Footer } from '@/components/public/footer'
import { Navbar } from '@/components/public/navbar'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
