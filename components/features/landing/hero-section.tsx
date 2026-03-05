/**
 * File: components/features/landing/hero-section.tsx
 * Description: Hero section of the landing page
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import type { Variants } from 'framer-motion'
import { motion } from 'framer-motion'
import { ChevronRight, Video } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DEFAULT_ASSETS } from '@/lib/config/constants'
import { ROUTES } from '@/lib/config/routes'
import { authClient } from '@/lib/core/auth-client'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

interface HeroSectionProps {
  twitchUrl?: string
}

export const HeroSection = ({ twitchUrl }: HeroSectionProps) => {
  const { data: session, isPending } = authClient.useSession()

  return (
    <section className="relative flex h-dvh flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div className="absolute inset-0 z-0 select-none">
        <Image
          alt="Belouga Tournament Background"
          src={DEFAULT_ASSETS.BG_IMAGE}
          fill
          priority
          className="object-cover opacity-50"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-b from-zinc-950/80 via-zinc-950/50 to-zinc-950" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl space-y-8"
      >
        <motion.div variants={itemVariants} className="flex justify-center">
          <span className="flex items-center gap-2.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400 backdrop-blur-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-blue-500"></span>
            </span>
            Saison 2026 en préparation
          </span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-6xl font-black tracking-tighter text-white drop-shadow-2xl sm:text-8xl lg:text-9xl"
        >
          Belouga{' '}
          <span className="animate-gradient-x bg-linear-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Tournament
          </span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mx-auto max-w-2xl text-lg font-medium leading-relaxed text-zinc-300 sm:text-xl"
        >
          L'expérience compétitive ultime fondée par{' '}
          {twitchUrl ? (
            <a
              href={twitchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-400 underline decoration-blue-400/30 underline-offset-2 transition-colors hover:text-blue-300 hover:decoration-blue-300/50"
            >
              Quentadoulive
            </a>
          ) : (
            <span className="font-semibold text-blue-400">Quentadoulive</span>
          )}
          .
          <br />
          Affrontez les meilleurs, suivez l'action en direct sur Twitch et
          forgez votre légende.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-6 pt-8"
        >
          <Button
            asChild
            size="lg"
            className="group h-14 bg-blue-600 px-8 text-lg font-bold shadow-[0_0_30px_-10px_rgba(37,99,235,0.5)] transition-all hover:scale-105 hover:bg-blue-500 hover:shadow-[0_0_40px_-10px_rgba(37,99,235,0.7)]"
          >
            <Link href={ROUTES.TOURNAMENTS}>
              Découvrir les tournois
              <ChevronRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>

          {isPending ? (
            <Skeleton className="h-14 w-57.5 rounded-md bg-white/5" />
          ) : !session?.user ? (
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 border-white/10 bg-white/5 px-8 text-lg font-medium text-white backdrop-blur-md transition-all hover:border-blue-500/50 hover:bg-white/10 hover:text-blue-400"
            >
              <Link href={ROUTES.LOGIN}>Rejoindre l'aventure</Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              size="lg"
              className="group h-14 border-white/10 bg-white/5 px-8 text-lg font-medium text-white backdrop-blur-md transition-all hover:border-purple-500/50 hover:bg-white/10 hover:text-purple-400"
            >
              <Link href={ROUTES.STREAM}>
                <Video className="mr-2 size-5 transition-colors group-hover:text-purple-400" />
                Suivre le stream
              </Link>
            </Button>
          )}
        </motion.div>
      </motion.div>
    </section>
  )
}
