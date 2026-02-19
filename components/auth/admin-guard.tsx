/**
 * File: components/auth/admin-guard.tsx
 * Description: Admin guard component to protect admin routes
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { authClient } from '@/lib/core/auth-client'
import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Role } from '@/prisma/generated/prisma/enums'

export default function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (isPending) return

    if (!session) {
        // Redirect to login if not authenticated
        router.push('/')
        return
    }

    // Check for admin role
    // We access the role from the user object.
    // Typescript might complain if we don't cast or extend the type, checking broadly for now.
    const userRole = (session.user as any).role

    if (userRole === Role.ADMIN || userRole === Role.SUPERADMIN) {
      setIsAuthorized(true)
    } else {
      // Redirect to home if authorized but not admin
      router.push('/')
    }
  }, [session, isPending, router])

  if (isPending || !isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
