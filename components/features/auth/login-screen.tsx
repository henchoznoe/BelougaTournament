/**
 * File: components/features/auth/login-screen.tsx
 * Description: Split screen design for the login page, featuring a cinematic background and a sleek form.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Gamepad2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import SocialLogin from '@/components/features/auth/social-login'
import { Button } from '@/components/ui/button'
import { DEFAULT_ASSETS } from '@/lib/config/constants'
import { ROUTES } from '@/lib/config/routes'

export const LoginScreen = () => {
  return (
    <div className="flex h-dvh overflow-hidden w-full bg-zinc-950">
      {/* Left side - Visual (Hidden on mobile) */}
      <div className="relative hidden w-1/2 lg:block">
        <Image
          alt="Belouga Background"
          src={DEFAULT_ASSETS.BG_IMAGE}
          fill
          priority
          className="object-cover opacity-60 grayscale"
        />
        <div className="absolute inset-0 bg-linear-to-r from-zinc-950/10 via-zinc-950/50 to-zinc-950" />
        <div className="absolute inset-0 flex flex-col items-start justify-end p-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h2 className="font-paladins text-5xl tracking-wider text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              BELOUGA
              <br />
              TOURNAMENT
            </h2>
            <p className="mt-6 max-w-md text-lg text-zinc-400">
              Rejoignez l'élite. Participez aux meilleurs tournois de la scène
              francophone, remportez des récompenses exclusives et inscrivez
              votre nom dans la légende.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2 relative">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button
              asChild
              variant="ghost"
              className="mb-12 text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <Link href={ROUTES.HOME}>
                <ArrowLeft className="mr-2 size-4" />
                Retour à l'accueil
              </Link>
            </Button>

            <div className="mb-8">
              <div className="mb-6 inline-flex size-14 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                <Gamepad2 className="size-7 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Bienvenue
              </h1>
              <p className="mt-2 text-zinc-400">
                Connectez-vous pour accéder à votre espace joueur.
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/2 p-6 shadow-2xl backdrop-blur-xl">
              <SocialLogin />
            </div>

            <p className="mt-8 text-center text-xs text-zinc-600">
              En vous connectant, vous acceptez nos{' '}
              <Link href={ROUTES.TERMS} className="text-blue-400">
                conditions d'utilisation
              </Link>{' '}
              et notre{' '}
              <Link href={ROUTES.PRIVACY} className="text-blue-400">
                politique de confidentialité
              </Link>
              .
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
