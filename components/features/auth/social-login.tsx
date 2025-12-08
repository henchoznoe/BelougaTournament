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
import { fr } from "@/lib/i18n/dictionaries/fr"

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
            toast.error(fr.pages.login.social.error)
        }
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <Button onClick={() => handleLogin("discord")} className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white">
                {fr.pages.login.social.discord}
            </Button>
        </div>
    )
}
