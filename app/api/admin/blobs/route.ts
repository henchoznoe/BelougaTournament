/**
 * File: app/api/admin/blobs/route.ts
 * Description: API route for managing Vercel Blob uploads.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { del, list, put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { MAX_ADMIN_UPLOAD_SIZE } from '@/lib/config/constants'
import { logger } from '@/lib/core/logger'
import {
  isAllowedImageMimeType,
  verifyImageMagicBytes,
} from '@/lib/utils/image-magic'
import { verifyAdmin } from '@/lib/utils/verify-admin'

const ALLOWED_FOLDER_ROOTS = ['logos', 'sponsors', 'tournaments'] as const
const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com'
const INVALID_FOLDER_ERROR = 'Dossier invalide.'

/**
 * Matches a folder path of the form `root` or `root/sub[/sub...]` where every
 * segment is [a-z0-9_-]+. This rejects empty segments (double slashes), any
 * `.` / `..` traversal, backslashes, and Windows-style paths. The root must
 * be one of `ALLOWED_FOLDER_ROOTS`.
 */
const ALLOWED_FOLDER_REGEX = new RegExp(
  `^(${ALLOWED_FOLDER_ROOTS.join('|')})(?:/[a-z0-9_-]+)*$`,
)

/** Validates that a URL belongs to the app's Vercel Blob store. */
const isValidBlobUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'https:' && parsed.hostname.endsWith(BLOB_HOST_SUFFIX)
    )
  } catch {
    return false
  }
}

/** Checks whether a folder path is an allowed whitelist entry with safe segments only. */
const isAllowedFolder = (folder: string): boolean =>
  ALLOWED_FOLDER_REGEX.test(folder)

/** Validates an optional folder input and normalizes absence to null. */
const parseFolderInput = (
  folder: FormDataEntryValue | string | null,
):
  | { success: true; folder: string | null }
  | { success: false; error: string } => {
  if (folder === null) {
    return { success: true, folder: null }
  }

  if (typeof folder !== 'string' || !isAllowedFolder(folder)) {
    return { success: false, error: INVALID_FOLDER_ERROR }
  }

  return { success: true, folder }
}

/** GET — List blobs, optionally filtered by folder prefix. */
export const GET = async (request: Request) => {
  const session = await verifyAdmin(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const parsedFolder = parseFolderInput(searchParams.get('folder'))

    if (!parsedFolder.success) {
      return NextResponse.json({ error: parsedFolder.error }, { status: 400 })
    }

    const prefix = parsedFolder.folder ? `${parsedFolder.folder}/` : undefined
    const { blobs } = await list({ prefix })
    return NextResponse.json({ blobs })
  } catch (error) {
    logger.error({ error }, 'Error listing blobs')
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des fichiers.' },
      { status: 500 },
    )
  }
}

/** POST — Upload a file to Vercel Blob. Expects FormData with a "file" field and optional "folder" field. */
export const POST = async (request: Request) => {
  const session = await verifyAdmin(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const parsedFolder = parseFolderInput(formData.get('folder'))

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni.' },
        { status: 400 },
      )
    }

    if (!parsedFolder.success) {
      return NextResponse.json({ error: parsedFolder.error }, { status: 400 })
    }

    if (!isAllowedImageMimeType(file.type)) {
      return NextResponse.json(
        { error: 'Format non supporté. Utilisez PNG, JPEG ou WebP.' },
        { status: 400 },
      )
    }

    if (file.size > MAX_ADMIN_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: 'Le fichier dépasse la taille maximale de 5 Mo.' },
        { status: 400 },
      )
    }

    // Guard against spoofed Content-Type: the browser-declared MIME cannot be
    // trusted, so we confirm the magic bytes match the declared image format.
    if (!(await verifyImageMagicBytes(file, file.type))) {
      return NextResponse.json(
        { error: 'Le fichier ne correspond pas à un format image valide.' },
        { status: 400 },
      )
    }

    // Sanitize filename: keep only safe characters, collapse separators
    const sanitizedName =
      file.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'file'

    // Build the pathname with optional folder prefix
    const pathname =
      parsedFolder.folder !== null
        ? `${parsedFolder.folder}/${sanitizedName}`
        : sanitizedName

    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: true,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    logger.error({ error }, 'Error uploading blob')
    return NextResponse.json(
      { error: "Erreur lors de l'upload du fichier." },
      { status: 500 },
    )
  }
}

/** Schema for blob DELETE request body. */
const deleteBlobSchema = z.object({
  url: z.url('URL du fichier invalide.'),
})

/** DELETE — Remove a blob by URL. Expects JSON body with { url: string }. */
export const DELETE = async (request: Request) => {
  const session = await verifyAdmin(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const parsed = deleteBlobSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'URL du fichier manquante ou invalide.' },
        { status: 400 },
      )
    }

    if (!isValidBlobUrl(parsed.data.url)) {
      return NextResponse.json({ error: 'URL invalide.' }, { status: 400 })
    }

    await del(parsed.data.url)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Error deleting blob')
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du fichier.' },
      { status: 500 },
    )
  }
}
