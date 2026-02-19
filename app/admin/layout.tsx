/**
 * File: app/admin/layout.tsx
 * Description: Layout for the admin dashboard, including the sidebar navigation.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import Image from 'next/image'
import { AdminSidebar } from '@/components/layout/sidebar/admin-sidebar'
import { logoutHandler } from '@/lib/actions/auth'
import AdminGuard from '@/components/auth/admin-guard'

interface LayoutProps {
  children: React.ReactNode
}

const ASSETS = {
  BACKGROUND: '/assets/wall.png',
} as const

const AdminBackground = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none select-none">
      <Image
        src={ASSETS.BACKGROUND}
        alt="Admin Panel Background"
        fill
        className="object-cover opacity-20"
        priority
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-[2px]" />
      {/* Subtle blue gradient accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
    </div>
  )
}

const AdminLayout = async (props: Readonly<LayoutProps>) => {
  return (
    <AdminGuard>
      <div className="flex min-h-screen flex-col md:flex-row bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
        <AdminBackground />

        <AdminSidebar userEmail={'TODO'} logoutAction={logoutHandler} />

        <main className="flex-1 relative overflow-y-auto h-screen z-10">
          <div className="p-8 md:p-12 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {props.children}
          </div>
        </main>
      </div>
    </AdminGuard>
  )
}

export default AdminLayout
