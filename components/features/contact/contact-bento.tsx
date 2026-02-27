/**
 * File: components/features/contact/contact-bento.tsx
 * Description: Bento box layout for contact links.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  faDiscord,
  faInstagram,
  faTiktok,
  faTwitch,
  faYoutube,
  type IconDefinition,
} from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { motion, type Variants } from 'framer-motion'
import { ArrowUpRight, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { GlobalSettings } from '@/prisma/generated/prisma/client'

interface ContactBentoProps {
  settings: GlobalSettings
}

interface SocialLink {
  id: string
  name: string
  href: string | null
  icon: IconDefinition
  colorClass: string
  bgHoverClass: string
  description: string
  isPrimary?: boolean
}

const BRAND_STYLES = {
  DISCORD: {
    color: 'text-[#5865F2]',
    bgHover: 'group-hover:bg-[#5865F2]/10',
    borderHover: 'group-hover:border-[#5865F2]/30',
    shadowHover: 'group-hover:shadow-[0_0_30px_rgba(88,101,242,0.15)]',
  },
  TWITCH: {
    color: 'text-[#9146FF]',
    bgHover: 'group-hover:bg-[#9146FF]/10',
    borderHover: 'group-hover:border-[#9146FF]/30',
    shadowHover: 'group-hover:shadow-[0_0_30px_rgba(145,70,255,0.15)]',
  },
  YOUTUBE: {
    color: 'text-[#FF0000]',
    bgHover: 'group-hover:bg-[#FF0000]/10',
    borderHover: 'group-hover:border-[#FF0000]/30',
    shadowHover: 'group-hover:shadow-[0_0_30px_rgba(255,0,0,0.15)]',
  },
  TIKTOK: {
    color: 'text-[#00f2ea]',
    bgHover: 'group-hover:bg-[#00f2ea]/10',
    borderHover: 'group-hover:border-[#00f2ea]/30',
    shadowHover: 'group-hover:shadow-[0_0_30px_rgba(0,242,234,0.15)]',
  },
  INSTAGRAM: {
    color: 'text-[#E1306C]',
    bgHover: 'group-hover:bg-[#E1306C]/10',
    borderHover: 'group-hover:border-[#E1306C]/30',
    shadowHover: 'group-hover:shadow-[0_0_30px_rgba(225,48,108,0.15)]',
  },
} as const

/** Displays the social/contact links in a modern Bento Box layout */
export const ContactBento = ({ settings }: ContactBentoProps) => {
  const socialLinks = (
    [
      {
        id: 'discord',
        name: 'Discord',
        href: settings.discordUrl,
        icon: faDiscord,
        colorClass: BRAND_STYLES.DISCORD.color,
        bgHoverClass: `${BRAND_STYLES.DISCORD.bgHover} ${BRAND_STYLES.DISCORD.borderHover} ${BRAND_STYLES.DISCORD.shadowHover}`,
        description:
          'Rejoignez la communauté, trouvez des coéquipiers et discutez avec le staff.',
        isPrimary: true,
      },
      {
        id: 'twitch',
        name: 'Twitch',
        href: settings.twitchUrl,
        icon: faTwitch,
        colorClass: BRAND_STYLES.TWITCH.color,
        bgHoverClass: `${BRAND_STYLES.TWITCH.bgHover} ${BRAND_STYLES.TWITCH.borderHover} ${BRAND_STYLES.TWITCH.shadowHover}`,
        description: 'Suivez nos tournois en direct.',
      },
      {
        id: 'youtube',
        name: 'YouTube',
        href: settings.youtubeUrl,
        icon: faYoutube,
        colorClass: BRAND_STYLES.YOUTUBE.color,
        bgHoverClass: `${BRAND_STYLES.YOUTUBE.bgHover} ${BRAND_STYLES.YOUTUBE.borderHover} ${BRAND_STYLES.YOUTUBE.shadowHover}`,
        description: 'Revivez les meilleurs moments.',
      },
      {
        id: 'tiktok',
        name: 'TikTok',
        href: settings.tiktokUrl,
        icon: faTiktok,
        colorClass: BRAND_STYLES.TIKTOK.color,
        bgHoverClass: `${BRAND_STYLES.TIKTOK.bgHover} ${BRAND_STYLES.TIKTOK.borderHover} ${BRAND_STYLES.TIKTOK.shadowHover}`,
        description: 'Clips et highlights exclusifs.',
      },
      {
        id: 'instagram',
        name: 'Instagram',
        href: settings.instagramUrl,
        icon: faInstagram,
        colorClass: BRAND_STYLES.INSTAGRAM.color,
        bgHoverClass: `${BRAND_STYLES.INSTAGRAM.bgHover} ${BRAND_STYLES.INSTAGRAM.borderHover} ${BRAND_STYLES.INSTAGRAM.shadowHover}`,
        description: 'Photos et actus au quotidien.',
      },
    ] as SocialLink[]
  ).filter(
    (link): link is SocialLink & { href: string } =>
      typeof link.href === 'string' && link.href.trim() !== '',
  )

  const primaryLink = socialLinks.find(link => link.isPrimary)
  const secondaryLinks = socialLinks.filter(link => !link.isPrimary)

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
  }

  if (socialLinks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <MessageSquare className="mb-4 size-12 text-zinc-600" />
        <p className="text-zinc-400">
          Aucun moyen de contact n'est configuré pour le moment.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-5xl"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Primary Link (Discord) takes up more space */}
        {primaryLink && (
          <motion.a
            variants={itemVariants}
            href={primaryLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'group relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-8 backdrop-blur-xl transition-all duration-500',
              'md:col-span-2 lg:col-span-2 lg:row-span-1',
              primaryLink.bgHoverClass,
            )}
          >
            {/* Background Icon */}
            <FontAwesomeIcon
              icon={primaryLink.icon}
              className={cn(
                'absolute -bottom-8 -right-8 size-64 opacity-5 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-10',
                primaryLink.colorClass,
              )}
            />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div
                  className={cn(
                    'mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 transition-colors',
                    primaryLink.bgHoverClass,
                  )}
                >
                  <FontAwesomeIcon
                    icon={primaryLink.icon}
                    className={cn('size-7', primaryLink.colorClass)}
                  />
                </div>
                <h3 className="mb-2 text-3xl font-bold tracking-tight text-white">
                  {primaryLink.name}
                </h3>
                <p className="max-w-md text-lg text-zinc-400">
                  {primaryLink.description}
                </p>
              </div>

              <div className="mt-8 flex items-center text-sm font-medium text-white">
                <span className="mr-2">Rejoindre le serveur</span>
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </div>
            </div>
          </motion.a>
        )}

        {/* Secondary Links */}
        {secondaryLinks.map(link => (
          <motion.a
            key={link.id}
            variants={itemVariants}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 backdrop-blur-xl transition-all duration-500',
              link.bgHoverClass,
            )}
          >
            {/* Background Icon */}
            <FontAwesomeIcon
              icon={link.icon}
              className={cn(
                'absolute -bottom-4 -right-4 size-32 opacity-5 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-10',
                link.colorClass,
              )}
            />

            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between">
                <div
                  className={cn(
                    'inline-flex size-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 transition-colors',
                    link.bgHoverClass,
                  )}
                >
                  <FontAwesomeIcon
                    icon={link.icon}
                    className={cn('size-5', link.colorClass)}
                  />
                </div>
                <ArrowUpRight className="size-5 text-zinc-600 transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white" />
              </div>
              <h3 className="mb-1 text-xl font-bold text-white">{link.name}</h3>
              <p className="text-sm text-zinc-500 transition-colors group-hover:text-zinc-400">
                {link.description}
              </p>
            </div>
          </motion.a>
        ))}
      </div>
    </motion.div>
  )
}
