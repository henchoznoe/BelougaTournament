/**
 * File: tests/api/blobs.test.ts
 * Description: Unit tests for the Vercel Blob upload/list/delete API route.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_ADMIN_UPLOAD_SIZE } from '@/lib/config/constants'
import { Role } from '@/prisma/generated/prisma/enums'

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

const { GET, POST, DELETE } = await import('@/app/api/admin/blobs/route')

const ADMIN_SESSION = {
  user: {
    id: 'admin-1',
    email: 'admin@test.com',
    name: 'Admin',
    role: Role.ADMIN,
  },
  session: {
    id: 's1',
    userId: 'admin-1',
    token: 'tok',
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
    id: 's2',
    userId: 'user-1',
    token: 'tok2',
    expiresAt: new Date().toISOString(),
  },
}

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

const MAGIC_BYTES: Record<string, number[]> = {
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'image/jpeg': [0xff, 0xd8, 0xff, 0xe0],
  'image/webp': [
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  ],
}

const createFile = (name: string, type: string, sizeBytes = 100): File => {
  const buffer = new Uint8Array(sizeBytes)
  const header = MAGIC_BYTES[type]
  if (header) {
    buffer.set(header, 0)
  }
  return new File([buffer], name, { type })
}

const createInvalidImageFile = (name: string, type: string): File => {
  const buffer = new Uint8Array([0x00, 0x01, 0x02, 0x03])
  return new File([buffer], name, { type })
}

describe('GET /api/admin/blobs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockList.mockResolvedValue({ blobs: [] })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const response = await GET(makeGetRequest())

    expect(response.status).toBe(401)
  })

  it('returns 401 for USER role', async () => {
    mockGetSession.mockResolvedValue(USER_SESSION)

    const response = await GET(makeGetRequest())

    expect(response.status).toBe(401)
  })

  it('lists blobs with a valid folder prefix for admins', async () => {
    mockList.mockResolvedValue({
      blobs: [{ url: 'https://blob.vercel.com/logos/logo.png' }],
    })

    const response = await GET(makeGetRequest('logos'))

    expect(response.status).toBe(200)
    expect(mockList).toHaveBeenCalledWith({ prefix: 'logos/' })
  })

  it('lists blobs without a prefix when no folder is provided', async () => {
    const response = await GET(makeGetRequest())

    expect(response.status).toBe(200)
    expect(mockList).toHaveBeenCalledWith({ prefix: undefined })
  })

  it('rejects invalid folder filters instead of listing all blobs', async () => {
    const response = await GET(makeGetRequest('../secrets'))

    expect(response.status).toBe(400)
    expect(mockList).not.toHaveBeenCalled()
  })

  it('returns 500 when blob listing fails', async () => {
    mockList.mockRejectedValue(new Error('blob list failed'))

    const response = await GET(makeGetRequest('logos'))

    expect(response.status).toBe(500)
  })
})

describe('POST /api/admin/blobs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockPut.mockResolvedValue({ url: 'https://blob.vercel.com/test.png' })
  })

  it('returns 400 when no file is provided', async () => {
    const response = await POST(makePostRequest(new FormData()))

    expect(response.status).toBe(400)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const response = await POST(makePostRequest(new FormData()))

    expect(response.status).toBe(401)
  })

  it('returns 400 for unsupported file type', async () => {
    const formData = new FormData()
    formData.set('file', createFile('logo.svg', 'image/svg+xml'))

    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(400)
  })

  it('returns 400 when the file exceeds the maximum upload size', async () => {
    const formData = new FormData()
    formData.set(
      'file',
      createFile('large.png', 'image/png', MAX_ADMIN_UPLOAD_SIZE + 1),
    )

    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(400)
    expect(mockPut).not.toHaveBeenCalled()
  })

  it('returns 400 when the image magic bytes do not match the declared mime type', async () => {
    const formData = new FormData()
    formData.set('file', createInvalidImageFile('spoofed.png', 'image/png'))

    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(400)
    expect(mockPut).not.toHaveBeenCalled()
  })

  it('uploads a valid file for admins', async () => {
    const formData = new FormData()
    formData.set('file', createFile('logo.png', 'image/png'))
    formData.set('folder', 'logos')

    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(200)
    expect(mockPut).toHaveBeenCalledWith(
      'logos/logo.png',
      expect.any(File),
      expect.objectContaining({ access: 'public', addRandomSuffix: true }),
    )
  })

  it('uploads to the blob root with a sanitized fallback filename when no folder is provided', async () => {
    const formData = new FormData()
    formData.set('file', createFile('!!!', 'image/png'))

    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(200)
    expect(mockPut).toHaveBeenCalledWith(
      'file',
      expect.any(File),
      expect.objectContaining({ access: 'public', addRandomSuffix: true }),
    )
  })

  it('rejects invalid upload folders instead of writing to the blob root', async () => {
    const formData = new FormData()
    formData.set('file', createFile('logo.png', 'image/png'))
    formData.set('folder', '../secrets')

    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(400)
    expect(mockPut).not.toHaveBeenCalled()
  })

  it('returns 500 when the blob upload fails', async () => {
    mockPut.mockRejectedValue(new Error('blob upload failed'))

    const formData = new FormData()
    formData.set('file', createFile('logo.png', 'image/png'))
    formData.set('folder', 'logos')

    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(500)
  })
})

describe('DELETE /api/admin/blobs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockDel.mockResolvedValue(undefined)
  })

  it('returns 400 for invalid URLs', async () => {
    const response = await DELETE(
      makeDeleteRequest({ url: 'https://example.com/file.png' }),
    )

    expect(response.status).toBe(400)
  })

  it('returns 400 for non-https blob URLs', async () => {
    const response = await DELETE(
      makeDeleteRequest({
        url: 'http://foo.public.blob.vercel-storage.com/file.png',
      }),
    )

    expect(response.status).toBe(400)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const response = await DELETE(makeDeleteRequest({ url: 'not-a-url' }))

    expect(response.status).toBe(401)
  })

  it('returns 400 when the request body does not contain a valid URL field', async () => {
    const response = await DELETE(makeDeleteRequest({}))

    expect(response.status).toBe(400)
  })

  it('returns 400 when the URL cannot be parsed at all', async () => {
    const response = await DELETE(makeDeleteRequest({ url: 'not-a-url' }))

    expect(response.status).toBe(400)
  })

  it('returns 400 when blob URL validation throws during URL parsing', async () => {
    const originalUrl = globalThis.URL
    const validBlobUrl = 'https://foo.public.blob.vercel-storage.com/file.png'
    let validationErrorObserved = false

    for (const throwOnCall of [1, 2, 3, 4, 5]) {
      let constructorCalls = 0
      const request = makeDeleteRequest({ url: validBlobUrl })

      vi.stubGlobal(
        'URL',
        class extends originalUrl {
          constructor(url: string | URL, base?: string | URL) {
            constructorCalls += 1

            if (constructorCalls === throwOnCall) {
              throw new TypeError('URL parsing failed during blob validation')
            }

            super(url, base)
          }
        },
      )

      const response = await DELETE(request)
      const body = (await response.json()) as { error: string }

      if (response.status === 400 && body.error === 'URL invalide.') {
        validationErrorObserved = true
        break
      }
    }

    vi.stubGlobal('URL', originalUrl)

    expect(validationErrorObserved).toBe(true)
  })

  it('deletes a valid blob URL for admins', async () => {
    const url = 'https://foo.public.blob.vercel-storage.com/file.png'

    const response = await DELETE(makeDeleteRequest({ url }))

    expect(response.status).toBe(200)
    expect(mockDel).toHaveBeenCalledWith(url)
  })

  it('returns 500 when blob deletion fails', async () => {
    mockDel.mockRejectedValue(new Error('blob delete failed'))
    const url = 'https://foo.public.blob.vercel-storage.com/file.png'

    const response = await DELETE(makeDeleteRequest({ url }))

    expect(response.status).toBe(500)
  })
})
