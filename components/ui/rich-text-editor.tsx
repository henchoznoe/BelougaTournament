/**
 * File: components/ui/rich-text-editor.tsx
 * Description: Rich text editor component wrapping react-quill-new for use in forms.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { useMemo } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { cn } from '@/lib/utils/cn'

interface RichTextEditorProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const TOOLBAR_OPTIONS = [
  [{ header: [2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'code-block'],
  ['link'],
  ['clean'],
]

const FORMATS = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'blockquote',
  'code-block',
  'link',
]

export const RichTextEditor = ({
  id,
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) => {
  const modules = useMemo(
    () => ({
      toolbar: TOOLBAR_OPTIONS,
    }),
    [],
  )

  const handleChange = (content: string) => {
    // react-quill returns "<p><br></p>" for empty content — normalize to ""
    const isEmpty = content === '<p><br></p>' || content === '<p><br/></p>'
    onChange(isEmpty ? '' : content)
  }

  return (
    <div className={cn('rich-text-editor', className)} id={id}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder}
      />
    </div>
  )
}
