/**
 * File: app/admin/settings/page.tsx
 * Description: Admin settings page.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/app/admin/settings/settings-form'
import { UsersManager } from '@/app/admin/settings/users-manager'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { decrypt } from '@/lib/auth'
import { getSiteSettings } from '@/lib/data/settings'
import { prisma } from '@/lib/prisma'

export default async function SettingsPage() {
    const cookieStore = await cookies()
    const session = cookieStore.get('session')?.value
    if (!session) redirect('/login')

    const payload = await decrypt(session)
    if (!payload?.user) redirect('/login')

    const [settings, users] = await Promise.all([
        getSiteSettings(),
        prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            },
        }),
    ])

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                        Manage global site settings like name, logo, and social
                        links.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SettingsForm initialSettings={settings} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Admin Management</CardTitle>
                    <CardDescription>
                        Manage administrators who have access to this dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <UsersManager
                        users={users}
                        currentUserId={payload.user.id}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
