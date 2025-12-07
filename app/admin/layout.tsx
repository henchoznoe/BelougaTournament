/**
 * File: app/admin/layout.tsx
 * Description: Layout for the admin dashboard, including the sidebar navigation.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import Image from 'next/image'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/layout/sidebar/admin-sidebar'
import { logout } from '@/lib/actions/auth'
import { getSession } from '@/lib/auth'
import { Role } from '@/prisma/generated/prisma/enums'

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const ASSETS = {
  BACKGROUND: '/assets/wall.png',
} as const

const ROUTES = {
  LOGIN: '/login',
} as const

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

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

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  // 1. Auth Check
  const session = await getSession()

  // We rely on getSession returning null if invalid/expired.
  // We also enforce Role checking here as a second layer of defense.
  const isAuthorized =
    session?.user &&
    (session.user.role === Role.ADMIN || session.user.role === Role.SUPERADMIN)

  if (!isAuthorized) {
    redirect(ROUTES.LOGIN)
  }

  // 2. Render Layout
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      <AdminBackground />

      {/* Sidebar Navigation */}
      <AdminSidebar userEmail={session.user.email} logoutAction={logout} />

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto h-screen z-10">
        <div className="p-8 md:p-12 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
