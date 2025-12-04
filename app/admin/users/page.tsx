/**
 * File: app/admin/users/page.tsx
 * Description: Page for managing admin users.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

import { redirect } from 'next/navigation'
import { UsersManager } from '@/app/admin/users/users-manager'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function AdminUsersPage() {
    const session = await getSession()
    if (!session || !session.user) redirect('/login')

    if (session.user.role !== 'SUPERADMIN') {
        redirect('/admin')
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
        },
    })

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                    Administrators
                </h1>
                <p className="text-zinc-400 mt-1">
                    Manage system administrators and their access levels.
                </p>
            </div>

            <UsersManager
                users={users}
                currentUserId={session.user.id}
                currentUserRole={session.user.role}
            />
        </div>
    )
}
