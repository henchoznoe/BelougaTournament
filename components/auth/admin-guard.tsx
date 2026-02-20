/**
 * File: components/auth/admin-guard.tsx
 * Description: Admin guard component to protect admin routes
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import auth from '@/lib/core/auth'
import { Role } from '@/prisma/generated/prisma/enums'

type AuthSession = {
  session: { id: string; userId: string; expiresAt: Date; token: string }
  user: { id: string; email: string; name: string; role: Role; image?: string | null; discordId?: string | null }
}

/** Server component guard: redirects non-admin users before rendering children. */
export default async function AdminGuard({ children }: { children: React.ReactNode }) {
  const raw = await auth.api.getSession({ headers: await headers() })
  const session = raw as AuthSession | null

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPERADMIN) {
    redirect('/unauthorized')
  }

  return <>{children}</>
}



