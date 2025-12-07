/**
 * File: app/layout.tsx
 * Description: Root layout for the application.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import { ScrollToTop } from '@/components/scroll-to-top'
import { Toaster } from '@/components/ui/sonner'
import { APP_METADATA } from '@/lib/constants'
import { cn } from '@/lib/utils'
import './globals.css'

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

interface LayoutProps {
  children: React.ReactNode
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const paladins = localFont({
  src: '../public/fonts/paladins/paladins.ttf',
  variable: '--font-paladins',
})

export const metadata: Metadata = {
  title: {
    default: APP_METADATA.NAME,
    template: APP_METADATA.TEMPLATE_TITLE,
  },
  description: APP_METADATA.DESCRIPTION,
}

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const RootLayout = (props: Readonly<LayoutProps>) => {
  return (
    <html lang={APP_METADATA.LOCALE} className="scroll-smooth">
      <body
        className={cn(
          inter.variable,
          paladins.variable,
          'bg-zinc-950 font-sans antialiased text-zinc-50',
        )}
      >
        <ScrollToTop />
        {props.children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}

export default RootLayout
