/**
 * File: components/ui/markdown.tsx
 * Description: Markdown renderer with styled prose for dark theme.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils/cn'

interface MarkdownProps {
  content: string
  className?: string
}

export const Markdown = ({ content, className }: MarkdownProps) => {
  return (
    <div
      className={cn(
        'prose prose-invert max-w-none',
        // Headings
        'prose-headings:font-bold prose-headings:text-white prose-headings:tracking-wide',
        'prose-h1:text-xl prose-h2:text-lg prose-h3:text-base',
        'prose-h1:mt-6 prose-h1:mb-3 prose-h2:mt-5 prose-h2:mb-2 prose-h3:mt-4 prose-h3:mb-2',
        // Paragraphs
        'prose-p:text-sm prose-p:leading-relaxed prose-p:text-zinc-400',
        // Lists
        'prose-ul:text-sm prose-ul:text-zinc-400 prose-ol:text-sm prose-ol:text-zinc-400',
        'prose-li:text-zinc-400 prose-li:marker:text-zinc-600',
        // Links
        'prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-blue-300',
        // Strong / emphasis
        'prose-strong:text-zinc-200 prose-em:text-zinc-300',
        // Code
        'prose-code:rounded prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs prose-code:text-zinc-300',
        'prose-pre:rounded-xl prose-pre:border prose-pre:border-white/5 prose-pre:bg-white/2',
        // Blockquotes
        'prose-blockquote:border-l-blue-500/30 prose-blockquote:text-zinc-400',
        // Horizontal rules
        'prose-hr:border-white/10',
        className,
      )}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
