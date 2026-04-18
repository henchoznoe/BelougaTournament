/**
 * File: components/admin/forms/tournament-form.tsx
 * Description: Form component for creating or editing a tournament with all sections.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  CreditCard,
  Eye,
  FileText,
  Gamepad2,
  GripVertical,
  ImagePlus,
  Layers,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Save,
  Settings,
  Trash2,
  Trophy,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { type Resolver, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Markdown } from '@/components/ui/markdown'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createTournament, updateTournament } from '@/lib/actions/tournaments'
import { ROUTES } from '@/lib/config/routes'
import type { TournamentDetail } from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import { fromNullable } from '@/lib/utils/formatting'
import {
  tournamentSchema,
  updateTournamentSchema,
} from '@/lib/validations/tournaments'
import {
  FieldType,
  RefundPolicyType,
  RegistrationType,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

// ─── Types ───────────────────────────────────────────────────────────────────

/** Form output type derived from the Zod create schema (post-parse, post-defaults). */
type TournamentInput = z.output<typeof tournamentSchema>

interface BlobItem {
  url: string
  pathname: string
  size: number
  uploadedAt: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate slug from title string. */
const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Convert ISO datetime string to datetime-local value in Swiss timezone (YYYY-MM-DDTHH:mm). */
const toDatetimeLocalValue = (iso: string | Date): string => {
  const d = new Date(iso)
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Zurich',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  // sv-SE locale gives YYYY-MM-DD HH:mm format
  return formatter.format(d).replace(' ', 'T')
}

/** Convert datetime-local string (Swiss timezone) to ISO UTC datetime string. */
const toISOFromLocal = (localStr: string): string => {
  // localStr is "YYYY-MM-DDTHH:mm" in Europe/Zurich
  // Build a date string that we can parse as Swiss local time
  const [datePart, timePart] = localStr.split('T')
  // Use date-fns or manual approach: create a temporary Date in UTC, then offset
  // Simpler: use Intl to find the offset for that date in Zurich
  const naive = new Date(`${datePart}T${timePart}:00`)
  // Get the UTC offset for Europe/Zurich at this date
  const zurichStr = naive.toLocaleString('en-US', { timeZone: 'Europe/Zurich' })
  const utcStr = naive.toLocaleString('en-US', { timeZone: 'UTC' })
  const zurichDate = new Date(zurichStr)
  const utcDate = new Date(utcStr)
  const offsetMs = utcDate.getTime() - zurichDate.getTime()
  // The actual UTC time = naive time + offset
  const utcTime = new Date(naive.getTime() + offsetMs)
  return utcTime.toISOString()
}

// ─── Input styling constants ─────────────────────────────────────────────────

const INPUT_CLASSES =
  'h-10 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20'

const TEXTAREA_CLASSES =
  'min-h-24 rounded-xl border-white/5 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20'

const LABEL_CLASSES = 'text-xs font-medium text-zinc-400'

const SECTION_CLASSES =
  'rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm'

// ─── Section Header ──────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon: typeof FileText
  title: string
  color?: string
}

const SectionHeader = ({
  icon: Icon,
  title,
  color = 'text-blue-400',
}: SectionHeaderProps) => (
  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
    <Icon className={cn('size-4', color)} />
    {title}
  </h2>
)

// ─── Locked Field Indicator ──────────────────────────────────────────────────

const LockedIndicator = () => (
  <span className="inline-flex items-center gap-1 text-[10px] text-zinc-600">
    <Lock className="size-2.5" />
    Verrouillé
  </span>
)

// ─── Markdown Toggle ─────────────────────────────────────────────────────────

interface MarkdownFieldProps {
  id: string
  label: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  maxLength?: number
  error?: string
  rows?: number
}

const MarkdownField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  error,
  rows = 6,
}: MarkdownFieldProps) => {
  const [preview, setPreview] = useState(false)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className={LABEL_CLASSES}>
          {label}
        </Label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPreview(false)}
            className={cn(
              'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
              !preview
                ? 'bg-white/10 text-white'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            <Pencil className="mr-1 inline size-2.5" />
            Éditer
          </button>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className={cn(
              'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
              preview
                ? 'bg-white/10 text-white'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            <Eye className="mr-1 inline size-2.5" />
            Aperçu
          </button>
        </div>
      </div>
      {preview ? (
        <div className="min-h-24 rounded-xl border border-white/5 bg-white/5 p-4">
          {value ? (
            <Markdown content={value} />
          ) : (
            <p className="text-sm text-zinc-600">Rien à afficher.</p>
          )}
        </div>
      ) : (
        <Textarea
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          className={TEXTAREA_CLASSES}
        />
      )}
      {maxLength && (
        <p className="text-[10px] text-zinc-600">
          {value.length} / {maxLength}
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Main Form ───────────────────────────────────────────────────────────────

interface TournamentFormProps {
  tournament?: TournamentDetail
}

export const TournamentForm = ({ tournament }: TournamentFormProps) => {
  const isEditing = !!tournament
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [blobs, setBlobs] = useState<BlobItem[]>([])
  const [isLoadingBlobs, setIsLoadingBlobs] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Determine locked fields in edit mode
  const fieldsLocked =
    isEditing &&
    tournament.status === TournamentStatus.PUBLISHED &&
    tournament._count.registrations > 0

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<TournamentInput>({
    resolver: zodResolver(
      isEditing ? updateTournamentSchema : tournamentSchema,
    ) as unknown as Resolver<TournamentInput>,
    defaultValues: {
      title: tournament?.title ?? '',
      slug: tournament?.slug ?? '',
      description: tournament?.description ?? '',
      startDate: tournament ? toDatetimeLocalValue(tournament.startDate) : '',
      endDate: tournament ? toDatetimeLocalValue(tournament.endDate) : '',
      registrationOpen: tournament
        ? toDatetimeLocalValue(tournament.registrationOpen)
        : '',
      registrationClose: tournament
        ? toDatetimeLocalValue(tournament.registrationClose)
        : '',
      maxTeams: tournament?.maxTeams ?? null,
      format: tournament?.format ?? TournamentFormat.SOLO,
      teamSize: tournament?.teamSize ?? 1,
      game: fromNullable(tournament?.game ?? null),
      rules: fromNullable(tournament?.rules ?? null),
      prize: fromNullable(tournament?.prize ?? null),
      registrationType: tournament?.registrationType ?? RegistrationType.FREE,
      entryFeeAmount: tournament?.entryFeeAmount ?? null,
      entryFeeCurrency: 'CHF',
      refundPolicyType: tournament?.refundPolicyType ?? RefundPolicyType.NONE,
      refundDeadlineDays: tournament?.refundDeadlineDays ?? null,
      toornamentId: fromNullable(tournament?.toornamentId ?? null),
      imageUrl: fromNullable(tournament?.imageUrl ?? null),
      streamUrl: fromNullable(tournament?.streamUrl ?? null),
      fields:
        tournament?.fields.map(f => ({
          id: f.id,
          label: f.label,
          type: f.type as FieldType,
          required: f.required,
          order: f.order,
        })) ?? [],
      toornamentStages:
        tournament?.toornamentStages.map(s => ({
          id: s.id,
          name: s.name,
          stageId: s.stageId,
          number: s.number,
        })) ?? [],
    },
  })

  const {
    fields: fieldArrayFields,
    append: appendField,
    remove: removeField,
  } = useFieldArray({ control, name: 'fields' })

  const {
    fields: stageArrayFields,
    append: appendStage,
    remove: removeStage,
  } = useFieldArray({ control, name: 'toornamentStages' })

  const watchTitle = watch('title')
  const watchFormat = watch('format')
  const watchRegistrationType = watch('registrationType')
  const watchRefundPolicyType = watch('refundPolicyType')
  const watchDescription = watch('description')
  const watchRules = watch('rules')
  const watchPrize = watch('prize')
  const watchImageUrl = watch('imageUrl')
  const watchMaxTeams = watch('maxTeams')
  const watchEntryFeeAmount = watch('entryFeeAmount')
  const watchRefundDeadlineDays = watch('refundDeadlineDays')

  // Auto-generate slug from title in create mode
  useEffect(() => {
    if (!isEditing && watchTitle) {
      setValue('slug', slugify(watchTitle))
    }
  }, [isEditing, watchTitle, setValue])

  // Reset payment fields when switching to FREE
  useEffect(() => {
    if (watchRegistrationType === RegistrationType.FREE) {
      setValue('entryFeeAmount', null)
      setValue('refundPolicyType', RefundPolicyType.NONE)
      setValue('refundDeadlineDays', null)
    }
  }, [watchRegistrationType, setValue])

  // Reset refund deadline when policy is NONE
  useEffect(() => {
    if (watchRefundPolicyType === RefundPolicyType.NONE) {
      setValue('refundDeadlineDays', null)
    }
  }, [watchRefundPolicyType, setValue])

  // Reset teamSize to 1 when format is SOLO
  useEffect(() => {
    if (watchFormat === TournamentFormat.SOLO) {
      setValue('teamSize', 1)
    }
  }, [watchFormat, setValue])

  // ─── Blob management ────────────────────────────────────────────────────────

  const fetchBlobs = useCallback(async () => {
    setIsLoadingBlobs(true)
    try {
      const res = await fetch('/api/admin/blobs?folder=tournaments')
      if (!res.ok) throw new Error('Failed to fetch blobs')
      const data = (await res.json()) as { blobs: BlobItem[] }
      setBlobs(data.blobs)
    } catch (error) {
      console.error('Error fetching blobs:', error)
      toast.error('Erreur lors du chargement des images.')
    } finally {
      setIsLoadingBlobs(false)
    }
  }, [])

  useEffect(() => {
    fetchBlobs()
  }, [fetchBlobs])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'tournaments')

      const res = await fetch('/api/admin/blobs', {
        method: 'POST',
        body: formData,
      })
      const data = (await res.json()) as { url?: string; error?: string }

      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Erreur lors de l'upload.")
        return
      }

      toast.success('Image importée avec succès.')
      setValue('imageUrl', data.url, {
        shouldDirty: true,
        shouldValidate: true,
      })
      await fetchBlobs()
    } catch (error) {
      console.error('Error uploading tournament image:', error)
      toast.error('Une erreur inattendue est survenue.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ─── Form submission ────────────────────────────────────────────────────────

  const onSubmit = (data: TournamentInput) => {
    // Convert datetime-local inputs (Swiss timezone) to ISO UTC strings
    const payload = {
      ...data,
      startDate: toISOFromLocal(data.startDate),
      endDate: toISOFromLocal(data.endDate),
      registrationOpen: toISOFromLocal(data.registrationOpen),
      registrationClose: toISOFromLocal(data.registrationClose),
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateTournament({ ...payload, id: tournament.id })
        : await createTournament(payload)

      if (result.success) {
        toast.success(result.message)
        router.push(
          isEditing
            ? ROUTES.ADMIN_TOURNAMENT_DETAIL(data.slug)
            : ROUTES.ADMIN_TOURNAMENTS,
        )
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const isPaid = watchRegistrationType === RegistrationType.PAID
  const isTeam = watchFormat === TournamentFormat.TEAM

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── Section 1: General Info ─────────────────────────────────────────── */}
      <div className={SECTION_CLASSES}>
        <SectionHeader icon={FileText} title="Informations générales" />
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="tournament-title" className={LABEL_CLASSES}>
              Titre *
            </Label>
            <Input
              id="tournament-title"
              placeholder="Nom du tournoi"
              className={INPUT_CLASSES}
              {...register('title')}
            />
            {errors.title?.message && (
              <p className="text-xs text-red-400">{errors.title.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="tournament-slug" className={LABEL_CLASSES}>
              Slug *
              {!isEditing && (
                <span className="ml-2 text-[10px] text-zinc-600">
                  (généré automatiquement)
                </span>
              )}
            </Label>
            <Input
              id="tournament-slug"
              placeholder="mon-tournoi"
              className={cn(INPUT_CLASSES, 'font-mono text-xs')}
              {...register('slug')}
            />
            {errors.slug?.message && (
              <p className="text-xs text-red-400">{errors.slug.message}</p>
            )}
          </div>

          {/* Description (markdown) */}
          <MarkdownField
            id="tournament-description"
            label="Description *"
            value={watchDescription}
            onChange={val =>
              setValue('description', val, { shouldValidate: true })
            }
            placeholder="Description du tournoi (supporte le Markdown)"
            maxLength={5000}
            error={errors.description?.message}
          />
          <p className="text-[10px] text-zinc-600">
            Ce champ supporte la syntaxe{' '}
            <a
              href="https://markdownlivepreview.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline hover:text-blue-400"
            >
              Markdown
            </a>
            . Utilisez le bouton Aperçu pour prévisualiser le rendu.
          </p>
        </div>
      </div>

      {/* ── Section 2: Game & Format ───────────────────────────────────────── */}
      <div className={SECTION_CLASSES}>
        <SectionHeader icon={Gamepad2} title="Jeu et format" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Game */}
          <div className="space-y-1.5">
            <Label htmlFor="tournament-game" className={LABEL_CLASSES}>
              Jeu
            </Label>
            <Input
              id="tournament-game"
              placeholder="Ex: League of Legends"
              className={INPUT_CLASSES}
              {...register('game')}
            />
            {errors.game?.message && (
              <p className="text-xs text-red-400">{errors.game.message}</p>
            )}
          </div>

          {/* Format */}
          <div className="space-y-1.5">
            <Label className={LABEL_CLASSES}>
              Format * {isEditing && <LockedIndicator />}
            </Label>
            <Select
              value={watchFormat}
              onValueChange={val =>
                setValue('format', val as TournamentFormat, {
                  shouldValidate: true,
                })
              }
              disabled={isEditing}
            >
              <SelectTrigger
                className={cn(
                  INPUT_CLASSES,
                  'w-full',
                  isEditing && 'opacity-60',
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TournamentFormat.SOLO}>Solo</SelectItem>
                <SelectItem value={TournamentFormat.TEAM}>Équipe</SelectItem>
              </SelectContent>
            </Select>
            {errors.format?.message && (
              <p className="text-xs text-red-400">{errors.format.message}</p>
            )}
          </div>

          {/* Team Size */}
          <div className="space-y-1.5">
            <Label htmlFor="tournament-teamSize" className={LABEL_CLASSES}>
              Taille d&apos;équipe *
            </Label>
            <Input
              id="tournament-teamSize"
              type="number"
              min={1}
              max={20}
              disabled={!isTeam}
              className={cn(INPUT_CLASSES, !isTeam && 'opacity-60')}
              {...register('teamSize', { valueAsNumber: true })}
            />
            {errors.teamSize?.message && (
              <p className="text-xs text-red-400">{errors.teamSize.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 3: Dates ───────────────────────────────────────────────── */}
      <div className={SECTION_CLASSES}>
        <SectionHeader icon={Calendar} title="Dates" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tournament-startDate" className={LABEL_CLASSES}>
              Début du tournoi *
            </Label>
            <Input
              id="tournament-startDate"
              type="datetime-local"
              className={cn(INPUT_CLASSES, 'w-56')}
              {...register('startDate')}
            />
            {errors.startDate?.message && (
              <p className="text-xs text-red-400">{errors.startDate.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tournament-endDate" className={LABEL_CLASSES}>
              Fin du tournoi *
            </Label>
            <Input
              id="tournament-endDate"
              type="datetime-local"
              className={cn(INPUT_CLASSES, 'w-56')}
              {...register('endDate')}
            />
            {errors.endDate?.message && (
              <p className="text-xs text-red-400">{errors.endDate.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="tournament-registrationOpen"
              className={LABEL_CLASSES}
            >
              Ouverture des inscriptions *
            </Label>
            <Input
              id="tournament-registrationOpen"
              type="datetime-local"
              className={cn(INPUT_CLASSES, 'w-56')}
              {...register('registrationOpen')}
            />
            {errors.registrationOpen?.message && (
              <p className="text-xs text-red-400">
                {errors.registrationOpen.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="tournament-registrationClose"
              className={LABEL_CLASSES}
            >
              Fermeture des inscriptions *
            </Label>
            <Input
              id="tournament-registrationClose"
              type="datetime-local"
              className={cn(INPUT_CLASSES, 'w-56')}
              {...register('registrationClose')}
            />
            {errors.registrationClose?.message && (
              <p className="text-xs text-red-400">
                {errors.registrationClose.message}
              </p>
            )}
          </div>
        </div>
        <p className="mt-3 text-[10px] text-zinc-600">
          Les heures sont en fuseau horaire suisse (Europe/Zurich) et converties
          automatiquement en UTC pour le stockage.
        </p>
      </div>

      {/* ── Section 4: Registration & Payment ──────────────────────────────── */}
      <div className={SECTION_CLASSES}>
        <SectionHeader icon={CreditCard} title="Inscription et paiement" />
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Max Teams */}
            <div className="space-y-1.5">
              <Label htmlFor="tournament-maxTeams" className={LABEL_CLASSES}>
                Nombre max. de places
              </Label>
              <Input
                id="tournament-maxTeams"
                type="number"
                min={2}
                placeholder="Illimité"
                className={INPUT_CLASSES}
                value={watchMaxTeams ?? ''}
                onChange={e => {
                  const val =
                    e.target.value === '' ? null : Number(e.target.value)
                  setValue('maxTeams', val, { shouldValidate: true })
                }}
              />
              {errors.maxTeams?.message && (
                <p className="text-xs text-red-400">
                  {errors.maxTeams.message}
                </p>
              )}
            </div>

            {/* Registration Type */}
            <div className="space-y-1.5">
              <Label className={LABEL_CLASSES}>
                Type d&apos;inscription * {isEditing && <LockedIndicator />}
              </Label>
              <Select
                value={watchRegistrationType}
                onValueChange={val =>
                  setValue('registrationType', val as RegistrationType, {
                    shouldValidate: true,
                  })
                }
                disabled={isEditing}
              >
                <SelectTrigger
                  className={cn(
                    INPUT_CLASSES,
                    'w-full',
                    isEditing && 'opacity-60',
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RegistrationType.FREE}>Gratuit</SelectItem>
                  <SelectItem value={RegistrationType.PAID}>Payant</SelectItem>
                </SelectContent>
              </Select>
              {errors.registrationType?.message && (
                <p className="text-xs text-red-400">
                  {errors.registrationType.message}
                </p>
              )}
            </div>

            {/* Entry Fee */}
            {isPaid && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="tournament-entryFeeAmount"
                  className={LABEL_CLASSES}
                >
                  Prix d&apos;entrée (CHF) * {isEditing && <LockedIndicator />}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="tournament-entryFeeAmount"
                    type="number"
                    min={1}
                    step={0.01}
                    placeholder="5.00"
                    disabled={isEditing}
                    className={cn(
                      INPUT_CLASSES,
                      'flex-1',
                      isEditing && 'opacity-60',
                    )}
                    value={
                      watchEntryFeeAmount !== null
                        ? (watchEntryFeeAmount / 100).toFixed(2)
                        : ''
                    }
                    onChange={e => {
                      const val =
                        e.target.value === ''
                          ? null
                          : Math.round(Number(e.target.value) * 100)
                      setValue('entryFeeAmount', val, { shouldValidate: true })
                    }}
                  />
                  <span className="text-xs font-medium text-zinc-500">CHF</span>
                </div>
                {errors.entryFeeAmount?.message && (
                  <p className="text-xs text-red-400">
                    {errors.entryFeeAmount.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Refund policy (only for paid) */}
          {isPaid && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={LABEL_CLASSES}>
                  Politique de remboursement {isEditing && <LockedIndicator />}
                </Label>
                <Select
                  value={watchRefundPolicyType}
                  onValueChange={val =>
                    setValue('refundPolicyType', val as RefundPolicyType, {
                      shouldValidate: true,
                    })
                  }
                  disabled={isEditing}
                >
                  <SelectTrigger
                    className={cn(
                      INPUT_CLASSES,
                      'w-full',
                      isEditing && 'opacity-60',
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RefundPolicyType.NONE}>
                      Aucun remboursement
                    </SelectItem>
                    <SelectItem value={RefundPolicyType.BEFORE_DEADLINE}>
                      Avant délai
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.refundPolicyType?.message && (
                  <p className="text-xs text-red-400">
                    {errors.refundPolicyType.message}
                  </p>
                )}
              </div>

              {watchRefundPolicyType === RefundPolicyType.BEFORE_DEADLINE && (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="tournament-refundDeadlineDays"
                    className={LABEL_CLASSES}
                  >
                    Délai (jours avant début) *{' '}
                    {isEditing && <LockedIndicator />}
                  </Label>
                  <Input
                    id="tournament-refundDeadlineDays"
                    type="number"
                    min={1}
                    max={90}
                    disabled={isEditing}
                    className={cn(
                      INPUT_CLASSES,
                      'w-32',
                      isEditing && 'opacity-60',
                    )}
                    value={watchRefundDeadlineDays ?? ''}
                    onChange={e => {
                      const val =
                        e.target.value === '' ? null : Number(e.target.value)
                      setValue('refundDeadlineDays', val, {
                        shouldValidate: true,
                      })
                    }}
                  />
                  {errors.refundDeadlineDays?.message && (
                    <p className="text-xs text-red-400">
                      {errors.refundDeadlineDays.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 5: Image & Media ───────────────────────────────────────── */}
      <div className={SECTION_CLASSES}>
        <SectionHeader icon={ImagePlus} title="Image et médias" />
        <div className="space-y-4">
          {/* Image preview */}
          {watchImageUrl && (
            <div className="flex items-start gap-4">
              <div className="relative size-24 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                <Image
                  src={watchImageUrl}
                  alt="Aperçu"
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setValue('imageUrl', '', {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <X className="mr-1 size-3.5" />
                Retirer l&apos;image
              </Button>
            </div>
          )}

          {/* Upload button */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              className="gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              {isUploading ? 'Import en cours...' : 'Uploader une image'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleUpload}
            />
          </div>

          {/* Existing images gallery */}
          <div className="space-y-2 rounded-xl border border-white/5 bg-white/2 p-3">
            <button
              type="button"
              onClick={() => setGalleryOpen(prev => !prev)}
              className="flex w-full items-center justify-between text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <span>Images existantes (tournaments)</span>
              <ChevronDown
                className={cn(
                  'size-4 transition-transform duration-200',
                  galleryOpen && 'rotate-180',
                )}
              />
            </button>

            {galleryOpen &&
              (isLoadingBlobs ? (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {['s1', 's2', 's3'].map(key => (
                    <Skeleton
                      key={key}
                      className="aspect-square rounded-lg bg-white/5"
                    />
                  ))}
                </div>
              ) : blobs.length === 0 ? (
                <p className="py-2 text-center text-xs text-zinc-600">
                  Aucune image dans le dossier tournaments.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {blobs.map(blob => {
                    const isSelected = watchImageUrl === blob.url
                    return (
                      <button
                        key={blob.url}
                        type="button"
                        onClick={() =>
                          setValue('imageUrl', isSelected ? '' : blob.url, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        className={cn(
                          'relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-white/5 transition-all duration-200',
                          isSelected
                            ? 'border-blue-500/50 ring-2 ring-blue-500/20'
                            : 'border-white/10 hover:border-white/20',
                        )}
                      >
                        <Image
                          src={blob.url}
                          alt={blob.pathname}
                          width={80}
                          height={80}
                          className="size-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10">
                            <div className="rounded-full bg-blue-500 p-1">
                              <X className="size-3 text-white" />
                            </div>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
          </div>

          {errors.imageUrl?.message && (
            <p className="text-xs text-red-400">{errors.imageUrl.message}</p>
          )}

          {/* Stream URL */}
          <div className="space-y-1.5">
            <Label htmlFor="tournament-streamUrl" className={LABEL_CLASSES}>
              URL du stream
            </Label>
            <Input
              id="tournament-streamUrl"
              placeholder="https://twitch.tv/..."
              className={INPUT_CLASSES}
              {...register('streamUrl')}
            />
            {errors.streamUrl?.message && (
              <p className="text-xs text-red-400">{errors.streamUrl.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 6: Content (rules, prize) ──────────────────────────────── */}
      <div className={SECTION_CLASSES}>
        <SectionHeader icon={Trophy} title="Contenu" color="text-amber-400" />
        <div className="space-y-4">
          <MarkdownField
            id="tournament-rules"
            label="Règles"
            value={watchRules}
            onChange={val => setValue('rules', val, { shouldValidate: true })}
            placeholder="Règles du tournoi (supporte le Markdown)"
            maxLength={10000}
            error={errors.rules?.message}
            rows={8}
          />

          <MarkdownField
            id="tournament-prize"
            label="Prix"
            value={watchPrize}
            onChange={val => setValue('prize', val, { shouldValidate: true })}
            placeholder="Description des prix (supporte le Markdown)"
            maxLength={500}
            error={errors.prize?.message}
            rows={3}
          />
        </div>
      </div>

      {/* ── Section 7: Custom Fields ───────────────────────────────────────── */}
      <div className={SECTION_CLASSES}>
        <SectionHeader icon={Settings} title="Champs personnalisés" />

        {fieldsLocked && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
            <AlertTriangle className="size-3.5 shrink-0" />
            Les champs ne peuvent pas être modifiés car le tournoi est publié
            avec des inscrits.
          </div>
        )}

        <div className="space-y-3">
          {fieldArrayFields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/2 p-3"
            >
              <GripVertical className="mt-2.5 size-4 shrink-0 text-zinc-600" />
              <div className="grid flex-1 gap-3 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <Input
                    placeholder="Libellé"
                    disabled={!!fieldsLocked}
                    className={cn(
                      INPUT_CLASSES,
                      'h-9 text-xs',
                      fieldsLocked && 'opacity-60',
                    )}
                    {...register(`fields.${index}.label`)}
                  />
                  {errors.fields?.[index]?.label?.message && (
                    <p className="mt-1 text-[10px] text-red-400">
                      {errors.fields[index].label.message}
                    </p>
                  )}
                </div>
                <Select
                  value={watch(`fields.${index}.type`)}
                  onValueChange={val =>
                    setValue(`fields.${index}.type`, val as FieldType, {
                      shouldValidate: true,
                    })
                  }
                  disabled={!!fieldsLocked}
                >
                  <SelectTrigger
                    className={cn(
                      INPUT_CLASSES,
                      'h-9 text-xs',
                      fieldsLocked && 'opacity-60',
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FieldType.TEXT}>Texte</SelectItem>
                    <SelectItem value={FieldType.NUMBER}>Nombre</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Switch
                      size="sm"
                      checked={watch(`fields.${index}.required`)}
                      onCheckedChange={val =>
                        setValue(`fields.${index}.required`, val, {
                          shouldValidate: true,
                        })
                      }
                      disabled={!!fieldsLocked}
                    />
                    <span className="text-[10px] text-zinc-500">Requis</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!!fieldsLocked}
                    onClick={() => removeField(index)}
                    className="size-8 p-0 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Supprimer le champ"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <input
                type="hidden"
                {...register(`fields.${index}.order`, { valueAsNumber: true })}
                value={index}
              />
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!!fieldsLocked}
            onClick={() =>
              appendField({
                label: '',
                type: FieldType.TEXT,
                required: false,
                order: fieldArrayFields.length,
              })
            }
            className="gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            <Plus className="size-3.5" />
            Ajouter un champ
          </Button>
        </div>
      </div>

      {/* ── Section 8: Toornament Integration ──────────────────────────────── */}
      <div className={SECTION_CLASSES}>
        <SectionHeader icon={Layers} title="Intégration Toornament" />
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tournament-toornamentId" className={LABEL_CLASSES}>
              ID Toornament
            </Label>
            <Input
              id="tournament-toornamentId"
              placeholder="ID du tournoi sur Toornament.com"
              className={INPUT_CLASSES}
              {...register('toornamentId')}
            />
            <p className="text-[10px] text-zinc-600">
              Trouvable dans l&apos;URL du tournoi sur toornament.com (ex:
              toornament.com/tournaments/<strong>ID</strong>/information).
            </p>
            {errors.toornamentId?.message && (
              <p className="text-xs text-red-400">
                {errors.toornamentId.message}
              </p>
            )}
          </div>

          {/* Stages */}
          <div className="space-y-3">
            <Label className={LABEL_CLASSES}>Stages</Label>
            {stageArrayFields.map((stage, index) => (
              <div
                key={stage.id}
                className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/2 p-3"
              >
                <GripVertical className="mt-2.5 size-4 shrink-0 text-zinc-600" />
                <div className="grid flex-1 gap-3 sm:grid-cols-3">
                  <Input
                    placeholder="Nom du stage"
                    className={cn(INPUT_CLASSES, 'h-9 text-xs')}
                    {...register(`toornamentStages.${index}.name`)}
                  />
                  <Input
                    placeholder="ID du stage (depuis Toornament)"
                    className={cn(INPUT_CLASSES, 'h-9 font-mono text-xs')}
                    {...register(`toornamentStages.${index}.stageId`)}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">#{index + 1}</span>
                    <input
                      type="hidden"
                      {...register(`toornamentStages.${index}.number`, {
                        valueAsNumber: true,
                      })}
                      value={index}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStage(index)}
                      className="size-8 p-0 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                      aria-label="Supprimer le stage"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {errors.toornamentStages?.message && (
              <p className="text-xs text-red-400">
                {errors.toornamentStages.message}
              </p>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendStage({
                  name: '',
                  stageId: '',
                  number: stageArrayFields.length,
                })
              }
              className="gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              <Plus className="size-3.5" />
              Ajouter un stage
            </Button>
          </div>
        </div>
      </div>

      {/* ── Submit ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(ROUTES.ADMIN_TOURNAMENTS)}
          className="text-zinc-400"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isPending || isUploading}
          className="gap-2 bg-blue-600 text-white hover:bg-blue-500"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {isEditing ? 'Enregistrer' : 'Créer'}
        </Button>
      </div>
    </form>
  )
}
