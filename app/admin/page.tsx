/**
 * File: app/admin/page.tsx
 * Description: Admin dashboard placeholder page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Shield } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
}

const AdminDashboardPage = () => {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
      <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
        <Shield className="size-8 text-green-400" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Cette page est en cours de construction.
        </p>
      </div>
    </div>
  )
}

export default AdminDashboardPage
