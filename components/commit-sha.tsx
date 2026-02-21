/**
 * File: components/commit-sha.tsx
 * Description: Component displaying the current build version.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

const DEFAULT_COMMIT_SHA = "local-dev"
const SHA_DISPLAY_LENGTH = 7

export const CommitSha = () => {
  // Fetch the commit hash injected by Vercel, fallback for local development
  const fullCommitSha = process.env.VERCEL_GIT_COMMIT_SHA ?? DEFAULT_COMMIT_SHA

  // Truncate to 7 characters for standard Git short SHA format
  const shortSha = fullCommitSha.slice(0, SHA_DISPLAY_LENGTH)

  return (
    <span className="font-mono">Version: {shortSha}</span>
  )
}
