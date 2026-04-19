/**
 * File: components/admin/hooks/use-blob-list.ts
 * Description: Hook for fetching and refreshing a Vercel Blob folder listing.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface BlobItem {
  url: string
  pathname: string
  size: number
  uploadedAt: string
}

interface UseBlobListResult {
  blobs: BlobItem[]
  isLoadingBlobs: boolean
  refetchBlobs: () => Promise<void>
}

/** Fetches a Vercel Blob folder listing and keeps it in local state. */
export const useBlobList = (folder: string): UseBlobListResult => {
  const [blobs, setBlobs] = useState<BlobItem[]>([])
  const [isLoadingBlobs, setIsLoadingBlobs] = useState(true)

  const refetchBlobs = useCallback(async (): Promise<void> => {
    setIsLoadingBlobs(true)
    try {
      const res = await fetch(`/api/admin/blobs?folder=${folder}`)
      if (!res.ok) throw new Error('Failed to fetch blobs')
      const data = (await res.json()) as { blobs: BlobItem[] }
      setBlobs(data.blobs)
    } catch (error) {
      console.error('Error fetching blobs:', error)
      toast.error('Erreur lors du chargement des images.')
    } finally {
      setIsLoadingBlobs(false)
    }
  }, [folder])

  useEffect(() => {
    refetchBlobs()
  }, [refetchBlobs])

  return { blobs, isLoadingBlobs, refetchBlobs }
}
