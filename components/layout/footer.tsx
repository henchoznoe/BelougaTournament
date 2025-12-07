/**
 * File: components/public/footer.tsx
 * Description: Server Component for the public site footer.
 * Author: Noé Henchoz
 * Date: 2025-12-06
 * License: MIT
 */

import {
    Gamepad2,
    Instagram,
    Mail,
    MapPin,
    Twitch,
    Twitter,
    Youtube,
    Video,
    MessageSquare,
    LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getSiteSettings } from '@/lib/data/settings'

// Types
interface SocialLink {
  name: string
  href: string | null
  icon: LucideIcon
  colorClass: string
}

interface FooterLink {
  label: string
  href: string
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

// Constants
const SITE_CONFIG = {
  NAME: 'Belouga Tournament',
  DEFAULT_LOGO: '/assets/logo-blue.png',
  DEFAULT_DISCORD: 'https://discord.gg/belouga',
  AUTHOR_URL: 'https://henchoznoe.ch',
  AUTHOR_NAME: 'Noé Henchoz',
} as const

// Map specific brand colors for hover states to avoid magic strings in JSX
const BRAND_COLORS = {
  DISCORD: 'hover:text-[#5865F2]',
  TWITCH: 'hover:text-[#9146FF]',
  YOUTUBE: 'hover:text-[#FF0000]',
  TIKTOK: 'hover:text-[#00f2ea]',
  INSTAGRAM: 'hover:text-[#E1306C]',
} as const

const FooterLogo = ({ url }: { url: string | null }) => {
  const src = url || SITE_CONFIG.DEFAULT_LOGO

  return (
    <div className="relative">
      <Image
        src={src}
        alt={SITE_CONFIG.NAME}
        width={120}
        height={120}
        className="h-24 w-auto transition-transform duration-500 group-hover:scale-110 md:h-32"
      />
      <div className="absolute inset-0 -z-10 opacity-0 blur-3xl transition-opacity duration-500 rounded-full bg-blue-500/20 group-hover:opacity-100" />
    </div>
  )
}

export async function Footer() {
  const settings = await getSiteSettings()
  const currentYear = new Date().getFullYear()

  // Prepare Social Links (Filter out empty ones)
  const socialLinks: SocialLink[] = [
    {
      name: 'Discord',
      href: settings.socialDiscord,
      icon: MessageSquare,
      colorClass: BRAND_COLORS.DISCORD,
    },
    {
      name: 'Twitch',
      href: settings.socialTwitch,
      icon: Twitch,
      colorClass: BRAND_COLORS.TWITCH,
    },
    {
      name: 'YouTube',
      href: settings.socialYoutube,
      icon: Youtube,
      colorClass: BRAND_COLORS.YOUTUBE,
    },
    {
      name: 'TikTok',
      href: settings.socialTiktok,
      icon: Video,
      colorClass: BRAND_COLORS.TIKTOK,
    },
    {
      name: 'Instagram',
      href: settings.socialInstagram,
      icon: Instagram,
      colorClass: BRAND_COLORS.INSTAGRAM,
    },
  ].filter((link) => Boolean(link.href && link.href.trim() !== ''))

  // Define Navigation Structure
  const footerSections: FooterSection[] = [
    {
      title: 'Tournois',
      links: [
        { label: 'Prochains', href: '/tournaments' },
        { label: 'Archives', href: '/tournaments/archive' },
        { label: 'Règlement', href: '/rules' },
      ],
    },
    {
      title: 'Communauté',
      links: [
        { label: 'Stream', href: '/stream' },
        {
          label: 'Discord',
          // Fallback to default discord if not set in DB settings
          href: settings.socialDiscord || SITE_CONFIG.DEFAULT_DISCORD,
        },
        { label: 'Équipes', href: '/teams' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Contact', href: '/contact' },
        { label: 'Administration', href: '/admin' },
        { label: 'Mentions Légales', href: '/legal' },
      ],
    },
  ]

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 pb-8 pt-16">
      <div className="container mx-auto px-4">

        {/* Top Section: Brand Identity */}
        <div className="mb-16 flex flex-col items-center justify-center text-center">
          <Link href="/" className="group flex flex-col items-center gap-6">
            <FooterLogo url={settings.logoUrl} />
            <span className="font-paladins text-3xl tracking-widest text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 group-hover:drop-shadow-[0_0_25px_rgba(59,130,246,0.8)] md:text-5xl">
              {SITE_CONFIG.NAME}
            </span>
          </Link>
        </div>

        {/* Middle Section: Grid Layout */}
        <div className="mb-16 grid gap-12 lg:grid-cols-4">

          {/* Description & Social Icons */}
          <div className="space-y-6">
            <p className="leading-relaxed text-zinc-400">
              La plateforme de référence pour les tournois e-sport amateurs.
              Rejoignez la compétition et montrez votre talent.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-lg bg-zinc-900 p-2 text-zinc-400 transition-all hover:bg-zinc-800 ${social.colorClass}`}
                  aria-label={social.name}
                >
                  <social.icon className="size-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-6 font-bold text-white">{section.title}</h3>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-2 text-zinc-400 transition-colors hover:text-blue-400"
                    >
                      <span className="h-px w-0 bg-blue-400 transition-all group-hover:w-3" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className="border-t border-zinc-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-zinc-500">
              &copy; {currentYear} {SITE_CONFIG.NAME}. Tous droits réservés.
            </p>

            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/privacy" className="transition-colors hover:text-white">
                Politique de confidentialité
              </Link>
              <Link href="/terms" className="transition-colors hover:text-white">
                Conditions d'utilisation
              </Link>
              <a
                href={SITE_CONFIG.AUTHOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-blue-400"
              >
                Développé par <span className="font-semibold text-zinc-300">{SITE_CONFIG.AUTHOR_NAME}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
