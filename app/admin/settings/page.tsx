/**
 * File: app/admin/settings/page.tsx
 * Description: Admin settings page for global site configuration.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

import { Lock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getSession, UserRole } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { SettingsForm } from './settings-form'

async function getSettings() {
  const settings = await prisma.siteSettings.findFirst()
  if (!settings) {
    return await prisma.siteSettings.create({
      data: {},
    })
  }
  return settings
}

export default async function SettingsPage() {
  const session = await getSession()

  if (!session || !session.user || session.user.role !== UserRole.SUPERADMIN) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-in fade-in zoom-in duration-500">
        <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
          <Lock className="size-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-white">Accès Refusé</h1>
        <p className="text-zinc-400 max-w-md">
          Cette page est strictement réservée aux Super Administrateurs.
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

  const settings = await getSettings()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
          Paramètres
        </h1>
        <p className="text-zinc-400">
          Configuration globale du site et liens sociaux.
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  )
}
