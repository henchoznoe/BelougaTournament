/**
 * File: lib/utils/editor-content.ts
 * Description: Distinguishes user edits from Quill’s initial HTML normalization.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export const getEditedContent = (
  content: string,
  source: string,
): string | undefined => {
  if (source !== 'user') return undefined
  return content === '<p><br></p>' || content === '<p><br/></p>' ? '' : content
}

/** Pasted paragraphs often contain non-breaking spaces between every word. */
export const normalizeRichTextSpacing = (content: string): string =>
  content.replace(/(?:&nbsp;|&#160;|&#x0*a0;|\u00a0)/gi, ' ')
