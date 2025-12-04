/**
 * File: app/admin/layout.tsx
 * Description: Layout for the admin dashboard, including the sidebar navigation.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
    Home,
    LayoutDashboard,
    LogOut,
    Settings,
    Trophy,
    Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        <div className="flex min-h-screen flex-col md:flex-row bg-zinc-950 text-zinc-100 font-sans">
            <aside className="w-full border-r border-zinc-800 bg-zinc-950/80 backdrop-blur-xl p-6 md:w-72 flex flex-col sticky top-0 h-screen z-50">
                <div className="mb-10 flex items-center gap-2">
                    <span className="text-2xl font-black tracking-tighter text-white">
                        BELOUGA
                        <span className="text-blue-500">.</span>
                    </span>
                </div>

                <nav className="flex flex-col gap-2 flex-1">
                    <p className="px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                        Menu
                    </p>
                    <Button asChild className="justify-start" variant="ghost">
                        <Link href="/admin">
                            <LayoutDashboard className="mr-3 h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                    <Button asChild className="justify-start" variant="ghost">
                        <Link href="/admin/tournaments">
                            <Trophy className="mr-3 h-4 w-4" />
                            Tournaments
                        </Link>
                    </Button>
                    <Button asChild className="justify-start" variant="ghost">
                        <Link href="/admin/users">
                            <Users className="mr-3 h-4 w-4" />
                            Users
                        </Link>
                    </Button>
                    <Button asChild className="justify-start" variant="ghost">
                        <Link href="/admin/settings">
                            <Settings className="mr-3 h-4 w-4" />
                            Settings
                        </Link>
                    </Button>
                </nav>

                <div className="mt-auto pt-6 border-t border-zinc-800">
                    <div className="mb-4 px-2">
                        <p className="text-xs font-medium text-zinc-500">
                            Logged in as
                        </p>
                        <p
                            className="text-sm font-medium text-white truncate"
                            title={session.user.email}
                        >
                            {session.user.email}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="w-full justify-center"
                        >
                            <Link href="/">
                                <Home className="mr-2 h-3 w-3" />
                                Site
                            </Link>
                        </Button>
                        <form action={logout}>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="w-full justify-center"
                            >
                                <LogOut className="mr-2 h-3 w-3" />
                                Logout
                            </Button>
                        </form>
                    </div>
                </div>
            </aside>

            <main className="flex-1 relative overflow-y-auto h-screen">
                {/* Background Gradient */}
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-blue-900/10 via-zinc-950/50 to-zinc-950 pointer-events-none" />

                <div className="relative z-10 p-8 md:p-12 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
