/**
 * File: components/admin/hooks/use-media-upload.ts
 * Description: Image uploads with per-file progress and retained partial successes.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { useState } from 'react'
import {
  type MediaUploadProgress,
  uploadImageFiles,
} from '@/lib/utils/media-upload'

export const useMediaUpload = () => {
  const [progress, setProgress] = useState<MediaUploadProgress>({
    pending: false,
    completed: 0,
    total: 0,
    errors: [],
  })
  const upload = (files: File[], folder: string) =>
    uploadImageFiles(files, folder, setProgress)
  return { progress, upload }
}
