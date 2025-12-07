/**
 * File: components/layout/footer.tsx
 * Description: Server Component for the public site footer.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import {
  Gamepad2,
  Instagram,
  type LucideIcon,
  Mail,
  MapPin,
  MessageSquare,
  Twitch,
  Twitter,
  Video,
  Youtube,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { APP_METADATA, EXTERNAL_LINKS } from "@/lib/constants"
import { getSiteSettings } from "@/lib/data/settings"

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

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

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const BRAND_COLORS = {
  DISCORD: "hover:text-[#5865F2]",
  TWITCH: "hover:text-[#9146FF]",
  YOUTUBE: "hover:text-[#FF0000]",
  TIKTOK: "hover:text-[#00f2ea]",
  INSTAGRAM: "hover:text-[#E1306C]",
} as const

const CONTENT = {
  DESCRIPTION:
    "La plateforme de référence pour les tournois e-sport amateurs. Rejoignez la compétition et montrez votre talent.",
  RIGHTS_RESERVED: "Tous droits réservés.",
  DEVELOPED_BY: "Développé par",
  LINKS: {
    PRIVACY: "Politique de confidentialité",
    TERMS: "Conditions d'utilisation",
    TOURNAMENTS: {
      TITLE: "Tournois",
      UPCOMING: "Prochains",
      ARCHIVE: "Archives",
      RULES: "Règlement",
    },
    COMMUNITY: {
      TITLE: "Communauté",
      STREAM: "Stream",
      DISCORD: "Discord",
      TEAMS: "Équipes",
    },
    SUPPORT: {
      TITLE: "Support",
      CONTACT: "Contact",
      ADMIN: "Administration",
      LEGAL: "Mentions Légales",
    },
  },
} as const

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const FooterLogo = ({ url }: { url: string | null }) => {
  const src = url || APP_METADATA.DEFAULT_LOGO

  return (
    <div className="relative">
      <Image
        src={src}
        alt={APP_METADATA.NAME}
        width={120}
        height={120}
        className="h-24 w-auto transition-transform duration-500 group-hover:scale-110 md:h-32"
      />
      <div className="absolute inset-0 -z-10 rounded-full bg-blue-500/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  )
}

export const Footer = async () => {
  const settings = await getSiteSettings()
  const currentYear = new Date().getFullYear()

  const socialLinks: SocialLink[] = [
    {
      name: "Discord",
      href: settings.socialDiscord,
      icon: MessageSquare,
      colorClass: BRAND_COLORS.DISCORD,
    },
    {
      name: "Twitch",
      href: settings.socialTwitch,
      icon: Twitch,
      colorClass: BRAND_COLORS.TWITCH,
    },
    {
      name: "YouTube",
      href: settings.socialYoutube,
      icon: Youtube,
      colorClass: BRAND_COLORS.YOUTUBE,
    },
    {
      name: "TikTok",
      href: settings.socialTiktok,
      icon: Video,
      colorClass: BRAND_COLORS.TIKTOK,
    },
    {
      name: "Instagram",
      href: settings.socialInstagram,
      icon: Instagram,
      colorClass: BRAND_COLORS.INSTAGRAM,
    },
  ].filter((link) => Boolean(link.href && link.href.trim() !== ""))

  const footerSections: FooterSection[] = [
    {
      title: CONTENT.LINKS.TOURNAMENTS.TITLE,
      links: [
        { label: CONTENT.LINKS.TOURNAMENTS.UPCOMING, href: "/tournaments" },
        {
          label: CONTENT.LINKS.TOURNAMENTS.ARCHIVE,
          href: "/tournaments/archive",
        },
        { label: CONTENT.LINKS.TOURNAMENTS.RULES, href: "/rules" },
      ],
    },
    {
      title: CONTENT.LINKS.COMMUNITY.TITLE,
      links: [
        { label: CONTENT.LINKS.COMMUNITY.STREAM, href: "/stream" },
        {
          label: CONTENT.LINKS.COMMUNITY.DISCORD,
          href: settings.socialDiscord || EXTERNAL_LINKS.DISCORD,
        },
        { label: CONTENT.LINKS.COMMUNITY.TEAMS, href: "/teams" },
      ],
    },
    {
      title: CONTENT.LINKS.SUPPORT.TITLE,
      links: [
        { label: CONTENT.LINKS.SUPPORT.CONTACT, href: "/contact" },
        { label: CONTENT.LINKS.SUPPORT.ADMIN, href: "/admin" },
        { label: CONTENT.LINKS.SUPPORT.LEGAL, href: "/legal" },
      ],
    },
  ]

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 pb-8 pt-16">
      <div className="container mx-auto px-4">
        <div className="mb-16 flex flex-col items-center justify-center text-center">
          <Link href="/" className="group flex flex-col items-center gap-6">
            <FooterLogo url={settings.logoUrl} />
            <span className="font-paladins text-3xl tracking-widest text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 group-hover:drop-shadow-[0_0_25px_rgba(59,130,246,0.8)] md:text-5xl">
              {APP_METADATA.NAME}
            </span>
          </Link>
        </div>

        <div className="mb-16 grid gap-12 lg:grid-cols-4">
          <div className="space-y-6">
            <p className="leading-relaxed text-zinc-400">
              {CONTENT.DESCRIPTION}
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href || "#"}
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

        <div className="border-t border-zinc-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-zinc-500">
              &copy; {currentYear} {APP_METADATA.NAME}.{" "}
              {CONTENT.RIGHTS_RESERVED}
            </p>

            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link
                href="/privacy"
                className="transition-colors hover:text-white"
              >
                {CONTENT.LINKS.PRIVACY}
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-white"
              >
                {CONTENT.LINKS.TERMS}
              </Link>
              <a
                href={APP_METADATA.AUTHOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-blue-400"
              >
                {CONTENT.DEVELOPED_BY}{" "}
                <span className="font-semibold text-zinc-300">
                  {APP_METADATA.AUTHOR_NAME}
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
