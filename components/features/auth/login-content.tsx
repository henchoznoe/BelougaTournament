/**
 * File: components/features/auth/login-content.tsx
 * Description: Client wrapper for the login page with animation and social login.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { LoginCard } from '@/components/features/auth/login-card'
import SocialLogin from '@/components/features/auth/social-login'
import { Button } from '@/components/ui/button'
import { DEFAULT_ASSETS } from '@/lib/config/constants'
import { ROUTES } from '@/lib/config/routes'

/** Client-side login content with background image, animation, and social login button. */
export const LoginContent = () => {
  return (
    <>
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <Image
          alt="Belouga Background"
          src={DEFAULT_ASSETS.BG_IMAGE}
          fill
          priority
          className="object-cover opacity-50 grayscale"
        />
        <div className="absolute inset-0 bg-zinc-950/80" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-zinc-950/50 to-zinc-950" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back Navigation */}
          <Button
            asChild
            variant="ghost"
            className="mb-8 text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            <Link href={ROUTES.HOME}>
              <ArrowLeft className="mr-2 size-4" />
              Retour à l&apos;accueil
            </Link>
          </Button>

          {/* Login Card with Social Login */}
          <LoginCard>
            <SocialLogin />
          </LoginCard>
        </motion.div>
      </div>
    </>
  )
}
