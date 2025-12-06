/**
 * File: app/login/page.tsx
 * Description: Login page for admin authentication with premium gaming aesthetic.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Gamepad2, Lock, Mail } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/actions/auth'

// Types
type LoginState = {
  message?: string
  email?: string
  errors?: Record<string, string[]>
}

// Constants
const ASSETS = {
  BACKGROUND: '/assets/wall.png',
} as const

const CONTENT = {
  TITLE: 'Admin Login',
  SUBTITLE: 'Accès réservé aux administrateurs',
  BACK_LINK: "Retour à l'accueil",
  LABEL_EMAIL: 'Email',
  PLACEHOLDER_EMAIL: 'admin@belouga.com',
  LABEL_PASSWORD: 'Mot de passe',
  PLACEHOLDER_PASSWORD: '••••••••',
  BTN_LOGIN: 'Se connecter',
  BTN_PENDING: 'Connexion...',
} as const

const INITIAL_STATE: LoginState = {
  message: '',
  email: '',
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, INITIAL_STATE)

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 text-zinc-50">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <Image
          alt="Belouga Background"
          src={ASSETS.BACKGROUND}
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
            <Link href="/">
              <ArrowLeft className="mr-2 size-4" />
              {CONTENT.BACK_LINK}
            </Link>
          </Button>

          {/* Login Card */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-2xl backdrop-blur-xl">
            <div className="p-8">
              {/* Card Header */}
              <div className="mb-8 flex flex-col items-center text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
                  <Gamepad2 className="size-8 text-blue-400" />
                </div>
                <h1 className="font-paladins text-3xl tracking-wider text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                  {CONTENT.TITLE}
                </h1>
                <p className="mt-2 text-sm text-zinc-400">{CONTENT.SUBTITLE}</p>
              </div>

              {/* Login Form */}
              <form action={formAction} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-medium uppercase tracking-wider text-zinc-500"
                  >
                    {CONTENT.LABEL_EMAIL}
                  </Label>
                  <div className="group relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-blue-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={CONTENT.PLACEHOLDER_EMAIL}
                      required
                      defaultValue={state.email}
                      className="h-11 border-white/10 bg-zinc-950/50 pl-10 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:bg-zinc-950/80 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-xs font-medium uppercase tracking-wider text-zinc-500"
                  >
                    {CONTENT.LABEL_PASSWORD}
                  </Label>
                  <div className="group relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-blue-400" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder={CONTENT.PLACEHOLDER_PASSWORD}
                      className="h-11 border-white/10 bg-zinc-950/50 pl-10 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:bg-zinc-950/80 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Error Feedback */}
                {state?.message && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400"
                  >
                    {state.message}
                  </motion.div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-11 w-full bg-blue-600 text-base font-semibold transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? CONTENT.BTN_PENDING : CONTENT.BTN_LOGIN}
                </Button>
              </form>
            </div>

            {/* Decorative Footer Line */}
            <div className="h-1 w-full bg-linear-to-r from-transparent via-blue-500/50 to-transparent" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
