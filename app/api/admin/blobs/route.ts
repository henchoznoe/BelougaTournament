/**
 * File: app/api/admin/blobs/route.ts
 * Description: API route for managing Vercel Blob uploads (SUPERADMIN only).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { del, list, put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import auth from '@/lib/core/auth'
import { Role } from '@/prisma/generated/prisma/enums'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
])
const ALLOWED_FOLDERS = new Set(['logos', 'sponsors'])

/** Verifies that the request comes from an authenticated SUPERADMIN. */
const verifySuperAdmin = async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user || session.user.role !== Role.SUPERADMIN) {
    return null
  }
  return session
}

/** GET — List blobs, optionally filtered by folder prefix. */
export const GET = async (request: Request) => {
  const session = await verifySuperAdmin(request)
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
    console.error('Error listing blobs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des fichiers.' },
      { status: 500 },
    )
  }
}

/** POST — Upload a file to Vercel Blob. Expects FormData with a "file" field and optional "folder" field. */
export const POST = async (request: Request) => {
  const session = await verifySuperAdmin(request)
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
        { error: 'Format non supporté. Utilisez PNG, JPEG, WebP ou SVG.' },
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
    console.error('Error uploading blob:', error)
    return NextResponse.json(
      { error: "Erreur lors de l'upload du fichier." },
      { status: 500 },
    )
  }
}

/** DELETE — Remove a blob by URL. Expects JSON body with { url: string }. */
export const DELETE = async (request: Request) => {
  const session = await verifySuperAdmin(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { url } = (await request.json()) as { url: string }

    if (!url) {
      return NextResponse.json(
        { error: 'URL du fichier manquante.' },
        { status: 400 },
      )
    }

    await del(url)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blob:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du fichier.' },
      { status: 500 },
    )
  }
}
