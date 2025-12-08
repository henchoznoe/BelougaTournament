/**
 * File: app/(public)/contact/page.tsx
 * Description: Public contact page.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { type LucideIcon, Mail, MessageSquare, Video } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getSiteSettings } from '@/lib/data/settings'
import { fr } from '@/lib/i18n/dictionaries/fr'

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

interface ContactCardProps {
  icon: LucideIcon
  title: string
  description: string
  href: string
  buttonLabel: string
  colors?: {
    button?: string
    icon?: string
  }
  isExternal?: boolean
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const CONTACT_EMAIL = 'contact@belouga.com'

export const metadata: Metadata = {
  title: fr.pages.contact.title,
  description: fr.pages.contact.description,
}

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const ContactCard = ({
  icon: Icon,
  title,
  description,
  href,
  buttonLabel,
  colors,
  isExternal = false,
}: ContactCardProps) => {
  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Icon className={`size-5 ${colors?.icon || 'text-blue-500'}`} />
          {title}
        </CardTitle>
        <CardDescription className="text-zinc-400">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          asChild
          variant={colors?.button ? 'default' : 'outline'}
          className={
            colors?.button
              ? colors.button
              : 'w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white'
          }
        >
          <Link
            href={href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
          >
            {buttonLabel}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

const ContactPage = async () => {
  const settings = await getSiteSettings()

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            {fr.pages.contact.title}
          </h1>
          <p className="text-lg text-zinc-400">
            {fr.pages.contact.description}
          </p>
        </div>

        <div className="grid gap-6">
          <ContactCard
            icon={Mail}
            title={fr.pages.contact.cards.email.title}
            description={fr.pages.contact.cards.email.desc}
            href={`mailto:${CONTACT_EMAIL}`}
            buttonLabel={fr.pages.contact.cards.email.btnLabel}
          />

          {settings.socialDiscord && (
            <ContactCard
              icon={MessageSquare}
              title={fr.pages.contact.cards.discord.title}
              description={fr.pages.contact.cards.discord.desc}
              href={settings.socialDiscord}
              buttonLabel={fr.pages.contact.cards.discord.btnLabel}
              colors={{
                button: 'bg-[#5865F2] hover:bg-[#4752C4] text-white',
                icon: 'text-[#5865F2]',
              }}
              isExternal
            />
          )}

          {settings.socialTwitch && (
            <ContactCard
              icon={Video}
              title={fr.pages.contact.cards.twitch.title}
              description={fr.pages.contact.cards.twitch.desc}
              href={settings.socialTwitch}
              buttonLabel={fr.pages.contact.cards.twitch.btnLabel}
              colors={{
                button: 'bg-[#9146FF] hover:bg-[#7c2cf5] text-white',
                icon: 'text-[#9146FF]',
              }}
              isExternal
            />
          )}

          {settings.socialYoutube && (
            <ContactCard
              icon={Video}
              title={fr.pages.contact.cards.youtube.title}
              description={fr.pages.contact.cards.youtube.desc}
              href={settings.socialYoutube}
              buttonLabel={fr.pages.contact.cards.youtube.btnLabel}
              colors={{
                button: 'bg-[#FF0000] hover:bg-[#FF0000] text-white',
                icon: 'text-[#FF0000]',
              }}
              isExternal
            />
          )}

          {settings.socialInstagram && (
            <ContactCard
              icon={Video}
              title={fr.pages.contact.cards.instagram.title}
              description={fr.pages.contact.cards.instagram.desc}
              href={settings.socialInstagram}
              buttonLabel={fr.pages.contact.cards.instagram.btnLabel}
              colors={{
                button: 'bg-[#E1306C] hover:bg-[#E1306C] text-white',
                icon: 'text-[#E1306C]',
              }}
              isExternal
            />
          )}

          {settings.socialTiktok && (
            <ContactCard
              icon={Video}
              title={fr.pages.contact.cards.tiktok.title}
              description={fr.pages.contact.cards.tiktok.desc}
              href={settings.socialTiktok}
              buttonLabel={fr.pages.contact.cards.tiktok.btnLabel}
              colors={{
                button: 'bg-[#00f2ea] hover:bg-[#00f2ea] text-white',
                icon: 'text-[#00f2ea]',
              }}
              isExternal
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default ContactPage
