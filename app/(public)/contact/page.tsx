/**
 * File: app/(public)/contact/page.tsx
 * Description: Contact page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { ContactBento } from '@/components/public/contact/contact-bento'
import { ContactForm } from '@/components/public/contact/contact-form'
import { PageHeader } from '@/components/ui/page-header'
import { getGlobalSettings } from '@/lib/services/settings'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez-nous et rejoignez la communauté Belouga Tournament.',
}

const hasSocialLinks = (
  settings: Awaited<ReturnType<typeof getGlobalSettings>>,
) =>
  [
    settings.discordUrl,
    settings.twitchUrl,
    settings.youtubeUrl,
    settings.tiktokUrl,
    settings.instagramUrl,
  ].some(url => typeof url === 'string' && url.trim() !== '')

const ContactPage = async () => {
  const settings = await getGlobalSettings()
  const showBento = hasSocialLinks(settings)

  return (
    <div className="min-h-dvh pb-20 pt-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <PageHeader
          title="CONTACT"
          description={
            <>
              Une question ? Envie de rejoindre l'aventure ? Envie de nous
              soutenir en devenant un sponsor ? Retrouvez-nous sur nos
              différents réseaux ou écrivez-nous via le formulaire ci-dessous.
            </>
          }
        />

        {/* Bento Box — only when social links are configured */}
        {showBento && (
          <>
            <ContactBento settings={settings} />
            <div className="mx-auto my-16 h-px w-full max-w-5xl bg-white/5" />
          </>
        )}

        {/* Contact Form */}
        <ContactForm />
      </div>
    </div>
  )
}

export default ContactPage
