/**
 * File: app/not-found.tsx
 * Description: 404 Not Found page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const NotFoundPage = () => {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 px-4 text-zinc-50">
      <p className="select-none font-mono text-8xl font-bold text-zinc-800">
        404
      </p>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Page introuvable</h1>
        <p className="mt-2 text-sm text-zinc-400">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>
      <Button
        variant="ghost"
        className="text-zinc-400 hover:bg-white/5 hover:text-white"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 size-4" />
        Retour
      </Button>
    </div>
  )
}

export default NotFoundPage
