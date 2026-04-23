/**
 * File: tests/utils/app-version.test.ts
 * Description: Unit tests for the getAppVersion and getRepoUrl utilities.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — must be defined before importing the module under test
// ---------------------------------------------------------------------------

const mockPackageJson = {
  version: '1.0.0',
  homepage: 'https://github.com/henchoznoe/BelougaTournament',
}

vi.mock('@/package.json', () => ({ default: mockPackageJson }))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { getAppVersion, getRepoUrl } = await import('@/lib/utils/app-version')

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getAppVersion', () => {
  beforeEach(() => {
    mockPackageJson.version = '1.0.0'
    mockPackageJson.homepage = 'https://github.com/henchoznoe/BelougaTournament'
  })

  it('returns the version from package.json', () => {
    expect(getAppVersion()).toBe('1.0.0')
  })

  it('reflects a different version when package.json changes', () => {
    mockPackageJson.version = '2.5.0'
    expect(getAppVersion()).toBe('2.5.0')
  })

  it('returns semver with pre-release tag', () => {
    mockPackageJson.version = '3.0.0-beta.1'
    expect(getAppVersion()).toBe('3.0.0-beta.1')
  })
})

describe('getRepoUrl', () => {
  beforeEach(() => {
    mockPackageJson.homepage = 'https://github.com/henchoznoe/BelougaTournament'
  })

  it('returns the homepage URL from package.json', () => {
    expect(getRepoUrl()).toBe('https://github.com/henchoznoe/BelougaTournament')
  })

  it('reflects a different URL when homepage changes', () => {
    mockPackageJson.homepage = 'https://github.com/other/repo'
    expect(getRepoUrl()).toBe('https://github.com/other/repo')
  })
})
