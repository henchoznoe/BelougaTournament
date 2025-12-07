/**
 * File: app/login/page.tsx
 * Description: Login page for admin authentication with premium gaming aesthetic.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

'use client'

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { LoginCard } from '@/components/features/auth/login-card'
import { LoginForm } from '@/components/features/auth/login-form'
import { Button } from '@/components/ui/button'
import { APP_ROUTES } from '@/lib/config/routes'
import { APP_METADATA } from '@/lib/constants'

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const BACK_LINK_TEXT = "Retour à l'accueil"

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const LoginPage = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 text-zinc-50">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <Image
          alt="Belouga Background"
          src={APP_METADATA.DEFAULT_BG_IMG}
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
            <Link href={APP_ROUTES.HOME}>
              <ArrowLeft className="mr-2 size-4" />
              {BACK_LINK_TEXT}
            </Link>
          </Button>

          {/* Login Card Component */}
          <LoginCard>
            <LoginForm />
          </LoginCard>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage
