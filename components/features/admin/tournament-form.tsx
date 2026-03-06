/**
 * File: components/features/admin/tournament-form.tsx
 * Description: Full-page form for creating or editing a tournament with dynamic fields management.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  GripVertical,
  Info,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createTournament, updateTournament } from '@/lib/actions/tournaments'
import { ROUTES } from '@/lib/config/routes'
import type { TournamentDetail } from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import {
  type TournamentFormInput,
  type TournamentInput,
  tournamentSchema,
} from '@/lib/validations/tournaments'

interface TournamentFormProps {
  tournament?: TournamentDetail
}

/** Formats a Date to a datetime-local input value (YYYY-MM-DDTHH:MM). */
const toDateTimeLocal = (date: Date): string => {
  const d = new Date(date)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Converts a datetime-local value to ISO string. */
const toISOString = (dateTimeLocal: string): string => {
  return new Date(dateTimeLocal).toISOString()
}

/** Converts null to empty string for form default values. */
const fromNullable = (val: string | null): string => val ?? ''

/** Generates a slug from a title. */
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const TournamentForm = ({ tournament }: TournamentFormProps) => {
  const isEditing = !!tournament
  const fieldsLocked =
    isEditing &&
    tournament.status === 'PUBLISHED' &&
    tournament._count.registrations > 0
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<TournamentFormInput>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: tournament
      ? {
          title: tournament.title,
          slug: tournament.slug,
          description: tournament.description,
          startDate: toDateTimeLocal(tournament.startDate),
          endDate: toDateTimeLocal(tournament.endDate),
          registrationOpen: toDateTimeLocal(tournament.registrationOpen),
          registrationClose: toDateTimeLocal(tournament.registrationClose),
          maxTeams: tournament.maxTeams,
          format: tournament.format,
          teamSize: tournament.teamSize,
          game: fromNullable(tournament.game),
          imageUrl: fromNullable(tournament.imageUrl),
          rules: fromNullable(tournament.rules),
          prize: fromNullable(tournament.prize),
          toornamentId: fromNullable(tournament.toornamentId),
          streamUrl: fromNullable(tournament.streamUrl),
          autoApprove: tournament.autoApprove,
          fields: tournament.fields.map(f => ({
            id: f.id,
            label: f.label,
            type: f.type,
            required: f.required,
            order: f.order,
          })),
        }
      : {
          title: '',
          slug: '',
          description: '',
          startDate: '',
          endDate: '',
          registrationOpen: '',
          registrationClose: '',
          maxTeams: null,
          format: 'SOLO',
          teamSize: 1,
          game: '',
          imageUrl: '',
          rules: '',
          prize: '',
          toornamentId: '',
          streamUrl: '',
          autoApprove: false,
          fields: [],
        },
  })

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'fields',
  })

  const format = useWatch({ control, name: 'format' })

  const onSubmit = (data: TournamentFormInput) => {
    // Convert datetime-local values to ISO strings and cast to action input type
    // (Zod defaults are applied server-side by authenticatedAction)
    const payload = {
      ...data,
      startDate: toISOString(data.startDate),
      endDate: toISOString(data.endDate),
      registrationOpen: toISOString(data.registrationOpen),
      registrationClose: toISOString(data.registrationClose),
    } as TournamentInput

    startTransition(async () => {
      const result = isEditing
        ? await updateTournament({ ...payload, id: tournament.id })
        : await createTournament(payload)

      if (result.success) {
        toast.success(result.message)
        router.push(ROUTES.ADMIN_TOURNAMENTS)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    if (!isEditing) {
      setValue('slug', slugify(title), {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }

  const addField = () => {
    append({
      label: '',
      type: 'TEXT',
      required: false,
      order: fields.length,
    })
  }

  const moveField = (from: number, to: number) => {
    if (to < 0 || to >= fields.length) return
    move(from, to)
    // Update order values after move
    for (let i = 0; i < fields.length; i++) {
      setValue(`fields.${i}.order`, i)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm"
    >
      {/* General information */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
          Informations générales
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="title"
            label="Titre"
            placeholder="Coupe Belouga #1"
            error={errors.title?.message}
            disabled={isPending}
            {...register('title', { onChange: handleTitleChange })}
          />
          <FormField
            id="slug"
            label="Slug (URL)"
            placeholder="coupe-belouga-1"
            error={errors.slug?.message}
            disabled={isPending}
            {...register('slug')}
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="description"
            className="text-xs font-medium text-zinc-400"
          >
            Description
          </Label>
          <Textarea
            id="description"
            placeholder="Décrivez le tournoi..."
            disabled={isPending}
            className="min-h-24 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20"
            {...register('description')}
          />
          {errors.description?.message && (
            <p className="text-xs text-red-400">{errors.description.message}</p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="game"
            label="Jeu"
            placeholder="Rocket League"
            error={errors.game?.message}
            disabled={isPending}
            {...register('game')}
          />
          <FormField
            id="imageUrl"
            label="Image (URL)"
            placeholder="https://example.com/image.png"
            error={errors.imageUrl?.message}
            disabled={isPending}
            {...register('imageUrl')}
          />
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {/* Format & team size */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
          Format
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-400">
              Type de format
            </Label>
            <Select
              value={format}
              onValueChange={val => {
                setValue('format', val as 'SOLO' | 'TEAM', {
                  shouldDirty: true,
                })
                if (val === 'SOLO') {
                  setValue('teamSize', 1, { shouldDirty: true })
                }
              }}
              disabled={isPending || isEditing}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOLO">Solo</SelectItem>
                <SelectItem value="TEAM">Équipe</SelectItem>
              </SelectContent>
            </Select>
            {isEditing && (
              <p className="text-xs text-zinc-500">
                Le format ne peut pas être modifié après la création.
              </p>
            )}
            {errors.format?.message && (
              <p className="text-xs text-red-400">{errors.format.message}</p>
            )}
          </div>
          <FormField
            id="teamSize"
            label="Taille d'équipe"
            type="number"
            placeholder="1"
            error={errors.teamSize?.message}
            disabled={isPending || format === 'SOLO'}
            {...register('teamSize', { valueAsNumber: true })}
          />
          <FormField
            id="maxTeams"
            label="Nombre max. d'équipes"
            type="number"
            placeholder="Illimité"
            error={errors.maxTeams?.message}
            disabled={isPending}
            {...register('maxTeams', {
              setValueAs: (v: string) =>
                v === '' || v === undefined ? null : Number(v),
            })}
          />
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {/* Dates */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
          Dates
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="startDate"
            label="Date de début"
            type="datetime-local"
            error={errors.startDate?.message}
            disabled={isPending}
            {...register('startDate')}
          />
          <FormField
            id="endDate"
            label="Date de fin"
            type="datetime-local"
            error={errors.endDate?.message}
            disabled={isPending}
            {...register('endDate')}
          />
          <FormField
            id="registrationOpen"
            label="Ouverture des inscriptions"
            type="datetime-local"
            error={errors.registrationOpen?.message}
            disabled={isPending}
            {...register('registrationOpen')}
          />
          <FormField
            id="registrationClose"
            label="Fermeture des inscriptions"
            type="datetime-local"
            error={errors.registrationClose?.message}
            disabled={isPending}
            {...register('registrationClose')}
          />
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {/* Rules & prizes */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
          Règlement & prix
        </h3>
        <div className="space-y-1.5">
          <Label htmlFor="rules" className="text-xs font-medium text-zinc-400">
            Règlement
          </Label>
          <Textarea
            id="rules"
            placeholder="Décrivez les règles du tournoi..."
            disabled={isPending}
            className="min-h-32 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20"
            {...register('rules')}
          />
          {errors.rules?.message && (
            <p className="text-xs text-red-400">{errors.rules.message}</p>
          )}
        </div>
        <FormField
          id="prize"
          label="Prix"
          placeholder="1er: 100€, 2ème: 50€"
          error={errors.prize?.message}
          disabled={isPending}
          {...register('prize')}
        />
      </div>

      <div className="h-px bg-white/5" />

      {/* Links & integrations */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
          Liens & intégrations
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="toornamentId"
            label="ID Toornament"
            placeholder="1234567890"
            error={errors.toornamentId?.message}
            disabled={isPending}
            {...register('toornamentId')}
          />
          <FormField
            id="streamUrl"
            label="URL du stream"
            placeholder="https://twitch.tv/..."
            error={errors.streamUrl?.message}
            disabled={isPending}
            {...register('streamUrl')}
          />
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {/* Registration settings */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
          Inscriptions
        </h3>
        <div className="flex items-center gap-3">
          <Switch
            id="autoApprove"
            checked={useWatch({ control, name: 'autoApprove' })}
            onCheckedChange={checked =>
              setValue('autoApprove', checked, { shouldDirty: true })
            }
            disabled={isPending}
          />
          <Label htmlFor="autoApprove" className="text-sm text-zinc-300">
            Approuver automatiquement les inscriptions
          </Label>
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {/* Dynamic fields */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
            Champs personnalisés
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addField}
            disabled={isPending || fieldsLocked}
            className="gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            <Plus className="size-3.5" />
            Ajouter
          </Button>
        </div>

        {fieldsLocked && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
            <Info className="size-4 shrink-0 text-amber-400" />
            <p className="text-xs text-amber-300">
              Les champs personnalisés ne peuvent pas être modifiés car le
              tournoi est publié et a des inscriptions.
            </p>
          </div>
        )}

        {fields.length === 0 && (
          <p className="text-sm text-zinc-600">
            Aucun champ personnalisé pour le moment.
          </p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/2 p-3"
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5 pt-1">
                <button
                  type="button"
                  onClick={() => moveField(index, index - 1)}
                  disabled={index === 0 || isPending || fieldsLocked}
                  className="text-zinc-600 hover:text-zinc-400 disabled:opacity-30"
                  aria-label={`Monter le champ ${(index + 1).toString()}`}
                >
                  <GripVertical className="size-4" />
                </button>
              </div>

              {/* Field inputs */}
              <div className="grid flex-1 gap-3 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <Input
                    placeholder="Libellé du champ"
                    aria-label={`Libellé du champ ${(index + 1).toString()}`}
                    disabled={isPending || fieldsLocked}
                    className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600"
                    {...register(`fields.${index}.label`)}
                  />
                  {errors.fields?.[index]?.label?.message && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.fields[index].label.message}
                    </p>
                  )}
                </div>

                <div>
                  <Select
                    value={watch(`fields.${index}.type`)}
                    onValueChange={val =>
                      setValue(
                        `fields.${index}.type`,
                        val as 'TEXT' | 'NUMBER',
                        { shouldDirty: true },
                      )
                    }
                    disabled={isPending || fieldsLocked}
                  >
                    <SelectTrigger className="h-9 w-full rounded-lg border-white/10 bg-white/5 text-sm text-zinc-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">Texte</SelectItem>
                      <SelectItem value="NUMBER">Nombre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={watch(`fields.${index}.required`)}
                    onCheckedChange={checked =>
                      setValue(`fields.${index}.required`, checked, {
                        shouldDirty: true,
                      })
                    }
                    disabled={isPending || fieldsLocked}
                    size="sm"
                  />
                  <span className="text-xs text-zinc-400">Requis</span>
                </div>
              </div>

              {/* Hidden order field */}
              <input
                type="hidden"
                {...register(`fields.${index}.order`, { valueAsNumber: true })}
              />

              {/* Delete field button */}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  remove(index)
                  // Re-index remaining fields
                  for (let i = index; i < fields.length - 1; i++) {
                    setValue(`fields.${i}.order`, i)
                  }
                }}
                disabled={isPending || fieldsLocked}
                className="mt-0.5 text-zinc-500 hover:text-red-400"
                aria-label={`Supprimer le champ ${(index + 1).toString()}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {/* Submit */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          asChild
          className="gap-2 text-zinc-400 hover:text-white"
        >
          <Link href={ROUTES.ADMIN_TOURNAMENTS}>
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        </Button>
        <Button
          type="submit"
          disabled={isPending || (!isDirty && isEditing)}
          className="gap-2 bg-blue-600 text-white hover:bg-blue-500"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {isEditing ? 'Enregistrer' : 'Créer le tournoi'}
        </Button>
      </div>
    </form>
  )
}

/** Internal reusable field component for tournament form inputs. */
interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

const FormField = ({
  id,
  label,
  error,
  className,
  ...inputProps
}: FormFieldProps) => {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className="text-xs font-medium text-zinc-400">
        {label}
      </Label>
      <Input
        id={id}
        className="h-10 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20"
        {...inputProps}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
