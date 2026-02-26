/**
 * File: components/features/auth/admin-guard.tsx
 * Description: Admin guard component to protect admin routes.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/config/routes'
import { getSession } from '@/lib/services/auth'
import { isAdmin } from '@/lib/utils/auth.helpers'

/** Server component guard: redirects non-admin users before rendering children. */
export default async function AdminGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session?.user) {
    redirect(ROUTES.LOGIN)
  }

  if (!isAdmin(session.user.role)) {
    redirect(ROUTES.UNAUTHORIZED)
  }

  return <>{children}</>
}
