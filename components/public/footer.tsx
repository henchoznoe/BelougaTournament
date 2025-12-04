/**
 * File: components/public/footer.tsx
 * Description: Footer component for the public website.
 * Author: Noé Henchoz
 * Date: 2025-12-04
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
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface FooterProps {
    settings: {
        logoUrl: string | null
        socialDiscord: string | null
        socialTwitch: string | null
        socialTiktok: string | null
        socialInstagram: string | null
        socialYoutube: string | null
    }
}

export function Footer({ settings }: FooterProps) {
    const currentYear = new Date().getFullYear()
    const siteName = "Belouga Tournament"

    const socialLinks = [
        {
            name: 'Discord',
            href: settings.socialDiscord,
            icon: MessageSquare,
            color: 'hover:text-[#5865F2]',
        },
        {
            name: 'Twitch',
            href: settings.socialTwitch,
            icon: Twitch,
            color: 'hover:text-[#9146FF]',
        },
        {
            name: 'YouTube',
            href: settings.socialYoutube,
            icon: Youtube,
            color: 'hover:text-[#FF0000]',
        },
        {
            name: 'TikTok',
            href: settings.socialTiktok,
            icon: Video,
            color: 'hover:text-[#00f2ea]',
        },
        {
            name: 'Instagram',
            href: settings.socialInstagram,
            icon: Instagram,
            color: 'hover:text-[#E1306C]',
        },
    ].filter(link => link.href && link.href.trim() !== '')

    const footerLinks = [
        {
            title: 'Tournois',
            links: [
                { label: 'Tous les tournois', href: '/tournaments' },
                { label: 'Résultats', href: '/tournaments/archive' },
                { label: 'Règlement', href: '/rules' }, // Placeholder
            ],
        },
        {
            title: 'Communauté',
            links: [
                { label: 'Stream', href: '/stream' },
                { label: 'Discord', href: settings.socialDiscord || 'https://discord.gg/belouga' },
                { label: 'Équipes', href: '/teams' }, // Placeholder
            ],
        },
        {
            title: 'Support',
            links: [
                { label: 'Contact', href: '/contact' },
                { label: 'Administration', href: '/admin' },
                { label: 'Mentions Légales', href: '/legal' }, // Placeholder
            ],
        },
    ]

    return (
        <footer className="border-t border-zinc-800 bg-zinc-950 pt-16 pb-8">
            <div className="container mx-auto px-4">
                {/* Top Section: Logo & Title */}
                <div className="mb-16 flex flex-col items-center justify-center text-center">
                    <Link href="/" className="group flex flex-col items-center gap-6">
                        <div className="relative">
                            {settings.logoUrl ? (
                                <Image
                                    src={settings.logoUrl}
                                    alt={siteName}
                                    width={120}
                                    height={120}
                                    className="h-24 w-auto transition-transform duration-500 group-hover:scale-110 md:h-32"
                                />
                            ) : (
                                <Image
                                    src="/assets/logo-blue.png"
                                    alt={siteName}
                                    width={120}
                                    height={120}
                                    className="h-24 w-auto transition-transform duration-500 group-hover:scale-110 md:h-32"
                                />
                            )}
                            <div className="absolute inset-0 -z-10 rounded-full bg-blue-500/20 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        </div>
                        <span className="font-paladins text-3xl tracking-widest text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 group-hover:drop-shadow-[0_0_25px_rgba(59,130,246,0.8)] md:text-5xl">
                            {siteName}
                        </span>
                    </Link>
                </div>

                <div className="grid gap-12 lg:grid-cols-4 mb-16">
                    {/* Brand Section (Description & Socials) */}
                    <div className="space-y-6">
                        <p className="text-zinc-400 leading-relaxed">
                            La plateforme de référence pour les tournois e-sport amateurs.
                            Rejoignez la compétition et montrez votre talent.
                        </p>
                        <div className="flex gap-4">
                            {socialLinks.map(social => (
                                <a
                                    key={social.name}
                                    href={social.href || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`rounded-lg bg-zinc-900 p-2 text-zinc-400 transition-all hover:bg-zinc-800 ${social.color}`}
                                    aria-label={social.name}
                                >
                                    <social.icon className="size-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Sections */}
                    {footerLinks.map(section => (
                        <div key={section.title}>
                            <h3 className="mb-6 font-bold text-white">
                                {section.title}
                            </h3>
                            <ul className="space-y-4">
                                {section.links.map(link => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-zinc-400 transition-colors hover:text-blue-400 flex items-center gap-2 group"
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

                {/* Bottom Bar */}
                <div className="border-t border-zinc-800 pt-8">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <p className="text-sm text-zinc-500">
                            &copy; {currentYear} {siteName}. Tous droits réservés.
                        </p>
                        <div className="flex items-center gap-6 text-sm text-zinc-500">
                            <Link href="/privacy" className="hover:text-white transition-colors">
                                Politique de confidentialité
                            </Link>
                            <Link href="/terms" className="hover:text-white transition-colors">
                                Conditions d'utilisation
                            </Link>
                            <a
                                href="https://henchoznoe.ch"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                            >
                                Développé par <span className="font-semibold text-zinc-300">Noé Henchoz</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
