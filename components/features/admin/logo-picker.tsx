/**
 * File: components/features/admin/logo-picker.tsx
 * Description: Logo picker with Vercel Blob multi-upload and compact gallery of existing images.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Check, ImagePlus, Loader2, Trash2, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'

interface BlobItem {
  url: string
  pathname: string
  size: number
  uploadedAt: string
}

interface LogoPickerProps {
  value: string
  onChange: (url: string) => void
}

export const LogoPicker = ({ value, onChange }: LogoPickerProps) => {
  const [blobs, setBlobs] = useState<BlobItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingCount, setUploadingCount] = useState(0)
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isUploading = uploadingCount > 0

  /** Fetch all blobs from the store. */
  const fetchBlobs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/blobs?folder=logos')
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

  /** Upload a single file to Vercel Blob. */
  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'logos')

    const res = await fetch('/api/admin/blobs', {
      method: 'POST',
      body: formData,
    })

    const data = (await res.json()) as { url?: string; error?: string }

    if (!res.ok || !data.url) {
      toast.error(data.error ?? `Erreur lors de l'upload de ${file.name}.`)
      return null
    }

    return data.url
  }

  /** Handle file selection — supports multiple files. */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    setUploadingCount(fileArray.length)

    let lastUploadedUrl: string | null = null
    let successCount = 0

    for (const file of fileArray) {
      try {
        const url = await uploadFile(file)
        if (url) {
          lastUploadedUrl = url
          successCount++
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        toast.error(`Erreur lors de l'upload de ${file.name}.`)
      }
      setUploadingCount(prev => prev - 1)
    }

    if (successCount > 0) {
      const msg =
        successCount === 1
          ? 'Image importée avec succès.'
          : `${successCount.toString()} images importées avec succès.`
      toast.success(msg)
      if (lastUploadedUrl) onChange(lastUploadedUrl)
      await fetchBlobs()
    }

    // Reset file input so the same files can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
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

      toast.success('Image supprimée.')
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
    <div className="space-y-5">
      {/* Current logo preview + actions */}
      <div className="flex items-start gap-5">
        {/* Preview */}
        <div
          className={cn(
            'flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors',
            value
              ? 'border-blue-500/30 bg-blue-500/5'
              : 'border-white/10 bg-white/3',
          )}
        >
          {value ? (
            <Image
              src={value}
              alt="Logo actuel"
              width={96}
              height={96}
              className="size-full object-contain p-2"
            />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <ImagePlus className="size-6 text-zinc-600" />
              <span className="text-[10px] text-zinc-600">Aucun</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            className="cursor-pointer gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Upload className="size-3.5" />
            )}
            {isUploading
              ? `Import en cours (${uploadingCount.toString()})...`
              : 'Importer des logos'}
          </Button>

          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer justify-center gap-2 text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
              onClick={() => onChange('')}
            >
              <X className="size-3.5" />
              Retirer le logo actuel
            </Button>
          )}

          <p className="text-[10px] leading-relaxed text-zinc-600">
            PNG, JPEG ou WebP. Préférez un logo carré.
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={handleUpload}
      />

      {/* Gallery */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
            Galerie{!isLoading && ` · ${blobs.length.toString()}`}
          </span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton
                key={`skeleton-${i.toString()}`}
                className="size-16 rounded-lg bg-white/5"
              />
            ))}
          </div>
        ) : blobs.length === 0 ? (
          <p className="py-2 text-center text-xs text-zinc-600">
            Aucun logo importé pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {blobs.map(blob => {
              const isSelected = value === blob.url
              const isDeleting = deletingUrl === blob.url

              return (
                <div key={blob.url} className="group relative">
                  <button
                    type="button"
                    onClick={() => onChange(blob.url)}
                    aria-label={`Sélectionner ${blob.pathname}`}
                    className={cn(
                      'relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border transition-all',
                      isSelected
                        ? 'border-blue-500/50 bg-blue-500/10 ring-2 ring-blue-500/20'
                        : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5',
                    )}
                  >
                    <Image
                      src={blob.url}
                      alt={blob.pathname}
                      width={64}
                      height={64}
                      className="size-full object-contain p-1.5"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-500/15">
                        <Check className="size-4 text-blue-400" />
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
