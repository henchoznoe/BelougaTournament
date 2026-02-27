/**
 * File: app/(public)/contact/page.tsx
 * Description: Contact page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { ContactBento } from '@/components/features/contact/contact-bento'
import { PageHeader } from '@/components/ui/page-header'
import { getGlobalSettings } from '@/lib/services/settings'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez-nous et rejoignez la communauté Belouga Tournament.',
}

const ContactPage = async () => {
  const settings = await getGlobalSettings()

  return (
    <div className="min-h-dvh pb-20 pt-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <PageHeader
          title="CONTACT"
          description={
            <>
              Une question ? Envie de rejoindre l'aventure ? Retrouvez-nous sur
              nos différents réseaux.{' '}
              <strong className="text-zinc-300">
                Discord reste notre canal principal pour toute assistance.
              </strong>
            </>
          }
        />

        {/* Bento Box */}
        <ContactBento settings={settings} />
      </div>
    </div>
  )
}

export default ContactPage
