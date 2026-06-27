/**
 * File: tests/utils/posthog.test.ts
 * Description: Unit tests for the PostHog distinct-id cookie extractor.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { extractDistinctId } from '@/lib/utils/posthog'

const cookieFor = (data: unknown) =>
  `ph_phc_abc123_posthog=${encodeURIComponent(JSON.stringify(data))}`

describe('extractDistinctId', () => {
  it('returns undefined when the cookie header is undefined', () => {
    expect(extractDistinctId(undefined)).toBeUndefined()
  })

  it('returns undefined when no PostHog cookie is present', () => {
    expect(extractDistinctId('session=abc; other=def')).toBeUndefined()
  })

  it('extracts the distinct_id from a valid PostHog cookie', () => {
    expect(extractDistinctId(cookieFor({ distinct_id: 'user-123' }))).toBe(
      'user-123',
    )
  })

  it('extracts the distinct_id when surrounded by other cookies', () => {
    const header = `foo=bar; ${cookieFor({ distinct_id: 'u-9' })}; baz=qux`
    expect(extractDistinctId(header)).toBe('u-9')
  })

  it('returns undefined when the cookie value is malformed JSON', () => {
    expect(extractDistinctId('ph_phc_x_posthog=not%20json')).toBeUndefined()
  })

  it('returns undefined when distinct_id is not a string', () => {
    expect(extractDistinctId(cookieFor({ distinct_id: 123 }))).toBeUndefined()
  })

  it('returns undefined when distinct_id is absent from the payload', () => {
    expect(extractDistinctId(cookieFor({ other: 'value' }))).toBeUndefined()
  })
})
