/**
 * File: app/(public)/cancel-registration/page.tsx
 * Description: Page for users to cancel their registration via email link.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

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
import prisma from '@/lib/db/prisma'

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const ROUTES = {
  HOME: '/',
} as const

const CONTENT = {
  ERR_INVALID_REQUEST: {
    TITLE: 'Requête Invalide',
    DESC: "L'identifiant d'inscription ou le jeton de sécurité est manquant.",
  },
  ERR_INVALID_LINK: {
    TITLE: 'Lien Expiré ou Invalide',
    DESC: "Ce lien d'annulation n'est plus valide. Votre inscription a peut-être déjà été annulée.",
  },
  BTN_HOME: "Retour à l'accueil",
  CONFIRM_TITLE: "Annuler l'inscription",
  CONFIRM_DESC: (tournamentName: string) =>
    `Êtes-vous sûr de vouloir annuler votre inscription pour le tournoi "${tournamentName}" ?`,
  WARNING_TEXT:
    "Cette action est irréversible. En annulant, vous perdrez définitivement votre place dans le tournoi (ou la liste d'attente).",
  BTN_KEEP: 'Non, garder ma place',
  BTN_CONFIRM: "Oui, annuler l'inscription",
} as const

export const dynamic = 'force-dynamic'

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

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
            <Link href={ROUTES.HOME}>{CONTENT.BTN_HOME}</Link>
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
    return (
      <ErrorState
        title={CONTENT.ERR_INVALID_REQUEST.TITLE}
        description={CONTENT.ERR_INVALID_REQUEST.DESC}
      />
    )
  }

  // Fetch & Validate Data
  const registration = await prisma.registration.findUnique({
    where: { id },
    include: { tournament: true },
  })

  // Check if registration exists AND if the token matches
  if (!registration || registration.cancellationToken !== token) {
    return (
      <ErrorState
        title={CONTENT.ERR_INVALID_LINK.TITLE}
        description={CONTENT.ERR_INVALID_LINK.DESC}
      />
    )
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
            <CardTitle className="text-xl">{CONTENT.CONFIRM_TITLE}</CardTitle>
          </div>
          <CardDescription className="text-base text-zinc-400">
            {CONTENT.CONFIRM_DESC(registration.tournament.title)}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm font-medium text-red-400">
              {CONTENT.WARNING_TEXT}
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            asChild
            variant="outline"
            className="w-full border-zinc-700 hover:bg-zinc-800 hover:text-white"
          >
            <Link href={ROUTES.HOME}>{CONTENT.BTN_KEEP}</Link>
          </Button>

          <form action={handleCancel} className="w-full">
            <Button
              type="submit"
              variant="destructive"
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {CONTENT.BTN_CONFIRM}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}

export default CancelRegistrationPage
