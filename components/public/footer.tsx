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
        siteName: string
        logoUrl: string | null
    }
}

export function Footer({ settings }: FooterProps) {
    const currentYear = new Date().getFullYear()

    const socialLinks = [
        {
            name: 'Discord',
            href: 'https://discord.gg/belouga', // Placeholder
            icon: MessageSquare,
            color: 'hover:text-[#5865F2]',
        },
        {
            name: 'Twitch',
            href: 'https://twitch.tv/quentadoulive',
            icon: Twitch,
            color: 'hover:text-[#9146FF]',
        },
        {
            name: 'YouTube',
            href: 'https://youtube.com', // Placeholder
            icon: Youtube,
            color: 'hover:text-[#FF0000]',
        },
        {
            name: 'TikTok',
            href: 'https://tiktok.com', // Placeholder
            icon: Video,
            color: 'hover:text-[#00f2ea]',
        },
        {
            name: 'Instagram',
            href: 'https://instagram.com', // Placeholder
            icon: Instagram,
            color: 'hover:text-[#E1306C]',
        },
    ]

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
                { label: 'Discord', href: 'https://discord.gg/belouga' },
                { label: 'Équipes', href: '/teams' }, // Placeholder
            ],
        },
        {
            title: 'Support',
            links: [
                { label: 'Contact', href: '/contact' },
                { label: 'FAQ', href: '/faq' }, // Placeholder
                { label: 'Mentions Légales', href: '/legal' }, // Placeholder
            ],
        },
    ]

    return (
        <footer className="border-t border-zinc-800 bg-zinc-950 pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid gap-12 lg:grid-cols-4 mb-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative">
                                {settings.logoUrl ? (
                                    <Image
                                        src={settings.logoUrl}
                                        alt={settings.siteName}
                                        width={48}
                                        height={48}
                                        className="h-12 w-auto transition-transform duration-300 group-hover:scale-110"
                                    />
                                ) : (
                                    <Image
                                        src="/assets/logo-bleu.png"
                                        alt={settings.siteName}
                                        width={48}
                                        height={48}
                                        className="h-12 w-auto transition-transform duration-300 group-hover:scale-110"
                                    />
                                )}
                                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                            <span className="font-paladins text-xl text-white tracking-wider">
                                {settings.siteName}
                            </span>
                        </Link>
                        <p className="text-zinc-400 leading-relaxed">
                            La plateforme de référence pour les tournois e-sport amateurs.
                            Rejoignez la compétition et montrez votre talent.
                        </p>
                        <div className="flex gap-4">
                            {socialLinks.map(social => (
                                <a
                                    key={social.name}
                                    href={social.href}
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
                            &copy; {currentYear} {settings.siteName}. Tous droits réservés.
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
