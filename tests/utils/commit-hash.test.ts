/**
 * File: tests/utils/commit-hash.test.ts
 * Description: Unit tests for the getCommitHash utility.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — must be defined before importing the module under test
// ---------------------------------------------------------------------------

const mockEnv = { VERCEL_GIT_COMMIT_SHA: undefined as string | undefined }

vi.mock('@/lib/core/env', () => ({ env: mockEnv }))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { getCommitHash } = await import('@/lib/utils/commit-hash')

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getCommitHash', () => {
  beforeEach(() => {
    mockEnv.VERCEL_GIT_COMMIT_SHA = undefined
  })

  it('returns "local-dev" when VERCEL_GIT_COMMIT_SHA is undefined', () => {
    expect(getCommitHash()).toBe('local-dev')
  })

  it('returns the first 7 characters of a full SHA', () => {
    mockEnv.VERCEL_GIT_COMMIT_SHA = 'a1b2c3d4e5f6789abcdef'
    expect(getCommitHash()).toBe('a1b2c3d')
  })

  it('returns the full string when SHA is exactly 7 characters', () => {
    mockEnv.VERCEL_GIT_COMMIT_SHA = 'abc1234'
    expect(getCommitHash()).toBe('abc1234')
  })

  it('returns the full string when SHA is shorter than 7 characters', () => {
    mockEnv.VERCEL_GIT_COMMIT_SHA = 'abc'
    expect(getCommitHash()).toBe('abc')
  })
})
