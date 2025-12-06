/**
 * File: app/layout.tsx
 * Description: Root layout for the application.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import { ScrollToTop } from '@/components/scroll-to-top'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import './globals.css'

// Fonts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const paladins = localFont({
  src: '../public/fonts/paladins/paladins.ttf',
  variable: '--font-paladins',
})

// Constants
const SITE_CONFIG = {
  TITLE: {
    TEMPLATE: '%s | Belouga Tournament',
    DEFAULT: 'Belouga Tournament',
  },
  DESCRIPTION: 'La référence des tournois amateurs e-sport.',
  LANG: 'fr',
} as const

// Metadata
export const metadata: Metadata = {
  title: {
    default: SITE_CONFIG.TITLE.DEFAULT,
    template: SITE_CONFIG.TITLE.TEMPLATE,
  },
  description: SITE_CONFIG.DESCRIPTION,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang={SITE_CONFIG.LANG} className="scroll-smooth">
      <body
        className={cn(
          inter.variable,
          paladins.variable,
          'bg-zinc-950 font-sans antialiased text-zinc-50',
        )}
      >
        <ScrollToTop />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
