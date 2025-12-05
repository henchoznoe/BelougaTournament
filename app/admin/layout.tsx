/**
 * File: app/admin/layout.tsx
 * Description: Layout for the admin dashboard, including the sidebar navigation.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

import Image from 'next/image'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { logout } from '@/lib/actions/auth'
import { getSession, UserRole } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (
    !session ||
    !session.user ||
    (session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.SUPERADMIN)
  ) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/assets/wall.png"
          alt="Background"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      </div>

      <AdminSidebar userEmail={session.user.email} logoutAction={logout} />

      <main className="flex-1 relative overflow-y-auto h-screen z-10">
        <div className="p-8 md:p-12 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>
    </div>
  )
}
