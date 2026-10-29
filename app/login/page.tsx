/**
 * File: app/login/page.tsx
 * Description: Login page for authentication via Discord.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { LoginScreen } from '@/components/public/auth/login-screen'
import { getSession } from '@/lib/services/auth'
import { getSafeAuthRedirect } from '@/lib/utils/auth-redirect'

export const metadata: Metadata = {
  title: 'Connexion',
}

/** If already authenticated, redirects to the origin page (or home). Otherwise renders the login form. */
const LoginContent = async ({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) => {
  const [{ from }, session] = await Promise.all([searchParams, getSession()])
  const redirectTo = getSafeAuthRedirect(from)

  if (session?.user) {
    redirect(redirectTo)
  }

  return <LoginScreen redirectTo={redirectTo} />
}

const LoginPage = ({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) => {
  return (
    <Suspense>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  )
}

export default LoginPage
