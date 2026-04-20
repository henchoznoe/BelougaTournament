/**
 * File: components/ui/rich-text.tsx
 * Description: Sanitized HTML renderer for rich text content with prose styling.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import DOMPurify from 'isomorphic-dompurify'
import { useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils/cn'

interface RichTextProps {
  content: string
  className?: string
}

/** Only allow safe URL schemes — blocks javascript:, data:, vbscript:, etc. */
const ALLOWED_URI_REGEXP = /^(?:https?|mailto):/i

/**
 * After each sanitize, force `rel="noopener noreferrer"` on any anchor that has
 * `target="_blank"` to prevent reverse-tabnabbing. Registered once as a module
 * singleton on the isomorphic-dompurify instance.
 */
let hookInstalled = false
const ensureHook = () => {
  if (hookInstalled) return
  DOMPurify.addHook('afterSanitizeAttributes', node => {
    if (node.nodeName !== 'A') return
    if ((node as Element).getAttribute('target') === '_blank') {
      ;(node as Element).setAttribute('rel', 'noopener noreferrer')
    }
  })
  hookInstalled = true
}

export const RichText = ({ content, className }: RichTextProps) => {
  useEffect(ensureHook, [])

  const sanitized = useMemo(() => {
    ensureHook()
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'h2',
        'h3',
        'p',
        'br',
        'strong',
        'em',
        'u',
        's',
        'ul',
        'ol',
        'li',
        'blockquote',
        'pre',
        'code',
        'a',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      ALLOWED_URI_REGEXP,
    })
  }, [content])

  return (
    <div
      className={cn(
        'prose prose-invert max-w-none',
        // Headings
        'prose-headings:font-bold prose-headings:tracking-wide prose-headings:text-white',
        'prose-h2:text-lg prose-h3:text-base',
        'prose-h2:mt-5 prose-h2:mb-2 prose-h3:mt-4 prose-h3:mb-2',
        // Paragraphs
        'prose-p:text-sm prose-p:leading-relaxed prose-p:text-zinc-400',
        // Lists
        'prose-ul:text-sm prose-ul:text-zinc-400 prose-ol:text-sm prose-ol:text-zinc-400',
        'prose-li:text-zinc-400 prose-li:marker:text-zinc-600',
        // Links
        'prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300 hover:prose-a:underline',
        // Strong / emphasis
        'prose-strong:text-zinc-200 prose-em:text-zinc-300',
        // Code
        'prose-code:rounded prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs prose-code:text-zinc-300',
        'prose-pre:rounded-xl prose-pre:border prose-pre:border-white/5 prose-pre:bg-white/2',
        // Blockquotes
        'prose-blockquote:border-l-blue-500/30 prose-blockquote:text-zinc-400',
        className,
      )}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: content is sanitized with DOMPurify
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
