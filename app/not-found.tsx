'use client'

/**
 * File: app/not-found.tsx
 * Description: Custom 404 page with gaming aesthetic.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Gamepad2, Home, Search, Trophy } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
    return (
        <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-zinc-950 text-zinc-50">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0">
                <Image
                    alt="Background"
                    className="object-cover opacity-20 grayscale"
                    fill
                    priority
                    src="/assets/wall.png"
                />
                <div className="absolute inset-0 bg-zinc-950/80" />
            </div>

            <div className="relative z-10 container mx-auto px-4 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="mb-8 flex justify-center"
                >
                    <div className="relative">
                        <div className="absolute inset-0 animate-ping rounded-full bg-red-500/20" />
                        <div className="relative rounded-full bg-zinc-900/50 p-6 ring-1 ring-white/10 backdrop-blur-xl">
                            <Gamepad2 className="size-16 text-red-500" />
                        </div>
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white to-zinc-600 sm:text-9xl"
                >
                    404
                </motion.h1>

                <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4 text-2xl font-bold uppercase tracking-widest text-red-500 sm:text-3xl"
                >
                    Game Over
                </motion.h2>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mx-auto mt-6 max-w-lg text-lg text-zinc-400"
                >
                    Oups ! Il semblerait que vous ayez atteint les limites de la
                    carte. Cette zone n'est pas encore débloquée ou a été
                    supprimée.
                </motion.p>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
                >
                    <Button
                        asChild
                        size="lg"
                        className="h-12 min-w-[200px] bg-blue-600 text-base font-semibold hover:bg-blue-500 hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]"
                    >
                        <Link href="/">
                            <Home className="mr-2 size-5" />
                            Respawn (Accueil)
                        </Link>
                    </Button>

                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="h-12 min-w-[200px] border-zinc-700 bg-zinc-900/50 text-base text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                        <Link href="/tournaments">
                            <Trophy className="mr-2 size-5" />
                            Trouver un tournoi
                        </Link>
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="mt-16 text-sm text-zinc-600"
                >
                    Code d'erreur : MAP_NOT_FOUND_EXCEPTION
                </motion.div>
            </div>
        </div>
    )
}
