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
  Instagram,
  type LucideIcon,
  MessageSquare,
  Twitch,
  Video,
  Youtube,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { APP_METADATA, EXTERNAL_LINKS } from "@/lib/constants"
import { getSiteSettings } from "@/lib/data/settings"
import { APP_ROUTES } from "@/lib/config/routes"
import { fr } from "@/lib/i18n/dictionaries/fr"

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
      title: fr.layout.footer.links.tournaments.title,
      links: [
        { label: fr.layout.footer.links.tournaments.upcoming, href: APP_ROUTES.TOURNAMENTS },
        {
          label: fr.layout.footer.links.tournaments.archive,
          href: APP_ROUTES.TOURNAMENTS_ARCHIVE,
        },
        { label: fr.layout.footer.links.tournaments.rules, href: APP_ROUTES.RULES },
      ],
    },
    {
      title: fr.layout.footer.links.community.title,
      links: [
        { label: fr.layout.footer.links.community.stream, href: APP_ROUTES.STREAM },
        {
          label: fr.layout.footer.links.community.discord,
          href: settings.socialDiscord || EXTERNAL_LINKS.DISCORD,
        },
      ],
    },
    {
      title: fr.layout.footer.links.support.title,
      links: [
        { label: fr.layout.footer.links.support.contact, href: APP_ROUTES.CONTACT },
        { label: fr.layout.footer.links.support.admin, href: APP_ROUTES.ADMIN_DASHBOARD },
        { label: fr.layout.footer.links.support.legal, href: APP_ROUTES.LEGAL },
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
              {fr.layout.footer.description}
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
                {fr.layout.footer.rightsReserved}
              </p>

              <div className="flex items-center gap-6 text-sm text-zinc-500">
                <Link
                  href={APP_ROUTES.PRIVACY}
                  className="transition-colors hover:text-white"
                >
                  {fr.layout.footer.links.privacy}
                </Link>
                <Link
                  href={APP_ROUTES.TERMS}
                  className="transition-colors hover:text-white"
                >
                  {fr.layout.footer.links.terms}
                </Link>
                <a
                  href={APP_METADATA.AUTHOR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors hover:text-blue-400"
                >
                  {fr.layout.footer.developedBy}{" "}
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
