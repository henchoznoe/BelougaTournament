/**
 * File: lib/utils/commit-hash.ts
 * Description: Utility function for getting the commit hash
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

const DEFAULT_COMMIT_SHA = 'local-dev'
const SHA_DISPLAY_LENGTH = 7

export const getCommitHash = (): string => {
  // Fetch the commit hash injected by Vercel, fallback for local development
  const fullCommitHash = process.env.VERCEL_GIT_COMMIT_SHA

  // Truncate to 7 characters for standard Git short SHA format
  return fullCommitHash
    ? fullCommitHash.slice(0, SHA_DISPLAY_LENGTH)
    : DEFAULT_COMMIT_SHA
}
