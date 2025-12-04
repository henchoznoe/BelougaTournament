/**
 * File: app/login/page.tsx
 * Description: Login page for admin authentication with premium gaming aesthetic.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/actions/auth'
import { ArrowLeft, Gamepad2, Lock, Mail } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

const initialState = {
    message: '',
    email: '',
}

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, initialState)

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 text-zinc-50">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0">
                <Image
                    alt="Background"
                    className="object-cover opacity-50 grayscale"
                    fill
                    priority
                    src="/assets/wall.png"
                />
                <div className="absolute inset-0 bg-zinc-950/80" />
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-zinc-950/50 to-zinc-950" />
            </div>

            <div className="relative z-10 w-full max-w-md px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Back Button */}
                    <Button
                        asChild
                        variant="ghost"
                        className="mb-8 text-zinc-400 hover:bg-white/5 hover:text-white"
                    >
                        <Link href="/">
                            <ArrowLeft className="mr-2 size-4" />
                            Retour à l'accueil
                        </Link>
                    </Button>

                    {/* Login Card */}
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
                        <div className="p-8">
                            {/* Header */}
                            <div className="mb-8 flex flex-col items-center text-center">
                                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
                                    <Gamepad2 className="size-8 text-blue-400" />
                                </div>
                                <h1 className="font-paladins text-3xl tracking-wider text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                    Admin Login
                                </h1>
                                <p className="mt-2 text-sm text-zinc-400">
                                    Accès réservé aux administrateurs
                                </p>
                            </div>

                            {/* Form */}
                            <form action={formAction} className="space-y-6">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="email"
                                        className="text-xs font-medium uppercase tracking-wider text-zinc-500"
                                    >
                                        Email
                                    </Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-blue-400" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="admin@belouga.com"
                                            required
                                            defaultValue={state.email}
                                            className="h-11 border-white/10 bg-zinc-950/50 pl-10 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:bg-zinc-950/80 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="password"
                                        className="text-xs font-medium uppercase tracking-wider text-zinc-500"
                                    >
                                        Mot de passe
                                    </Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-blue-400" />
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            className="h-11 border-white/10 bg-zinc-950/50 pl-10 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:bg-zinc-950/80 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>

                                {state?.message && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20 text-center"
                                    >
                                        {state.message}
                                    </motion.div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full h-11 bg-blue-600 text-base font-semibold hover:bg-blue-500 hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPending
                                        ? 'Connexion...'
                                        : 'Se connecter'}
                                </Button>
                            </form>
                        </div>

                        {/* Footer Decoration */}
                        <div className="h-1 w-full bg-linear-to-r from-transparent via-blue-500/50 to-transparent" />
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
