/**
 * File: tests/api/blobs.test.ts
 * Description: Unit tests for the Vercel Blob upload/list/delete API route.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
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

  it('returns 400 for unsupported file type', async () => {
    const formData = new FormData()
    formData.set('file', createFile('logo.svg', 'image/svg+xml'))

    const response = await POST(makePostRequest(formData))

    expect(response.status).toBe(400)
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

  it('deletes a valid blob URL for admins', async () => {
    const url = 'https://foo.public.blob.vercel-storage.com/file.png'

    const response = await DELETE(makeDeleteRequest({ url }))

    expect(response.status).toBe(200)
    expect(mockDel).toHaveBeenCalledWith(url)
  })
})
