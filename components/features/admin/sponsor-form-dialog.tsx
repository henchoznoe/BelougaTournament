/**
 * File: components/features/admin/sponsor-form-dialog.tsx
 * Description: Dialog form for creating or editing a sponsor with multi-image upload.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Crown,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { createSponsor, updateSponsor } from '@/lib/actions/sponsors'
import { cn } from '@/lib/utils/cn'
import { type SponsorInput, sponsorSchema } from '@/lib/validations/sponsors'
import type { Sponsor } from '@/prisma/generated/prisma/client'

interface BlobItem {
  url: string
  pathname: string
  size: number
  uploadedAt: string
}

interface SponsorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sponsor?: Sponsor
}

export const SponsorFormDialog = ({
  open,
  onOpenChange,
  sponsor,
}: SponsorFormDialogProps) => {
  const isEditing = !!sponsor
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [blobs, setBlobs] = useState<BlobItem[]>([])
  const [isLoadingBlobs, setIsLoadingBlobs] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SponsorInput>({
    resolver: zodResolver(sponsorSchema),
    defaultValues: {
      name: sponsor?.name ?? '',
      imageUrls: sponsor?.imageUrls ?? [],
      url: sponsor?.url ?? '',
      supportedSince: sponsor?.supportedSince
        ? new Date(sponsor.supportedSince).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    },
  })

  const imageUrls = watch('imageUrls')

  // Reset form values when the dialog opens or the sponsor changes
  useEffect(() => {
    if (open) {
      reset({
        name: sponsor?.name ?? '',
        imageUrls: sponsor?.imageUrls ?? [],
        url: sponsor?.url ?? '',
        supportedSince: sponsor?.supportedSince
          ? new Date(sponsor.supportedSince).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      })
    }
  }, [open, sponsor, reset])

  /** Fetch existing blobs from the sponsors/ folder. */
  const fetchBlobs = useCallback(async () => {
    setIsLoadingBlobs(true)
    try {
      const res = await fetch('/api/admin/blobs?folder=sponsors')
      if (!res.ok) throw new Error('Failed to fetch blobs')
      const data = (await res.json()) as { blobs: BlobItem[] }
      setBlobs(data.blobs)
    } catch (error) {
      console.error('Error fetching blobs:', error)
    } finally {
      setIsLoadingBlobs(false)
    }
  }, [])

  // Fetch blobs when the dialog opens
  useEffect(() => {
    if (open) {
      fetchBlobs()
    }
  }, [open, fetchBlobs])

  /** Upload one or more images to Vercel Blob and add them to the list. */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const newUrls: string[] = []

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'sponsors')

        const res = await fetch('/api/admin/blobs', {
          method: 'POST',
          body: formData,
        })

        const data = (await res.json()) as { url?: string; error?: string }

        if (!res.ok || !data.url) {
          toast.error(data.error ?? `Erreur lors de l'upload de ${file.name}.`)
          continue
        }

        newUrls.push(data.url)
      }

      if (newUrls.length > 0) {
        const label =
          newUrls.length === 1
            ? 'Image importée avec succès.'
            : `${newUrls.length.toString()} images importées avec succès.`
        toast.success(label)
        setValue('imageUrls', [...imageUrls, ...newUrls], {
          shouldDirty: true,
          shouldValidate: true,
        })
        await fetchBlobs()
      }
    } catch (error) {
      console.error('Error uploading sponsor images:', error)
      toast.error('Une erreur inattendue est survenue.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  /** Remove an image from the list by index. */
  const handleRemoveImage = (index: number) => {
    const updated = imageUrls.filter((_, i) => i !== index)
    setValue('imageUrls', updated, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  /** Move an image to a new position in the list. */
  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1
    if (target < 0 || target >= imageUrls.length) return

    const updated = [...imageUrls]
    const temp = updated[index]
    updated[index] = updated[target]
    updated[target] = temp
    setValue('imageUrls', updated, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  /** Set an image as principal (move to index 0). */
  const handleSetPrincipal = (index: number) => {
    if (index === 0) return
    const updated = [...imageUrls]
    const [moved] = updated.splice(index, 1)
    updated.unshift(moved)
    setValue('imageUrls', updated, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  /** Toggle an existing blob image in the selected images list. */
  const handleToggleBlob = (blobUrl: string) => {
    if (imageUrls.includes(blobUrl)) {
      setValue(
        'imageUrls',
        imageUrls.filter(u => u !== blobUrl),
        { shouldDirty: true, shouldValidate: true },
      )
    } else {
      setValue('imageUrls', [...imageUrls, blobUrl], {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }

  const onSubmit = (data: SponsorInput) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateSponsor({ ...data, id: sponsor.id })
        : await createSponsor(data)

      if (result.success) {
        toast.success(result.message)
        reset()
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-white/10 bg-zinc-950 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? 'Modifier le sponsor' : 'Ajouter un sponsor'}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {isEditing
              ? 'Modifiez les informations du sponsor.'
              : 'Remplissez les informations pour créer un nouveau sponsor.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Images */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400">
              Images *
            </Label>
            <p className="text-[11px] text-zinc-600">
              La première image est utilisée comme image principale sur le site.
              Réorganisez avec les flèches.
            </p>

            {/* Image grid */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {imageUrls.map((url, index) => (
                  <div key={url} className="group relative">
                    <div
                      className={cn(
                        'flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-white/5 transition-all',
                        index === 0
                          ? 'border-blue-500/40 ring-2 ring-blue-500/20'
                          : 'border-white/10',
                      )}
                    >
                      <Image
                        src={url}
                        alt={`Image ${(index + 1).toString()}`}
                        width={100}
                        height={100}
                        className="size-full object-contain p-1.5"
                      />
                    </div>

                    {/* Principal badge */}
                    {index === 0 && (
                      <span className="absolute -left-1.5 -top-1.5 flex items-center gap-0.5 rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                        <Crown className="size-2.5" />
                        Principal
                      </span>
                    )}

                    {/* Overlay controls — visible on hover */}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 rounded-b-lg bg-zinc-950/80 py-1 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      {/* Set as principal */}
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrincipal(index)}
                          title="Définir comme principal"
                          className="flex size-6 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-blue-500/20 hover:text-blue-400"
                        >
                          <Crown className="size-3" />
                        </button>
                      )}

                      {/* Move left */}
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveImage(index, 'left')}
                          title="Déplacer à gauche"
                          className="flex size-6 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <ArrowLeft className="size-3" />
                        </button>
                      )}

                      {/* Move right */}
                      {index < imageUrls.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveImage(index, 'right')}
                          title="Déplacer à droite"
                          className="flex size-6 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <ArrowRight className="size-3" />
                        </button>
                      )}

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        title="Supprimer"
                        className="flex size-6 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
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
              {isUploading ? 'Import en cours...' : 'Ajouter des images'}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleUpload}
            />

            {/* Existing images gallery */}
            <div className="space-y-2 rounded-xl border border-white/5 bg-white/2 p-3">
              <button
                type="button"
                onClick={() => setGalleryOpen(prev => !prev)}
                className="flex w-full items-center justify-between text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
              >
                <span>Images existantes</span>
                <ChevronDown
                  className={cn(
                    'size-4 transition-transform duration-200',
                    galleryOpen && 'rotate-180',
                  )}
                />
              </button>

              {galleryOpen &&
                (isLoadingBlobs ? (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {['s1', 's2', 's3', 's4', 's5'].map(key => (
                      <Skeleton
                        key={key}
                        className="aspect-square rounded-lg bg-white/5"
                      />
                    ))}
                  </div>
                ) : blobs.length === 0 ? (
                  <p className="py-2 text-center text-xs text-zinc-600">
                    Aucune image dans le dossier sponsors.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {blobs.map(blob => {
                      const isSelected = imageUrls.includes(blob.url)

                      return (
                        <button
                          key={blob.url}
                          type="button"
                          onClick={() => handleToggleBlob(blob.url)}
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
                            className="size-full object-contain p-1"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10">
                              <Check className="size-5 text-blue-400" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
            </div>

            {errors.imageUrls?.message && (
              <p className="text-xs text-red-400">{errors.imageUrls.message}</p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="sponsor-name"
              className="text-xs font-medium text-zinc-400"
            >
              Nom *
            </Label>
            <Input
              id="sponsor-name"
              placeholder="Nom du sponsor"
              className="h-10 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20"
              {...register('name')}
            />
            {errors.name?.message && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <Label
              htmlFor="sponsor-url"
              className="text-xs font-medium text-zinc-400"
            >
              Lien (optionnel)
            </Label>
            <Input
              id="sponsor-url"
              placeholder="https://sponsor.com"
              className="h-10 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20"
              {...register('url')}
            />
            {errors.url?.message && (
              <p className="text-xs text-red-400">{errors.url.message}</p>
            )}
          </div>

          {/* Supported Since */}
          <div className="space-y-1.5">
            <Label
              htmlFor="sponsor-supported-since"
              className="text-xs font-medium text-zinc-400"
            >
              Partenaire depuis
            </Label>
            <Input
              id="sponsor-supported-since"
              type="date"
              className="h-10 w-44 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20"
              {...register('supportedSince')}
            />
            {errors.supportedSince?.message && (
              <p className="text-xs text-red-400">
                {errors.supportedSince.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400 hover:text-white"
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
