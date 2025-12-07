/**
 * File: components/features/auth/login-form.tsx
 * Description: Login form component handling user input and authentication state.
 * Author: No\u00e9 Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

'use client'

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { useActionState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/actions/auth'
import { UI_MESSAGES } from '@/lib/config/messages'
import type { ActionState } from '@/lib/types/actions'

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const INITIAL_STATE: ActionState<string> = {
  success: false,
  message: '',
  inputs: '',
}

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

export const LoginForm = () => {
  const [state, formAction, isPending] = useActionState(login, INITIAL_STATE)

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label
          htmlFor="email"
          className="text-xs font-medium uppercase tracking-wider text-zinc-500"
        >
          {UI_MESSAGES.LOGIN.LABEL_EMAIL}
        </Label>
        <div className="group relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-blue-400" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={UI_MESSAGES.LOGIN.PLACEHOLDER_EMAIL}
            required
            defaultValue={state.inputs}
            className="h-11 border-white/10 bg-zinc-950/50 pl-10 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:bg-zinc-950/80 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="password"
          className="text-xs font-medium uppercase tracking-wider text-zinc-500"
        >
          {UI_MESSAGES.LOGIN.LABEL_PASSWORD}
        </Label>
        <div className="group relative">
          <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-blue-400" />
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder={UI_MESSAGES.LOGIN.PLACEHOLDER_PASSWORD}
            className="h-11 border-white/10 bg-zinc-950/50 pl-10 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:bg-zinc-950/80 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {state?.message && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400"
        >
          {state.message}
        </motion.div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="h-11 w-full bg-blue-600 text-base font-semibold transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? UI_MESSAGES.LOGIN.BTN_PENDING : UI_MESSAGES.LOGIN.BTN_LOGIN}
      </Button>
    </form>
  )
}
