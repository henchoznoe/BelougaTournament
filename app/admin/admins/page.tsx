/**
 * File: app/admin/admins/page.tsx
 * Description: Page for managing administrators.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

import { Lock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import prisma from '@/lib/prisma'
import { AdminsManager } from '@/components/admin/admins-manager'
import { getSession, UserRole } from '@/lib/auth'

export default async function AdminsPage() {
    const session = await getSession()

    if (
        !session ||
        !session.user ||
        session.user.role !== UserRole.SUPERADMIN
    ) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <Lock className="size-10 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold text-white">Accès Refusé</h1>
                <p className="text-zinc-400 max-w-md">
                    Cette page est strictement réservée aux Super
                    Administrateurs.
                </p>
                <Button
                    asChild
                    variant="outline"
                    className="border-white/10 hover:bg-white/5 text-white"
                >
                    <Link href="/admin">Retour au tableau de bord</Link>
                </Button>
            </div>
        )
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
                        Administrateurs
                    </h1>
                    <p className="text-zinc-400">
                        Gestion des comptes et des permissions.
                    </p>
                </div>
            </div>

            <AdminsManager
                users={users}
                currentUserId={session.user.id}
                currentUserRole={session.user.role}
            />
        </div>
    )
}
