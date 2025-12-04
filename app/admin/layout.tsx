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
        <div className="flex min-h-screen flex-col md:flex-row">
            <aside className="w-full border-r bg-zinc-950 p-6 md:w-64 flex flex-col">
                <div className="mb-8 flex items-center gap-2 font-bold text-xl text-white">
                    <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <Trophy className="size-5 text-white" />
                    </div>
                    <span>Belouga Admin</span>
                </div>

                <nav className="flex flex-col gap-2 flex-1">
                    <Button
                        asChild
                        className="justify-start text-zinc-400 hover:text-white hover:bg-zinc-900"
                        variant="ghost"
                    >
                        <Link href="/admin">
                            <LayoutDashboard className="mr-2 size-4" />
                            Dashboard
                        </Link>
                    </Button>
                    <Button
                        asChild
                        className="justify-start text-zinc-400 hover:text-white hover:bg-zinc-900"
                        variant="ghost"
                    >
                        <Link href="/admin/tournaments">
                            <Trophy className="mr-2 size-4" />
                            Tournaments
                        </Link>
                    </Button>
                    <Button
                        asChild
                        className="justify-start text-zinc-400 hover:text-white hover:bg-zinc-900"
                        variant="ghost"
                    >
                        <Link href="/admin/users">
                            <Users className="mr-2 size-4" />
                            Users
                        </Link>
                    </Button>
                    <Button
                        asChild
                        className="justify-start text-zinc-400 hover:text-white hover:bg-zinc-900"
                        variant="ghost"
                    >
                        <Link href="/admin/settings">
                            <Settings className="mr-2 size-4" />
                            Settings
                        </Link>
                    </Button>
                </nav>

                <div className="mt-auto pt-4 border-t border-zinc-800">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="w-full justify-between px-2 hover:bg-zinc-900"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="size-8 rounded-full bg-zinc-800 flex items-center justify-center">
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
            </aside>
            <main className="flex-1 bg-zinc-900 p-8 overflow-y-auto h-screen">
                {children}
            </main>
        </div>
    )
}
