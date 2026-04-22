/**
 * File: lib/actions/serializable-transaction.ts
 * Description: Shared helper for retrying serializable Prisma transactions on concurrency conflicts.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { SERIALIZABLE_TRANSACTION_MAX_RETRIES } from '@/lib/config/constants'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import { Prisma } from '@/prisma/generated/prisma/client'

type PrismaTransaction = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0]

/** Returns true when Postgres aborted a serializable transaction due to a concurrent write conflict. */
const isRetryableTransactionError = (
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2034'

/** Executes a Prisma transaction at SERIALIZABLE isolation and retries transient write conflicts. */
export const runSerializableTransaction = async <T>(
  handler: (tx: PrismaTransaction) => Promise<T>,
): Promise<T> => {
  for (
    let attempt = 1;
    attempt <= SERIALIZABLE_TRANSACTION_MAX_RETRIES;
    attempt++
  ) {
    try {
      return await prisma.$transaction(handler, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
    } catch (error) {
      if (
        !isRetryableTransactionError(error) ||
        attempt === SERIALIZABLE_TRANSACTION_MAX_RETRIES
      ) {
        throw error
      }

      logger.warn(
        {
          attempt,
          maxAttempts: SERIALIZABLE_TRANSACTION_MAX_RETRIES,
        },
        'Retrying serializable transaction after concurrency conflict',
      )
    }
  }

  throw new Error('Serializable transaction retry loop exited unexpectedly.')
}
