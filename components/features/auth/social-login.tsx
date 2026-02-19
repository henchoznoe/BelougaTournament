/**
 * File: components/features/auth/social-login.tsx
 * Description: Social login component.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

"use client"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/core/auth-client"
import { toast } from "sonner"

export default function SocialLogin() {
    const handleLogin = async (provider: "discord") => {
        try {
            await authClient.signIn.social({
                provider: provider,
                callbackURL: "/admin"
            })
        } catch (error) {
            console.error(error)
            toast.error("Erreur de connexion")
        }
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <Button onClick={() => handleLogin("discord")} className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white">
                Connexion avec Discord
            </Button>
        </div>
    )
}
