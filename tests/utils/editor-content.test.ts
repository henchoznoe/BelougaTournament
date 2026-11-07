/**
 * File: tests/utils/editor-content.test.ts
 * Description: Guards against unsaved-change warnings caused solely by mounting the editor.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import {
  getEditedContent,
  normalizeRichTextSpacing,
} from '@/lib/utils/editor-content'

describe('editor changes', () => {
  it('keeps pasted prize words intact while allowing natural line breaks', () => {
    expect(
      normalizeRichTextSpacing(
        '<strong>250&nbsp;CHF&nbsp;+&nbsp;le\u00a0Trophée&#160;du&#xA0;Bélouga</strong>',
      ),
    ).toBe('<strong>250 CHF + le Trophée du Bélouga</strong>')
  })
  it.each(['api', 'silent'])('ignores %s normalization', source =>
    expect(getEditedContent('<p>Existing content</p>', source)).toBeUndefined(),
  )
  it('preserves the user’s formatted text', () =>
    expect(getEditedContent('<p><strong>Texte</strong></p>', 'user')).toBe(
      '<p><strong>Texte</strong></p>',
    ))
  it.each(['<p><br></p>', '<p><br/></p>'])(
    'normalizes a user-cleared editor',
    value => expect(getEditedContent(value, 'user')).toBe(''),
  )
})
