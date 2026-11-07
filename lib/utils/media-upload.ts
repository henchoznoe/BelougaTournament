/**
 * File: lib/utils/media-upload.ts
 * Description: Uploads images independently so a failed file never discards successful imports.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export interface MediaUploadProgress {
  pending: boolean
  completed: number
  total: number
  errors: string[]
}

export const uploadImageFiles = async (
  files: File[],
  folder: string,
  onProgress: (progress: MediaUploadProgress) => void,
): Promise<string[]> => {
  const urls: string[] = []
  const errors: string[] = []
  onProgress({ pending: true, completed: 0, total: files.length, errors: [] })
  for (const [index, file] of files.entries()) {
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('folder', folder)
      const response = await fetch('/api/admin/blobs', { method: 'POST', body })
      const result = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !result.url)
        throw new Error(result.error ?? 'Import impossible.')
      urls.push(result.url)
    } catch (error) {
      errors.push(
        `${file.name} (image ${index + 1}) : ${error instanceof Error ? error.message : 'Import impossible.'}`,
      )
    }
    onProgress({
      pending: true,
      completed: index + 1,
      total: files.length,
      errors: [...errors],
    })
  }
  onProgress({
    pending: false,
    completed: files.length,
    total: files.length,
    errors,
  })
  return urls
}
