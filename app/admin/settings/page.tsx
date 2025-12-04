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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { decrypt, getSession } from '@/lib/auth'
import { getSiteSettings } from '@/lib/data/settings'

export default async function SettingsPage() {
    const session = await getSession()
    if (!session || !session.user) redirect('/login')

    if (session.user.role !== 'SUPERADMIN') {
        redirect('/admin')
    }

    const settings = await getSiteSettings()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                    Platform Settings
                </h1>
                <p className="text-zinc-400 mt-1">
                    Configure global settings and integrations.
                </p>
            </div>

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
        </div>
    )
}
