/**
 * File: app/(public)/cancel-registration/page.tsx
 * Description: Page for users to cancel their registration via email link.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { AlertTriangle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cancelRegistration } from '@/lib/actions/registration'
import prisma from '@/lib/core/prisma'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const ROUTES = {
  HOME: '/',
} as const

export const dynamic = 'force-dynamic'

const ErrorState = ({
  title,
  description,
}: {
  title: string
  description: string
}) => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-950">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 text-red-500">
            <XCircle className="size-6" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            asChild
            variant="outline"
            className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-white"
          >
            <Link href={ROUTES.HOME}>Retour à l'accueil</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

const CancelRegistrationPage = async (props: PageProps) => {
  const searchParams = await props.searchParams

  // Validate Inputs
  const id = typeof searchParams.id === 'string' ? searchParams.id : undefined
  const token =
    typeof searchParams.token === 'string' ? searchParams.token : undefined

  if (!id || !token) {
    return <ErrorState title="Demande invalide" description="" />
  }

  // Fetch & Validate Data
  const registration = await prisma.registration.findUnique({
    where: { id },
    include: { tournament: true },
  })

  // Check if registration exists AND if the token matches
  if (!registration || registration.cancellationToken !== token) {
    return <ErrorState title="Lien invalide" description="" />
  }

  // Server Action Wrapper
  const handleCancel = async () => {
    'use server'
    // We re-validate inside the action for security
    if (id && token) {
      await cancelRegistration(id, token)
      redirect(`${ROUTES.HOME}?cancelled=true`)
    }
  }

  // Render Confirmation UI
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-950 shadow-2xl">
        <CardHeader>
          <div className="mb-4 flex items-center gap-3 text-red-500">
            <div className="flex size-10 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="size-6" />
            </div>
            <CardTitle className="text-xl">Confirmer la suppression</CardTitle>
          </div>
          <CardDescription className="text-base text-zinc-400">
            Voulez-vous vraiment supprimer votre inscription au tournoi{' '}
            {registration.tournament.title} ?
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm font-medium text-red-400">
              Cette action est irréversible.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            asChild
            variant="outline"
            className="w-full border-zinc-700 hover:bg-zinc-800 hover:text-white"
          >
            <Link href={ROUTES.HOME}>Retour à l'accueil</Link>
          </Button>

          <form action={handleCancel} className="w-full">
            <Button
              type="submit"
              variant="destructive"
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Confirmer la suppression
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}

export default CancelRegistrationPage
