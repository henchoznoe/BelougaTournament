/**
 * File: app/login/page.tsx
 * Description: Login page for admin authentication.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/actions/auth'

const initialState = {
    message: '',
}

export default function LoginPage() {
    const [state, formAction] = useActionState(login, initialState)

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
            <Card className="w-full max-w-sm border-zinc-800 bg-zinc-900">
                <CardHeader>
                    <CardTitle className="text-2xl text-white">Login</CardTitle>
                    <CardDescription>
                        Enter your credentials to access the admin panel.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="admin@example.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                            />
                        </div>
                        {state?.message && (
                            <p className="text-sm text-red-500">
                                {state.message}
                            </p>
                        )}
                        <Button type="submit" className="w-full">
                            Login
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
