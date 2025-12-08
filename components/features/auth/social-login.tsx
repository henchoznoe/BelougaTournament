/**
 * File: components/features/auth/social-login.tsx
 * Description: Social login component.
 * Author: Noé Henchoz
 * Date: 2025-12-08
 * License: MIT
 */

"use client"

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

export default function SocialLogin() {
    const handleLogin = async (provider: "discord") => {
        try {
            await authClient.signIn.social({
                provider: provider,
                callbackURL: "/admin"
            })
        } catch (error) {
            console.error(error)
            toast.error("Erreur lors de la connexion")
        }
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <Button onClick={() => handleLogin("discord")} className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white">
                Se connecter avec Discord
            </Button>
        </div>
    )
}
