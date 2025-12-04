/**
 * File: app/admin/layout.tsx
 * Description: Layout for the admin dashboard, including the sidebar navigation.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

import {
    ChevronUp,
    LayoutDashboard,
    LogOut,
    Menu,
    Settings,
    Trophy,
    User,
    Users,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
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

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            <div className="mb-8 flex items-center gap-2 font-bold text-xl text-white px-2">
                <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                    <Trophy className="size-5 text-white" />
                </div>
                <span className="bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                    Belouga Admin
                </span>
            </div>

            <nav className="flex flex-col gap-1 flex-1">
                <Button
                    asChild
                    className="justify-start text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                    variant="ghost"
                >
                    <Link href="/admin">
                        <LayoutDashboard className="mr-3 size-4" />
                        Dashboard
                    </Link>
                </Button>
                <Button
                    asChild
                    className="justify-start text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                    variant="ghost"
                >
                    <Link href="/admin/tournaments">
                        <Trophy className="mr-3 size-4" />
                        Tournaments
                    </Link>
                </Button>
                {session.user.role === 'SUPERADMIN' && (
                    <Button
                        asChild
                        className="justify-start text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                        variant="ghost"
                    >
                        <Link href="/admin/users">
                            <Users className="mr-3 size-4" />
                            Admins
                        </Link>
                    </Button>
                )}
                {session.user.role === 'SUPERADMIN' && (
                    <Button
                        asChild
                        className="justify-start text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                        variant="ghost"
                    >
                        <Link href="/admin/settings">
                            <Settings className="mr-3 size-4" />
                            Settings
                        </Link>
                    </Button>
                )}
            </nav>

            <div className="mt-auto pt-4 border-t border-zinc-800">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="w-full justify-between px-2 hover:bg-zinc-800/50 h-auto py-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                    <User className="size-4 text-zinc-400" />
                                </div>
                                <div className="flex flex-col items-start text-xs">
                                    <span className="font-medium text-white">
                                        Admin User
                                    </span>
                                    <span className="text-zinc-500 max-w-[100px] truncate">
                                        {session.user.email}
                                    </span>
                                </div>
                            </div>
                            <ChevronUp className="size-4 text-zinc-500" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        side="top"
                        className="w-56 bg-zinc-950 border-zinc-800 text-zinc-200"
                    >
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem
                            className="focus:bg-zinc-900 focus:text-white cursor-pointer"
                            asChild
                        >
                            <form action={logout} className="w-full">
                                <button
                                    type="submit"
                                    className="flex w-full items-center text-red-400"
                                >
                                    <LogOut className="mr-2 size-4" />
                                    Logout
                                </button>
                            </form>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )

    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-zinc-950">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col border-r border-zinc-800 bg-zinc-950/50 p-6 backdrop-blur-xl fixed inset-y-0 left-0 z-50">
                <SidebarContent />
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
                <div className="flex items-center gap-2 font-bold text-lg text-white">
                    <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <Trophy className="size-5 text-white" />
                    </div>
                    <span>Belouga Admin</span>
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="size-6 text-zinc-400" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="w-64 bg-zinc-950 border-zinc-800 p-6"
                    >
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Main Content */}
            <main className="flex-1 md:pl-64">
                <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
