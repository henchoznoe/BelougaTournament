/**
 * File: lib/config/constants/transaction.ts
 * Description: Transaction and concurrency constants for retryable database mutations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

/** Maximum number of retries for serializable Prisma transactions that conflict concurrently. */
export const SERIALIZABLE_TRANSACTION_MAX_RETRIES = 3
