/**
 * File: app/admin/users/page.tsx
 * Description: Page for managing admin users.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

import { Plus, Trash2, Users, Shield } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { registerAdmin } from '@/lib/actions/auth'
import { getSession, UserRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getUsers() {
    return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
    })
}

async function deleteUser(userId: string) {
    'use server'
    const session = await getSession()
    if (session?.user?.role !== UserRole.SUPERADMIN) {
        return
    }
    await prisma.user.delete({ where: { id: userId } })
    revalidatePath('/admin/users')
}

export default async function UsersPage() {
    const users = await getUsers()
    const session = await getSession()
    const isSuperAdmin = session?.user?.role === UserRole.SUPERADMIN

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
                        Users & Admins
                    </h1>
                    <p className="text-zinc-400">
                        Manage system access and user roles.
                    </p>
                </div>
                {isSuperAdmin && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                size="lg"
                                className="shadow-lg shadow-blue-500/20"
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                Add New Admin
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50 sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-white">
                                    Add New Admin
                                </DialogTitle>
                                <DialogDescription>
                                    Create a new administrator account. They
                                    will have full access to the dashboard.
                                </DialogDescription>
                            </DialogHeader>
                            <form
                                action={async (formData: FormData) => {
                                    'use server'
                                    await registerAdmin(formData)
                                    revalidatePath('/admin/users')
                                }}
                                className="space-y-4 mt-4"
                            >
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="email"
                                        className="text-zinc-400"
                                    >
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="password"
                                        className="text-zinc-400"
                                    >
                                        Password
                                    </Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                                    />
                                </div>
                                <DialogFooter className="mt-6">
                                    <Button
                                        type="submit"
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                                    >
                                        Create Admin
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 backdrop-blur-sm overflow-hidden shadow-xl">
                <Table>
                    <TableHeader>
                        <TableRow className="border-zinc-800">
                            <TableHead className="bg-zinc-900/50 text-zinc-400 font-medium uppercase tracking-wider text-xs py-4 pl-6">
                                Email
                            </TableHead>
                            <TableHead className="bg-zinc-900/50 text-zinc-400 font-medium uppercase tracking-wider text-xs py-4">
                                Role
                            </TableHead>
                            <TableHead className="bg-zinc-900/50 text-zinc-400 font-medium uppercase tracking-wider text-xs py-4">
                                Created At
                            </TableHead>
                            {isSuperAdmin && (
                                <TableHead className="bg-zinc-900/50 text-right text-zinc-400 font-medium uppercase tracking-wider text-xs py-4 pr-6">
                                    Actions
                                </TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(user => (
                            <TableRow
                                key={user.id}
                                className="border-zinc-800/50 hover:bg-white/5 transition-colors group"
                            >
                                <TableCell className="font-medium text-white py-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                            <Users className="size-4" />
                                        </div>
                                        {user.email}
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                            user.role === 'SUPERADMIN'
                                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}
                                    >
                                        {user.role === 'SUPERADMIN' && (
                                            <Shield className="w-3 h-3" />
                                        )}
                                        {user.role}
                                    </span>
                                </TableCell>
                                <TableCell className="text-zinc-300 py-4">
                                    {new Date(
                                        user.createdAt,
                                    ).toLocaleDateString()}
                                </TableCell>
                                {isSuperAdmin && (
                                    <TableCell className="text-right py-4 pr-6">
                                        {user.role !== UserRole.SUPERADMIN && (
                                            <form
                                                action={deleteUser.bind(
                                                    null,
                                                    user.id,
                                                )}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </form>
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
