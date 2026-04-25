/**
 * File: components/public/contact/contact-form.tsx
 * Description: Public contact form with Resend email submission.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Send } from 'lucide-react'
import Link from 'next/link'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { sendContactMessage } from '@/lib/actions/contact'
import { CONTACT_SUBJECTS, VALIDATION_LIMITS } from '@/lib/config/constants'
import { ROUTES } from '@/lib/config/routes'
import { type ContactInput, contactSchema } from '@/lib/validations/contact'

const INPUT_CLASS =
  'h-9 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20'

export const ContactForm = () => {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      subject: undefined,
      message: '',
    },
  })

  const selectedSubject = watch('subject')

  const onSubmit = (data: ContactInput) => {
    startTransition(async () => {
      const result = await sendContactMessage(data)

      if (result.success) {
        toast.success(result.message)
        reset()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-xl md:p-8">
        {/* Section Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
            <Send className="size-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Nous écrire</h2>
            <p className="text-sm text-zinc-500">
              Remplissez le formulaire et nous vous répondrons rapidement.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Row 1: Name + Email (2-col on desktop) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs text-zinc-400">
                Nom complet <span className="text-red-400">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="Jean Dupont"
                autoComplete="name"
                disabled={isPending}
                className={INPUT_CLASS}
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="text-xs text-red-400">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-zinc-400">
                Adresse e-mail <span className="text-red-400">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="jean@exemple.ch"
                autoComplete="email"
                disabled={isPending}
                className={INPUT_CLASS}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Row 2: Phone + Subject (2-col on desktop) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs text-zinc-400">
                Téléphone
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+41 79 123 45 67"
                autoComplete="tel"
                disabled={isPending}
                className={INPUT_CLASS}
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-xs text-red-400">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">
                Sujet <span className="text-red-400">*</span>
              </Label>
              <Select
                value={selectedSubject ?? ''}
                onValueChange={val =>
                  setValue('subject', val as ContactInput['subject'], {
                    shouldValidate: true,
                  })
                }
                disabled={isPending}
              >
                <SelectTrigger
                  className={`w-full ${INPUT_CLASS}`}
                  aria-label="Sélectionner un sujet"
                >
                  <SelectValue placeholder="Sélectionner un sujet" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_SUBJECTS.map(subject => (
                    <SelectItem key={subject.value} value={subject.value}>
                      {subject.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subject && (
                <p className="text-xs text-red-400">{errors.subject.message}</p>
              )}
            </div>
          </div>

          {/* Row 3: Message */}
          <div className="space-y-1.5">
            <Label htmlFor="message" className="text-xs text-zinc-400">
              Message <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Décrivez votre demande..."
              maxLength={VALIDATION_LIMITS.CONTACT_MESSAGE_MAX}
              disabled={isPending}
              className="min-h-32 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20"
              {...register('message')}
            />
            {errors.message && (
              <p className="text-xs text-red-400">{errors.message.message}</p>
            )}
          </div>

          {/* Submit */}
          <div className="space-y-3">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Send className="mr-2 size-4" />
              )}
              Envoyer le message
            </Button>

            {/* GDPR / LPD Disclaimer */}
            <p className="text-center text-xs text-zinc-500">
              En soumettant ce formulaire, vous acceptez que vos données soient
              utilisées pour traiter votre demande conformément à notre{' '}
              <Link
                href={ROUTES.PRIVACY}
                className="text-blue-400 hover:underline"
              >
                politique de confidentialité
              </Link>
              .
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
