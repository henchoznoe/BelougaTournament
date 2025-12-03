/**
 * File: app/(public)/contact/page.tsx
 * Description: Public contact page.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { Mail, MessageSquare, Twitter, Video } from 'lucide-react'
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

export default async function ContactPage() {
    const settings = await getSiteSettings()

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-2xl space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight text-white">
                        Contact Us
                    </h1>
                    <p className="text-lg text-zinc-400">
                        Have questions? Reach out to us through any of the
                        channels below.
                    </p>
                </div>

                <div className="grid gap-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Mail className="size-5 text-blue-500" />
                                Email Support
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                For general inquiries and support
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                asChild
                                variant="outline"
                                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                            >
                                <Link href="mailto:contact@belouga.com">
                                    contact@belouga.com
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {settings.socialDiscord && (
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <MessageSquare className="size-5 text-indigo-500" />
                                    Discord Community
                                </CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Join our community for live updates and chat
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    asChild
                                    className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
                                >
                                    <Link
                                        href={settings.socialDiscord}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Join Discord
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {settings.socialTwitter && (
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Twitter className="size-5 text-sky-500" />
                                    Twitter / X
                                </CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Follow us for the latest news
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    asChild
                                    className="w-full bg-black hover:bg-zinc-800 text-white border border-zinc-800"
                                >
                                    <Link
                                        href={settings.socialTwitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Follow on X
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {settings.socialTwitch && (
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Video className="size-5 text-purple-500" />
                                    Twitch
                                </CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Watch our tournaments live
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    asChild
                                    className="w-full bg-[#9146FF] hover:bg-[#7c2cf5] text-white"
                                >
                                    <Link
                                        href={settings.socialTwitch}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Watch Live
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
