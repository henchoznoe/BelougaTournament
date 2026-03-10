/**
 * File: tests/api/blobs.test.ts
 * Description: Unit tests for the Vercel Blob upload/list/delete API route (SUPERADMIN only).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('server-only', () => ({}))

const mockGetSession = vi.fn()
vi.mock('@/lib/core/auth', () => ({
  default: {
    api: { getSession: (...args: unknown[]) => mockGetSession(...args) },
  },
}))

vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockList = vi.fn()
const mockPut = vi.fn()
const mockDel = vi.fn()
vi.mock('@vercel/blob', () => ({
  list: (...args: unknown[]) => mockList(...args),
  put: (...args: unknown[]) => mockPut(...args),
  del: (...args: unknown[]) => mockDel(...args),
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { GET, POST, DELETE } = await import('@/app/api/admin/blobs/route')

// ---------------------------------------------------------------------------
// Session fixtures
// ---------------------------------------------------------------------------

const SUPERADMIN_SESSION = {
  user: {
    id: 'sa-1',
    email: 'super@test.com',
    name: 'Super Admin',
    role: Role.SUPERADMIN,
  },
  session: {
    id: 's1',
    userId: 'sa-1',
    token: 'tok',
    expiresAt: new Date().toISOString(),
  },
}

const ADMIN_SESSION = {
  user: {
    id: 'admin-1',
    email: 'admin@test.com',
    name: 'Admin',
    role: Role.ADMIN,
  },
  session: {
    id: 's2',
    userId: 'admin-1',
    token: 'tok2',
    expiresAt: new Date().toISOString(),
  },
}

const USER_SESSION = {
  user: {
    id: 'user-1',
    email: 'user@test.com',
    name: 'User',
    role: Role.USER,
  },
  session: {
    id: 's3',
    userId: 'user-1',
    token: 'tok3',
    expiresAt: new Date().toISOString(),
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeGetRequest = (folder?: string) => {
  const url = folder
    ? `http://localhost:3000/api/admin/blobs?folder=${folder}`
    : 'http://localhost:3000/api/admin/blobs'
  return new Request(url, { method: 'GET' })
}

const makePostRequest = (body: FormData) =>
  new Request('http://localhost:3000/api/admin/blobs', {
    method: 'POST',
    body,
  })

const makeDeleteRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost:3000/api/admin/blobs', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const createFile = (name: string, type: string, sizeBytes = 100): File => {
  const buffer = new Uint8Array(sizeBytes)
  return new File([buffer], name, { type })
}

// ===========================================================================
// GET
// ===========================================================================

describe('GET /api/admin/blobs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockList.mockResolvedValue({ blobs: [] })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const response = await GET(makeGetRequest())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 401 for ADMIN role', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)

    const response = await GET(makeGetRequest())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 401 for USER role', async () => {
    mockGetSession.mockResolvedValue(USER_SESSION)

    const response = await GET(makeGetRequest())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
  })

  it('lists all blobs when no folder specified', async () => {
    const mockBlobs = [{ url: 'https://blob.vercel.com/test.png' }]
    mockList.mockResolvedValue({ blobs: mockBlobs })

    const response = await GET(makeGetRequest())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ blobs: mockBlobs })
    expect(mockList).toHaveBeenCalledWith({ prefix: undefined })
  })

  it('lists blobs with valid folder prefix', async () => {
    const mockBlobs = [{ url: 'https://blob.vercel.com/logos/logo.png' }]
    mockList.mockResolvedValue({ blobs: mockBlobs })

    const response = await GET(makeGetRequest('logos'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ blobs: mockBlobs })
    expect(mockList).toHaveBeenCalledWith({ prefix: 'logos/' })
  })

  it('lists blobs with sponsors folder prefix', async () => {
    mockList.mockResolvedValue({ blobs: [] })

    const response = await GET(makeGetRequest('sponsors'))

    expect(response.status).toBe(200)
    expect(mockList).toHaveBeenCalledWith({ prefix: 'sponsors/' })
  })

  it('ignores invalid folder and lists all blobs', async () => {
    mockList.mockResolvedValue({ blobs: [] })

    const response = await GET(makeGetRequest('malicious'))

    expect(response.status).toBe(200)
    expect(mockList).toHaveBeenCalledWith({ prefix: undefined })
  })

  it('returns 500 when list throws', async () => {
    mockList.mockRejectedValue(new Error('Blob service error'))

    const response = await GET(makeGetRequest())

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: 'Erreur lors de la récupération des fichiers.',
    })
  })
})

// ===========================================================================
// POST
// ===========================================================================

describe('POST /api/admin/blobs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockPut.mockResolvedValue({ url: 'https://blob.vercel.com/test.png' })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const formData = new FormData()
    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 401 for ADMIN role', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)

    const formData = new FormData()
    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 400 when no file is provided', async () => {
    const formData = new FormData()

    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Aucun fichier fourni.',
    })
  })

  it('returns 400 when file field is a string instead of File', async () => {
    const formData = new FormData()
    formData.append('file', 'not-a-file')

    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Aucun fichier fourni.',
    })
  })

  it('returns 400 for unsupported file type', async () => {
    const formData = new FormData()
    formData.append('file', createFile('doc.pdf', 'application/pdf'))

    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Format non supporté. Utilisez PNG, JPEG ou WebP.',
    })
  })

  it('returns 400 for SVG file type', async () => {
    const formData = new FormData()
    formData.append('file', createFile('icon.svg', 'image/svg+xml'))

    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Format non supporté. Utilisez PNG, JPEG ou WebP.',
    })
  })

  it('returns 400 when file exceeds 5 MB', async () => {
    const formData = new FormData()
    formData.append('file', createFile('big.png', 'image/png', 6 * 1024 * 1024))

    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Le fichier dépasse la taille maximale de 5 Mo.',
    })
  })

  it('uploads file with valid folder prefix', async () => {
    const file = createFile('logo.png', 'image/png')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'sponsors')

    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      url: 'https://blob.vercel.com/test.png',
    })
    expect(mockPut).toHaveBeenCalledWith(
      'sponsors/logo.png',
      expect.any(File),
      {
        access: 'public',
        addRandomSuffix: true,
      },
    )
  })

  it('uploads file without folder prefix when folder not provided', async () => {
    const file = createFile('image.webp', 'image/webp')
    const formData = new FormData()
    formData.append('file', file)

    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(200)
    expect(mockPut).toHaveBeenCalledWith('image.webp', expect.any(File), {
      access: 'public',
      addRandomSuffix: true,
    })
  })

  it('ignores invalid folder and uses bare filename', async () => {
    const file = createFile('pic.jpeg', 'image/jpeg')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'malicious')

    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(200)
    expect(mockPut).toHaveBeenCalledWith('pic.jpeg', expect.any(File), {
      access: 'public',
      addRandomSuffix: true,
    })
  })

  it('accepts all allowed image types', async () => {
    const types = [
      { name: 'a.png', type: 'image/png' },
      { name: 'b.jpg', type: 'image/jpeg' },
      { name: 'c.webp', type: 'image/webp' },
    ]

    for (const { name, type } of types) {
      vi.clearAllMocks()
      mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
      mockPut.mockResolvedValue({ url: `https://blob.vercel.com/${name}` })

      const formData = new FormData()
      formData.append('file', createFile(name, type))

      const response = await POST(makePostRequest(formData))
      expect(response.status).toBe(200)
    }
  })

  it('returns 500 when put throws', async () => {
    mockPut.mockRejectedValue(new Error('Upload failed'))

    const file = createFile('test.png', 'image/png')
    const formData = new FormData()
    formData.append('file', file)

    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: "Erreur lors de l'upload du fichier.",
    })
  })
})

// ===========================================================================
// DELETE
// ===========================================================================

describe('DELETE /api/admin/blobs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockDel.mockResolvedValue(undefined)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const response = await DELETE(
      makeDeleteRequest({
        url: 'https://abc123.public.blob.vercel-storage.com/test.png',
      }),
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 401 for USER role', async () => {
    mockGetSession.mockResolvedValue(USER_SESSION)

    const response = await DELETE(
      makeDeleteRequest({
        url: 'https://abc123.public.blob.vercel-storage.com/test.png',
      }),
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 400 when url is missing', async () => {
    const response = await DELETE(makeDeleteRequest({}))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'URL du fichier manquante ou invalide.',
    })
  })

  it('returns 400 when url is empty string', async () => {
    const response = await DELETE(makeDeleteRequest({ url: '' }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'URL du fichier manquante ou invalide.',
    })
  })

  it('deletes blob successfully', async () => {
    const blobUrl = 'https://abc123.public.blob.vercel-storage.com/test.png'

    const response = await DELETE(makeDeleteRequest({ url: blobUrl }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    expect(mockDel).toHaveBeenCalledWith(blobUrl)
  })

  it('returns 400 when URL does not belong to Vercel Blob store', async () => {
    const response = await DELETE(
      makeDeleteRequest({ url: 'https://evil.com/steal-data' }),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'URL invalide.' })
    expect(mockDel).not.toHaveBeenCalled()
  })

  it('returns 400 when URL uses http instead of https', async () => {
    const response = await DELETE(
      makeDeleteRequest({
        url: 'http://abc123.public.blob.vercel-storage.com/test.png',
      }),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'URL invalide.' })
    expect(mockDel).not.toHaveBeenCalled()
  })

  it('returns 400 when URL is malformed', async () => {
    const response = await DELETE(makeDeleteRequest({ url: 'not-a-url' }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'URL du fichier manquante ou invalide.',
    })
    expect(mockDel).not.toHaveBeenCalled()
  })

  it('returns 500 when del throws', async () => {
    mockDel.mockRejectedValue(new Error('Delete failed'))

    const response = await DELETE(
      makeDeleteRequest({
        url: 'https://abc123.public.blob.vercel-storage.com/test.png',
      }),
    )

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: 'Erreur lors de la suppression du fichier.',
    })
  })

  it('returns 500 when request body is invalid JSON', async () => {
    const request = new Request('http://localhost:3000/api/admin/blobs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })

    const response = await DELETE(request)

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: 'Erreur lors de la suppression du fichier.',
    })
  })
})
