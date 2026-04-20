/**
 * File: app/layout.tsx
 * Description: Root layout for the application.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import { Suspense } from 'react'
import { ScrollToTop } from '@/components/ui/scroll-to-top'
import { Toaster } from '@/components/ui/sonner'
import { DEFAULT_ASSETS, METADATA } from '@/lib/config/constants'
import { env } from '@/lib/core/env'
import { cn } from '@/lib/utils/cn'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { config } from '@fortawesome/fontawesome-svg-core'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

interface LayoutProps {
  children: React.ReactNode
}

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const paladins = localFont({
  src: '../public/fonts/paladins/paladins.ttf',
  variable: '--font-paladins',
})

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: METADATA.NAME,
    template: METADATA.TEMPLATE_TITLE,
  },
  description: METADATA.DESCRIPTION,
  icons: {
    icon: DEFAULT_ASSETS.LOGO,
    apple: DEFAULT_ASSETS.LOGO,
  },
}

config.autoAddCss = false

const RootLayout = (props: Readonly<LayoutProps>) => {
  return (
    <html
      lang="fr-CH"
      className="dark scroll-smooth"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className={cn(
          inter.variable,
          paladins.variable,
          'bg-zinc-950 font-sans antialiased text-zinc-50',
        )}
      >
        <Suspense>
          <ScrollToTop />
        </Suspense>
        {props.children}
        <Toaster richColors position="bottom-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

export default RootLayout
