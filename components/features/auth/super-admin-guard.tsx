/**
 * File: components/features/auth/super-admin-guard.tsx
 * Description: Server component guard that restricts access to SUPERADMIN users only.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/config/routes'
import { getSession } from '@/lib/services/auth'
import { isSuperAdmin } from '@/lib/utils/auth.helpers'

/** Server component guard: redirects non-superadmin users before rendering children. */
const SuperAdminGuard = async ({ children }: { children: React.ReactNode }) => {
  const session = await getSession()

  if (!session?.user) {
    redirect(ROUTES.LOGIN)
  }

  if (!isSuperAdmin(session.user.role)) {
    redirect(ROUTES.UNAUTHORIZED)
  }

  return <>{children}</>
}

export default SuperAdminGuard
