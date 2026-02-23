/**
 * File: app/(public)/login/page.tsx
 * Description: Login page for authentication via Discord.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginContent } from '@/components/features/auth/login-content'
import { ROUTES } from '@/lib/config/routes'
import { getSession } from '@/lib/services/auth.service'

export const metadata: Metadata = {
  title: 'Connexion',
}

/** If already authenticated, redirects to home. Otherwise renders the login form. */
const LoginPage = async () => {
  const session = await getSession()

  if (session?.user) {
    redirect(ROUTES.HOME)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 text-zinc-50">
      <LoginContent />
    </div>
  )
}

export default LoginPage
