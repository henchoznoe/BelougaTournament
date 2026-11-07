/**
 * File: tests/utils/profile-tab.test.ts
 * Description: Regression coverage for profile deep links and history navigation.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { resolveProfileTab } from '@/lib/utils/profile-tab'

describe('profile deep links', () => {
  it('opens the history tab from its legacy footer anchor', () =>
    expect(resolveProfileTab(null, '#tournaments-history')).toBe('history'))
  it('opens current registrations from their anchor', () =>
    expect(resolveProfileTab(null, '#inscriptions')).toBe('current'))
  it('gives the explicit tab precedence over an old anchor', () =>
    expect(resolveProfileTab('current', '#tournaments-history')).toBe(
      'current',
    ))
  it('defaults safely for unknown query values', () =>
    expect(resolveProfileTab('unknown', '')).toBe('current'))
})
