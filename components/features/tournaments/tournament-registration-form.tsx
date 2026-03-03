/**
 * File: components/features/tournaments/tournament-registration-form.tsx
 * Description: Client-side registration form for public tournament pages (solo format).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { CheckCircle, Loader2, LogIn, Send } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerForTournament } from '@/lib/actions/tournaments'
import { ROUTES } from '@/lib/config/routes'
import { authClient } from '@/lib/core/auth-client'
import type { TournamentFieldItem } from '@/lib/types/tournament'

interface TournamentRegistrationFormProps {
  tournamentId: string
  fields: TournamentFieldItem[]
  autoApprove: boolean
}

/** Maps dynamic field values from form (all strings) to proper types for the action. */
const buildFieldValues = (
  formData: Record<string, string>,
  fields: TournamentFieldItem[],
): Record<string, string | number> => {
  const result: Record<string, string | number> = {}
  for (const field of fields) {
    const raw = formData[field.label] ?? ''
    if (field.type === 'NUMBER' && raw !== '') {
      result[field.label] = Number(raw)
    } else {
      result[field.label] = raw
    }
  }
  return result
}

export const TournamentRegistrationForm = ({
  tournamentId,
  fields,
  autoApprove,
}: TournamentRegistrationFormProps) => {
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Record<string, string>>({
    defaultValues: Object.fromEntries(fields.map(f => [f.label, ''])),
  })

  const onSubmit = (data: Record<string, string>) => {
    startTransition(async () => {
      const fieldValues = buildFieldValues(data, fields)
      const result = await registerForTournament({ tournamentId, fieldValues })

      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  // Loading state while session is being fetched
  if (isSessionPending) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="size-5 animate-spin text-zinc-500" />
      </div>
    )
  }

  // Not authenticated: show login CTA
  if (!session?.user) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <p className="text-sm text-zinc-400">
          Connectez-vous pour vous inscrire à ce tournoi.
        </p>
        <Button asChild className="gap-2">
          <Link href={ROUTES.LOGIN}>
            <LogIn className="size-4" />
            Se connecter
          </Link>
        </Button>
      </div>
    )
  }

  // Registration form
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {fields.length > 0 ? (
        <div className="space-y-4">
          {fields.map(field => (
            <div key={field.id} className="space-y-1.5">
              <Label
                htmlFor={`field-${field.id}`}
                className="text-xs text-zinc-400"
              >
                {field.label}
                {field.required && (
                  <span className="ml-0.5 text-red-400">*</span>
                )}
              </Label>
              <Input
                id={`field-${field.id}`}
                type={field.type === 'NUMBER' ? 'number' : 'text'}
                disabled={isPending}
                className="h-9 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20"
                {...register(field.label, {
                  required: field.required
                    ? `Le champ « ${field.label} » est requis.`
                    : false,
                  ...(field.type === 'NUMBER' ? { valueAsNumber: false } : {}),
                })}
              />
              {errors[field.label] && (
                <p className="text-xs text-red-400">
                  {errors[field.label]?.message}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-zinc-500">
          Aucun champ supplémentaire n'est requis.
        </p>
      )}

      {autoApprove ? (
        <p className="text-center text-xs text-zinc-500">
          <CheckCircle className="mr-1 inline size-3 text-emerald-500" />
          Votre inscription sera automatiquement acceptée.
        </p>
      ) : (
        <p className="text-center text-xs text-zinc-500">
          Votre inscription sera soumise à validation par un administrateur.
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full gap-2">
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        S'inscrire
      </Button>
    </form>
  )
}
