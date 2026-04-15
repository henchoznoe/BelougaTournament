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
import auth from '@/lib/core/auth'
import { logger } from '@/lib/core/logger'
import { Role } from '@/prisma/generated/prisma/enums'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const ALLOWED_FOLDERS = new Set(['logos', 'sponsors', 'tournaments'])
const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com'

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

/** Verifies that the request comes from an authenticated admin. */
const verifyAdmin = async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return null
  }
  return session
}

/** GET — List blobs, optionally filtered by folder prefix. */
export const GET = async (request: Request) => {
  const session = await verifyAdmin(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder')

    const prefix =
      folder && ALLOWED_FOLDERS.has(folder) ? `${folder}/` : undefined
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
    const folder = formData.get('folder')

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni.' },
        { status: 400 },
      )
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Format non supporté. Utilisez PNG, JPEG ou WebP.' },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Le fichier dépasse la taille maximale de 5 Mo.' },
        { status: 400 },
      )
    }

    // Build the pathname with optional folder prefix
    const pathname =
      typeof folder === 'string' && ALLOWED_FOLDERS.has(folder)
        ? `${folder}/${file.name}`
        : file.name

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
