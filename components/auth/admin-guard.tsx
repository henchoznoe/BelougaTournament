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

export default async function AdminGuard({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/')
  }

  const userRole = (session.user as any).role

  if (userRole !== Role.ADMIN && userRole !== Role.SUPERADMIN) {
    redirect('/')
  }

  return <>{children}</>
}

