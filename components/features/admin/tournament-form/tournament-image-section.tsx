/**
 * File: components/features/admin/tournament-form/tournament-image-section.tsx
 * Description: Image upload section for the tournament form, using Vercel Blob storage.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Check, ImagePlus, Loader2, Trash2, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'
import type { TournamentFormInput } from '@/lib/validations/tournaments'

interface BlobItem {
  url: string
  pathname: string
  size: number
  uploadedAt: string
}

interface TournamentImageSectionProps {
  form: UseFormReturn<TournamentFormInput>
  isPending: boolean
}

export const TournamentImageSection = ({
  form,
  isPending,
}: TournamentImageSectionProps) => {
  const [blobs, setBlobs] = useState<BlobItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const value = form.watch('imageUrl')

  const onChange = useCallback(
    (url: string) => {
      form.setValue('imageUrl', url, { shouldDirty: true })
    },
    [form],
  )

  /** Fetch all tournament blobs from the store. */
  const fetchBlobs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/blobs?folder=tournaments')
      if (!res.ok) throw new Error('Failed to fetch blobs')
      const data = (await res.json()) as { blobs: BlobItem[] }
      setBlobs(data.blobs)
    } catch (error) {
      console.error('Error fetching blobs:', error)
      toast.error('Erreur lors du chargement des images.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBlobs()
  }, [fetchBlobs])

  /** Upload a file to Vercel Blob. */
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

      toast.success('Image importee avec succes.')
      onChange(data.url)
      await fetchBlobs()
    } catch (error) {
      console.error('Error uploading tournament image:', error)
      toast.error('Une erreur inattendue est survenue.')
    } finally {
      setIsUploading(false)
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  /** Delete a blob from the store. */
  const handleDelete = async (url: string) => {
    setDeletingUrl(url)
    try {
      const res = await fetch('/api/admin/blobs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (!res.ok) {
        toast.error('Erreur lors de la suppression.')
        return
      }

      toast.success('Image supprimee.')
      // If the deleted blob was the selected image, clear the selection
      if (value === url) onChange('')
      setBlobs(prev => prev.filter(b => b.url !== url))
    } catch (error) {
      console.error('Error deleting blob:', error)
      toast.error('Une erreur inattendue est survenue.')
    } finally {
      setDeletingUrl(null)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
        Image du tournoi
      </h3>

      {/* Current selection preview + upload */}
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
          {value ? (
            <Image
              src={value}
              alt="Image du tournoi"
              width={160}
              height={96}
              className="size-full object-cover"
            />
          ) : (
            <ImagePlus className="size-8 text-zinc-600" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          {/* Upload button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading || isPending}
            className="gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            {isUploading ? 'Import en cours...' : 'Importer une image'}
          </Button>

          {/* Clear selection */}
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              className="gap-2 text-zinc-500 hover:text-zinc-300"
              onClick={() => onChange('')}
            >
              <X className="size-4" />
              Retirer l'image
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Gallery of existing blobs */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-500">Images disponibles</p>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={`skeleton-${i.toString()}`}
                className="aspect-video rounded-lg bg-white/5"
              />
            ))}
          </div>
        ) : blobs.length === 0 ? (
          <p className="text-xs text-zinc-600">
            Aucune image uploadee. Importez votre premiere image ci-dessus.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {blobs.map(blob => {
              const isSelected = value === blob.url
              const isDeleting = deletingUrl === blob.url

              return (
                <div key={blob.url} className="group relative">
                  <button
                    type="button"
                    onClick={() => onChange(blob.url)}
                    aria-label={`Selectionner ${blob.pathname}`}
                    className={cn(
                      'relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border bg-white/5 transition-all duration-200',
                      isSelected
                        ? 'border-blue-500/50 ring-2 ring-blue-500/20'
                        : 'border-white/10 hover:border-white/20',
                    )}
                  >
                    <Image
                      src={blob.url}
                      alt={blob.pathname}
                      width={200}
                      height={112}
                      className="size-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10">
                        <Check className="size-5 text-blue-400" />
                      </div>
                    )}
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      handleDelete(blob.url)
                    }}
                    disabled={isDeleting}
                    aria-label={`Supprimer ${blob.pathname}`}
                    className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border border-white/10 bg-zinc-900 text-zinc-400 opacity-0 transition-opacity hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                  >
                    {isDeleting ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Trash2 className="size-3" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
