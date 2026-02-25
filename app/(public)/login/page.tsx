/**
 * File: app/(public)/login/page.tsx
 * Description: Login page for authentication via Discord.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginScreen } from '@/components/features/auth/login-screen'
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

  return <LoginScreen />
}

export default LoginPage
