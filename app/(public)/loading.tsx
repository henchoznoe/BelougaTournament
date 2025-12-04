/**
 * File: app/(public)/loading.tsx
 * Description: Loading state for public pages.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function PublicLoading() {
    return (
        <div className="flex min-h-[80vh] w-full flex-col items-center justify-center gap-6">
            <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/20 blur-xl" />
                <Image
                    src="/assets/logo-blue.png"
                    alt="Belouga Tournament"
                    width={80}
                    height={80}
                    className="relative z-10 animate-bounce-slow"
                />
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm font-medium tracking-wider uppercase">
                    Chargement...
                </span>
            </div>
        </div>
    )
}
