/**
 * File: app/(public)/contact/page.tsx
 * Description: Public contact page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

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
import { getSiteSettings } from '@/lib/services/settings.service'

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

const CONTACT_EMAIL = 'contact@belouga.com'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez-nous pour toute question ou suggestion.',
}

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
            Contact
          </h1>
          <p className="text-lg text-zinc-400">
            Contactez-nous pour toute question ou suggestion.
          </p>
        </div>

        <div className="grid gap-6">
          <ContactCard
            icon={Mail}
            title="Email"
            description="Envoyez-nous un email pour toute question ou suggestion."
            href={`mailto:${CONTACT_EMAIL}`}
            buttonLabel="Envoyer"
          />

          {settings.socialDiscord && (
            <ContactCard
              icon={MessageSquare}
              title="Discord"
              description="Rejoignez-nous sur Discord pour discuter de tout."
              href={settings.socialDiscord}
              buttonLabel="Rejoindre"
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
              title="Twitch"
              description="Rejoignez-nous sur Twitch pour discuter de tout."
              href={settings.socialTwitch}
              buttonLabel="Rejoindre"
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
              title="Youtube"
              description="Rejoignez-nous sur Youtube pour discuter de tout."
              href={settings.socialYoutube}
              buttonLabel="Rejoindre"
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
              title="Instagram"
              description="Rejoignez-nous sur Instagram pour discuter de tout."
              href={settings.socialInstagram}
              buttonLabel="Rejoindre"
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
              title="Tiktok"
              description="Rejoignez-nous sur Tiktok pour discuter de tout."
              href={settings.socialTiktok}
              buttonLabel="Rejoindre"
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
