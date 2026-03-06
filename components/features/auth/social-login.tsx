/**
 * File: components/features/auth/social-login.tsx
 * Description: Social login component.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/core/auth-client'

type SocialProvider = 'discord'

interface SocialLoginProps {
  redirectTo: string
}

const SocialLogin = ({ redirectTo }: SocialLoginProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleLogin = async (provider: SocialProvider) => {
    try {
      setIsLoading(true)
      const { error } = await authClient.signIn.social({
        provider: provider,
        callbackURL: redirectTo,
      })

      if (error) {
        console.error('Social login error:', error)
        toast.error(error.message || 'Erreur lors de la connexion')
      }
    } catch (error) {
      console.error('Unexpected social login error:', error)
      toast.error('Une erreur inattendue est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <Button
        onClick={() => handleLogin('discord')}
        disabled={isLoading}
        className="w-full bg-[#5865F2] text-white hover:bg-[#4752C4]"
      >
        {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        {isLoading ? 'Connexion...' : 'Connexion avec Discord'}
      </Button>
    </div>
  )
}

export default SocialLogin
