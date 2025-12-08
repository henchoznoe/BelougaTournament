/**
 * File: app/unauthorized/page.tsx
 * Description: Page displayed to users with the USER role who are pending approval.
 * Author: Noé Henchoz
 * Date: 2025-12-08
 * License: MIT
 */

import { AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { APP_ROUTES } from '@/lib/config/routes'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-zinc-50">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950 to-zinc-950" />

      <Card className="relative z-10 w-full max-w-md border-white/10 bg-zinc-900/50 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
          </div>
          <CardTitle className="text-xl font-bold text-white">
            Accès Restreint
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Votre compte a été créé avec succès, mais vous n'avez pas les droits
            nécessaires pour accéder au tableau de bord.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-sm text-zinc-300">
          <p>
            L'accès à l'administration est réservé aux administrateurs
            approuvés.
          </p>
          <p>
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter un
            super-administrateur pour qu'il active votre compte.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            asChild
            variant="ghost"
            className="text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            <Link href={APP_ROUTES.HOME}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
