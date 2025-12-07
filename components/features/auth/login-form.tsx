/**
 * File: components/features/auth/login-form.tsx
 * Description: Login form component handling user input and authentication state.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

'use client'

import { motion } from 'framer-motion'
import { Lock, Mail } from 'lucide-react'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/actions/auth'
import type { ActionState } from '@/lib/types/actions'

const CONTENT = {
  LABEL_EMAIL: 'Email',
  PLACEHOLDER_EMAIL: 'admin@belouga.com',
  LABEL_PASSWORD: 'Mot de passe',
  PLACEHOLDER_PASSWORD: '••••••••',
  BTN_LOGIN: 'Se connecter',
  BTN_PENDING: 'Connexion...',
} as const

const INITIAL_STATE: ActionState<string> = {
  success: false,
  message: '',
  inputs: '',
}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, INITIAL_STATE)

  return (
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
            defaultValue={state.inputs}
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
  )
}
