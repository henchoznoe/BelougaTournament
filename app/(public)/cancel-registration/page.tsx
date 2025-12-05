/**
 * File: app/(public)/cancel-registration/page.tsx
 * Description: Page for users to cancel their registration via email link.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

import { AlertTriangle } from 'lucide-react'
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
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function CancelRegistrationPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const id = typeof searchParams.id === 'string' ? searchParams.id : undefined
  const token =
    typeof searchParams.token === 'string' ? searchParams.token : undefined

  if (!id || !token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-950">
          <CardHeader>
            <CardTitle className="text-red-500">Invalid Request</CardTitle>
            <CardDescription>
              Missing registration ID or cancellation token.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/">Return Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const registration = await prisma.registration.findUnique({
    where: { id },
    include: { tournament: true },
  })

  if (!registration || registration.cancellationToken !== token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-950">
          <CardHeader>
            <CardTitle className="text-red-500">Invalid Link</CardTitle>
            <CardDescription>
              This cancellation link is invalid or expired.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/">Return Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  async function handleCancel() {
    'use server'
    if (id && token) {
      await cancelRegistration(id, token)
      redirect(`/?cancelled=true`)
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-950">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <AlertTriangle className="h-6 w-6" />
            <CardTitle>Cancel Registration</CardTitle>
          </div>
          <CardDescription>
            Are you sure you want to cancel your registration for{' '}
            <span className="font-bold text-white">
              {registration.tournament.title}
            </span>
            ?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400">
            This action cannot be undone. If you cancel, you will lose your spot
            in the tournament (or waitlist).
          </p>
        </CardContent>
        <CardFooter className="flex justify-between gap-4">
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Keep Registration</Link>
          </Button>
          <form action={handleCancel} className="w-full">
            <Button type="submit" variant="destructive" className="w-full">
              Yes, Cancel
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
