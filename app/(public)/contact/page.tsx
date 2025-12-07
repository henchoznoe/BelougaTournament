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

const CONTENT = {
  TITLE: 'Contactez-nous',
  DESCRIPTION:
    "Une question ? Une proposition ? N'hésitez pas à nous contacter via les canaux ci-dessous.",
  EMAIL: 'contact@belouga.com',
} as const

const CARDS_CONFIG = {
  EMAIL: {
    TITLE: 'Support Email',
    DESC: 'Pour toute demande générale ou administrative.',
    BTN_LABEL: 'Envoyer un email',
  },
  DISCORD: {
    TITLE: 'Communauté Discord',
    DESC: 'Rejoignez la communauté pour discuter en direct.',
    BTN_LABEL: 'Rejoindre le Discord',
    COLOR_BTN: 'bg-[#5865F2] hover:bg-[#4752C4] text-white',
    COLOR_ICON: 'text-[#5865F2]',
  },
  TWITCH: {
    TITLE: 'Chaîne Twitch',
    DESC: 'Regardez nos tournois en direct.',
    BTN_LABEL: 'Voir le live',
    COLOR_BTN: 'bg-[#9146FF] hover:bg-[#7c2cf5] text-white',
    COLOR_ICON: 'text-[#9146FF]',
  },
  YOUTUBE: {
    TITLE: 'Chaîne YouTube',
    DESC: 'Regardez les replays des tournois et les best of.',
    BTN_LABEL: 'Voir le live',
    COLOR_BTN: 'bg-[#FF0000] hover:bg-[#FF0000] text-white',
    COLOR_ICON: 'text-[#FF0000]',
  },
  INSTAGRAM: {
    TITLE: 'Chaîne Instagram',
    DESC: 'Venez nous suivre pour être informé des tournois et des news.',
    BTN_LABEL: 'Voir le live',
    COLOR_BTN: 'bg-[#E1306C] hover:bg-[#E1306C] text-white',
    COLOR_ICON: 'text-[#E1306C]',
  },
  TIKTOK: {
    TITLE: 'Chaîne TikTok',
    DESC: 'Venez nous suivre pour être informé des tournois et des news.',
    BTN_LABEL: 'Voir le live',
    COLOR_BTN: 'bg-[#00f2ea] hover:bg-[#00f2ea] text-white',
    COLOR_ICON: 'text-[#00f2ea]',
  },
} as const

export const metadata: Metadata = {
  title: 'Contact',
  description: CONTENT.DESCRIPTION,
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
            {CONTENT.TITLE}
          </h1>
          <p className="text-lg text-zinc-400">{CONTENT.DESCRIPTION}</p>
        </div>

        <div className="grid gap-6">
          <ContactCard
            icon={Mail}
            title={CARDS_CONFIG.EMAIL.TITLE}
            description={CARDS_CONFIG.EMAIL.DESC}
            href={`mailto:${CONTENT.EMAIL}`}
            buttonLabel={CONTENT.EMAIL}
          />

          {settings.socialDiscord && (
            <ContactCard
              icon={MessageSquare}
              title={CARDS_CONFIG.DISCORD.TITLE}
              description={CARDS_CONFIG.DISCORD.DESC}
              href={settings.socialDiscord}
              buttonLabel={CARDS_CONFIG.DISCORD.BTN_LABEL}
              colors={{
                button: CARDS_CONFIG.DISCORD.COLOR_BTN,
                icon: CARDS_CONFIG.DISCORD.COLOR_ICON,
              }}
              isExternal
            />
          )}

          {settings.socialTwitch && (
            <ContactCard
              icon={Video}
              title={CARDS_CONFIG.TWITCH.TITLE}
              description={CARDS_CONFIG.TWITCH.DESC}
              href={settings.socialTwitch}
              buttonLabel={CARDS_CONFIG.TWITCH.BTN_LABEL}
              colors={{
                button: CARDS_CONFIG.TWITCH.COLOR_BTN,
                icon: CARDS_CONFIG.TWITCH.COLOR_ICON,
              }}
              isExternal
            />
          )}

          {settings.socialYoutube && (
            <ContactCard
              icon={Video}
              title={CARDS_CONFIG.YOUTUBE.TITLE}
              description={CARDS_CONFIG.YOUTUBE.DESC}
              href={settings.socialYoutube}
              buttonLabel={CARDS_CONFIG.YOUTUBE.BTN_LABEL}
              colors={{
                button: CARDS_CONFIG.YOUTUBE.COLOR_BTN,
                icon: CARDS_CONFIG.YOUTUBE.COLOR_ICON,
              }}
              isExternal
            />
          )}

          {settings.socialInstagram && (
            <ContactCard
              icon={Video}
              title={CARDS_CONFIG.INSTAGRAM.TITLE}
              description={CARDS_CONFIG.INSTAGRAM.DESC}
              href={settings.socialInstagram}
              buttonLabel={CARDS_CONFIG.INSTAGRAM.BTN_LABEL}
              colors={{
                button: CARDS_CONFIG.INSTAGRAM.COLOR_BTN,
                icon: CARDS_CONFIG.INSTAGRAM.COLOR_ICON,
              }}
              isExternal
            />
          )}

          {settings.socialTiktok && (
            <ContactCard
              icon={Video}
              title={CARDS_CONFIG.TIKTOK.TITLE}
              description={CARDS_CONFIG.TIKTOK.DESC}
              href={settings.socialTiktok}
              buttonLabel={CARDS_CONFIG.TIKTOK.BTN_LABEL}
              colors={{
                button: CARDS_CONFIG.TIKTOK.COLOR_BTN,
                icon: CARDS_CONFIG.TIKTOK.COLOR_ICON,
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
