/**
 * File: tests/actions/serializable-transaction.test.ts
 * Description: Unit tests for the serializable Prisma transaction retry helper.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@/prisma/generated/prisma/client'

vi.mock('server-only', () => ({}))

const mockWarn = vi.fn()
vi.mock('@/lib/core/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: (...args: unknown[]) => mockWarn(...args),
    error: vi.fn(),
  },
}))

const mockTransaction = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

const { runSerializableTransaction } = await import(
  '@/lib/actions/serializable-transaction'
)

const makeKnownError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('message', {
    code,
    clientVersion: '7.0.0',
  })

describe('runSerializableTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retries once when Prisma reports a serializable write conflict', async () => {
    const conflict = makeKnownError('P2034')
    const handler = vi.fn().mockResolvedValue('done')

    mockTransaction
      .mockRejectedValueOnce(conflict)
      .mockImplementationOnce(async callback => callback({ id: 'tx-2' }))

    const result = await runSerializableTransaction(handler)

    expect(result).toBe('done')
    expect(mockTransaction).toHaveBeenCalledTimes(2)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(mockWarn).toHaveBeenCalledOnce()
  })

  it('rethrows non-retryable Prisma errors without retrying', async () => {
    const duplicate = makeKnownError('P2002')
    const handler = vi.fn().mockResolvedValue('done')

    mockTransaction.mockRejectedValueOnce(duplicate)

    await expect(runSerializableTransaction(handler)).rejects.toBe(duplicate)
    expect(mockTransaction).toHaveBeenCalledTimes(1)
    expect(handler).not.toHaveBeenCalled()
  })
})
