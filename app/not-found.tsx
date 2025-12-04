/**
 * File: app/not-found.tsx
 * Description: Custom 404 page with gaming aesthetic.
 * Performance: Zero-runtime CSS animations (Server Component).
 */

import { Button } from '@/components/ui/button'
import { Gamepad2, Home, Trophy } from 'lucide-react'
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
                {/* Icon Container with Zoom In */}
                <div className="mb-8 flex justify-center animate-in zoom-in-50 fade-in duration-700">
                    <div className="relative">
                        <div className="absolute inset-0 animate-ping rounded-full bg-red-500/20 duration-1000" />
                        <div className="relative rounded-full bg-zinc-900/50 p-6 ring-1 ring-white/10 backdrop-blur-xl">
                            <Gamepad2 className="size-16 text-red-500" />
                        </div>
                    </div>
                </div>

                {/* Title 404 - Slide Up */}
                <h1 className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white to-zinc-600 sm:text-9xl animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150 fill-mode-backwards">
                    404
                </h1>

                {/* Subtitle - Slide Up Staggered */}
                <h2 className="mt-4 text-2xl font-bold uppercase tracking-widest text-red-500 sm:text-3xl animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300 fill-mode-backwards">
                    Game Over
                </h2>

                {/* Description */}
                <p className="mx-auto mt-6 max-w-lg text-lg text-zinc-400 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-500 fill-mode-backwards">
                    Oups ! Il semblerait que vous ayez atteint les limites de la
                    carte. Cette zone n'est pas encore débloquée ou a été
                    supprimée.
                </p>

                {/* Buttons Action */}
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-700 fill-mode-backwards">
                    <Button
                        asChild
                        size="lg"
                        className="h-12 min-w-[200px] bg-blue-600 text-base font-semibold hover:bg-blue-500 hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] transition-all"
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
                        className="h-12 min-w-[200px] border-zinc-700 bg-zinc-900/50 text-base text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
                    >
                        <Link href="/tournaments">
                            <Trophy className="mr-2 size-5" />
                            Trouver un tournoi
                        </Link>
                    </Button>
                </div>

                {/* Footer Error Code */}
                <div className="mt-16 text-sm text-zinc-600 animate-in fade-in duration-1000 delay-1000 fill-mode-backwards">
                    Code d'erreur : MAP_NOT_FOUND_EXCEPTION
                </div>
            </div>
        </div>
    )
}
