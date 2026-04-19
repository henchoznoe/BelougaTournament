/**
 * File: components/admin/forms/tournament-form-images.tsx
 * Description: Images and media section of the tournament form (upload, gallery, stream URL).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ChevronDown, ImagePlus, Loader2, Trophy, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form'
import { toast } from 'sonner'
import type {
  BlobItem,
  TournamentFormValues,
} from '@/components/admin/forms/tournament-form-types'
import {
  INPUT_CLASSES,
  LABEL_CLASSES,
  SECTION_CLASSES,
  SectionHeader,
} from '@/components/admin/forms/tournament-form-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'

interface TournamentFormImagesProps {
  register: UseFormRegister<TournamentFormValues>
  errors: FieldErrors<TournamentFormValues>
  setValue: UseFormSetValue<TournamentFormValues>
  watchImageUrls: string[]
  watchSlug: string
}

export const TournamentFormImages = ({
  register,
  errors,
  setValue,
  watchImageUrls,
  watchSlug,
}: TournamentFormImagesProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [blobs, setBlobs] = useState<BlobItem[]>([])
  const [isLoadingBlobs, setIsLoadingBlobs] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      const newUrls: string[] = []
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        const folder = watchSlug
          ? `tournaments/${watchSlug}/images`
          : 'tournaments'
        formData.append('folder', folder)

        const res = await fetch('/api/admin/blobs', {
          method: 'POST',
          body: formData,
        })
        const data = (await res.json()) as { url?: string; error?: string }

        if (!res.ok || !data.url) {
          toast.error(data.error ?? "Erreur lors de l'upload.")
          continue
        }
        newUrls.push(data.url)
      }

      if (newUrls.length > 0) {
        toast.success(`${newUrls.length} image(s) importée(s) avec succès.`)
        setValue('imageUrls', [...watchImageUrls, ...newUrls], {
          shouldDirty: true,
          shouldValidate: true,
        })
      }
      await fetchBlobs()
    } catch (error) {
      console.error('Error uploading tournament image:', error)
      toast.error('Une erreur inattendue est survenue.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className={SECTION_CLASSES}>
      <SectionHeader icon={ImagePlus} title="Images et médias" />
      <div className="space-y-4">
        {/* Selected images grid */}
        {watchImageUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {watchImageUrls.map((url, index) => (
              <div
                key={url}
                className={cn(
                  'group relative aspect-square overflow-hidden rounded-lg border bg-white/5',
                  index === 0
                    ? 'border-blue-500/50 ring-2 ring-blue-500/20'
                    : 'border-white/10',
                )}
              >
                <Image
                  src={url}
                  alt={`Image ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {index === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-blue-500/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Principale
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Définir comme principale"
                      className="text-white hover:bg-white/20"
                      onClick={() => {
                        const updated = [...watchImageUrls]
                        const [item] = updated.splice(index, 1)
                        updated.unshift(item)
                        setValue('imageUrls', updated, { shouldDirty: true })
                      }}
                    >
                      <Trophy className="size-3" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Retirer l'image"
                    className="text-red-400 hover:bg-red-500/20"
                    onClick={() => {
                      setValue(
                        'imageUrls',
                        watchImageUrls.filter((_, i) => i !== index),
                        { shouldDirty: true },
                      )
                    }}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
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
            {isUploading ? 'Import en cours...' : 'Uploader des images'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            aria-label="Sélectionner des images à uploader"
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
                  const isSelected = watchImageUrls.includes(blob.url)
                  return (
                    <button
                      key={blob.url}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setValue(
                            'imageUrls',
                            watchImageUrls.filter(u => u !== blob.url),
                            { shouldDirty: true, shouldValidate: true },
                          )
                        } else {
                          setValue('imageUrls', [...watchImageUrls, blob.url], {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      }}
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

        {errors.imageUrls?.message && (
          <p className="text-xs text-red-400">{errors.imageUrls.message}</p>
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
  )
}
