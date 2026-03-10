/**
 * File: components/features/layout/public-footer.tsx
 * Description: Server Component for the public site footer.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import {
  faDiscord,
  faInstagram,
  faTiktok,
  faTwitch,
  faYoutube,
  type IconDefinition,
} from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Image from 'next/image'
import Link from 'next/link'
import {
  AUTHOR,
  CURRENT_YEAR,
  DEFAULT_ASSETS,
  METADATA,
} from '@/lib/config/constants'
import { ROUTES } from '@/lib/config/routes'
import { getGlobalSettings } from '@/lib/services/settings'
import { cn } from '@/lib/utils/cn'
import { getCommitHash } from '@/lib/utils/commit-hash'

interface SocialLink {
  name: string
  href: string | null
  icon: IconDefinition
  colorClass: string
}

interface FooterLink {
  label: string
  href: string | null
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

const BRAND_COLORS = {
  DISCORD: 'hover:text-[#5865F2]',
  TWITCH: 'hover:text-[#9146FF]',
  YOUTUBE: 'hover:text-[#FF0000]',
  TIKTOK: 'hover:text-[#00f2ea]',
  INSTAGRAM: 'hover:text-[#E1306C]',
} as const

const FooterLogo = (props: { url: string | null }) => {
  return (
    <div className="relative">
      <Image
        src={props.url ?? DEFAULT_ASSETS.LOGO}
        alt={METADATA.NAME}
        width={120}
        height={120}
        className="h-24 w-auto transition-transform duration-500 group-hover:scale-110 md:h-32"
      />
      <div className="absolute inset-0 -z-10 rounded-full bg-blue-500/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  )
}

export const PublicFooter = async () => {
  const globalSettings = await getGlobalSettings()
  const commitHash = getCommitHash()

  const socialLinks: SocialLink[] = [
    {
      name: 'Discord',
      href: globalSettings.discordUrl,
      icon: faDiscord,
      colorClass: BRAND_COLORS.DISCORD,
    },
    {
      name: 'Twitch',
      href: globalSettings.twitchUrl,
      icon: faTwitch,
      colorClass: BRAND_COLORS.TWITCH,
    },
    {
      name: 'YouTube',
      href: globalSettings.youtubeUrl,
      icon: faYoutube,
      colorClass: BRAND_COLORS.YOUTUBE,
    },
    {
      name: 'TikTok',
      href: globalSettings.tiktokUrl,
      icon: faTiktok,
      colorClass: BRAND_COLORS.TIKTOK,
    },
    {
      name: 'Instagram',
      href: globalSettings.instagramUrl,
      icon: faInstagram,
      colorClass: BRAND_COLORS.INSTAGRAM,
    },
  ].filter(link => Boolean(link.href && link.href.trim() !== ''))

  const footerSections: FooterSection[] = [
    {
      title: 'Navigation',
      links: [
        { label: 'Accueil', href: ROUTES.HOME },
        { label: 'Classement', href: ROUTES.LEADERBOARD },
        { label: 'Contact', href: ROUTES.CONTACT },
      ],
    },
    {
      title: 'Tournois',
      links: [
        { label: 'Stream', href: ROUTES.STREAM },
        { label: 'Tournois à venir', href: ROUTES.TOURNAMENTS },
        {
          label: 'Archives des tournois',
          href: ROUTES.TOURNAMENTS_ARCHIVE,
        },
      ],
    },
    {
      title: 'Espace Joueur',
      links: [
        { label: 'Mon profil', href: ROUTES.PROFILE },
        { label: 'Mes inscriptions', href: `${ROUTES.PROFILE}#inscriptions` },
        {
          label: 'Historique des tournois',
          href: `${ROUTES.PROFILE}#tournaments-history`,
        },
      ],
    },
  ]

  return (
    <footer className="relative border-t border-white/10 bg-zinc-950 pb-8 pt-16 overflow-hidden mt-8">
      {/* Subtle top glow effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-blue-500/50 to-transparent" />
      <div className="absolute left-1/2 -top-24 h-48 w-full max-w-3xl -translate-x-1/2 bg-blue-500/10 blur-[100px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="mb-16 flex flex-col items-center justify-center text-center">
          <Link
            href={ROUTES.HOME}
            className="group flex flex-col items-center gap-6"
          >
            <FooterLogo url={globalSettings.logoUrl} />
            <span className="font-paladins text-3xl tracking-widest text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 group-hover:drop-shadow-[0_0_25px_rgba(59,130,246,0.8)] md:text-5xl">
              {METADATA.NAME}
            </span>
          </Link>
        </div>

        <div className="mb-16 grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {footerSections.map(section => (
            <div key={section.title}>
              <h3 className="mb-6 font-bold text-white uppercase tracking-wider text-sm">
                {section.title}
              </h3>
              <ul className="space-y-4">
                {section.links.map(link => {
                  if (!link.href) return null
                  return (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group flex items-center gap-2 text-zinc-400 transition-colors hover:text-blue-400"
                      >
                        <span className="h-px w-0 bg-blue-400 transition-all group-hover:w-3" />
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          {/* Social links */}
          <div>
            <h3 className="mb-6 font-bold text-white uppercase tracking-wider text-sm">
              Réseaux sociaux
            </h3>
            <p className="mb-4 leading-relaxed text-zinc-400">
              Rejoignez la communauté et participez aux futurs tournois.
            </p>
            <div className="flex gap-3 flex-wrap">
              {socialLinks.map(social => (
                <a
                  key={social.name}
                  href={social.href || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex size-10 items-center justify-center rounded-full border border-white/5 bg-white/5 text-zinc-400 transition-all duration-300 hover:scale-110 hover:border-white/10 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]',
                    social.colorClass,
                  )}
                  aria-label={social.name}
                >
                  <FontAwesomeIcon icon={social.icon} className="size-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
            <div className="flex flex-col items-center gap-1 lg:items-start">
              <p className="text-sm text-zinc-500 text-center lg:text-left">
                &copy; {CURRENT_YEAR} {METADATA.NAME}. Tous droits réservés.
              </p>
              <span className="font-mono text-xs text-zinc-600 transition-colors hover:text-zinc-400">
                build: {commitHash}
              </span>
            </div>

            <div className="flex flex-col items-center gap-4 text-sm text-zinc-500 sm:flex-row sm:gap-6">
              <Link
                href={ROUTES.LEGAL}
                className="transition-colors hover:text-white"
              >
                Mentions légales
              </Link>
              <Link
                href={ROUTES.PRIVACY}
                className="transition-colors hover:text-white"
              >
                Confidentialité
              </Link>
              <Link
                href={ROUTES.TERMS}
                className="transition-colors hover:text-white"
              >
                Conditions
              </Link>
              <a
                href={AUTHOR.URL}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
              >
                Développé par {AUTHOR.NAME}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
