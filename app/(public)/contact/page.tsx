/**
 * File: app/(public)/contact/page.tsx
 * Description: Contact page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { ContactBento } from '@/components/features/contact/contact-bento'
import { getGlobalSettings } from '@/lib/services/settings'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez-nous et rejoignez la communauté Belouga Tournament.',
}

const ContactPage = async () => {
  const settings = await getGlobalSettings()

  return (
    <div className="relative min-h-[calc(100vh-16px)] pb-20 pt-32">
      {/* Background Glows */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-96 w-full max-w-3xl -translate-x-1/2 bg-blue-500/10 blur-[120px]" />

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 font-paladins text-4xl tracking-wider text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] md:text-5xl lg:text-6xl">
            CONTACT
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            Une question ? Envie de rejoindre l'aventure ? Retrouvez-nous sur
            nos différents réseaux.{' '}
            <strong className="text-zinc-300">
              Discord reste notre canal principal pour toute assistance.
            </strong>
          </p>
        </div>

        {/* Bento Box */}
        <ContactBento settings={settings} />
      </div>
    </div>
  )
}

export default ContactPage
