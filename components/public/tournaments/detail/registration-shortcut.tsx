/**
 * File: components/public/tournaments/detail/registration-shortcut.tsx
 * Description: Mobile registration shortcut hidden while the form or software keyboard is visible.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ArrowDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export const RegistrationShortcut = ({ label }: { label: string }) => {
  const [visible, setVisible] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  useEffect(() => {
    const section = document.getElementById('inscription')
    if (!section) return
    let sectionVisible = false
    let footerVisible = false
    const footer = document.querySelector('footer')
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.target === section) sectionVisible = entry.isIntersecting
        if (entry.target === footer) footerVisible = entry.isIntersecting
      }
      setVisible(!sectionVisible && !footerVisible)
    })
    observer.observe(section)
    if (footer) observer.observe(footer)
    const viewport = window.visualViewport
    const updateKeyboard = () =>
      setKeyboardOpen(
        Boolean(
          document.activeElement?.matches(
            'input, textarea, [contenteditable="true"]',
          ),
        ) || Boolean(viewport && viewport.height < window.innerHeight * 0.75),
      )
    viewport?.addEventListener('resize', updateKeyboard)
    document.addEventListener('focusin', updateKeyboard)
    document.addEventListener('focusout', updateKeyboard)
    return () => {
      observer.disconnect()
      viewport?.removeEventListener('resize', updateKeyboard)
      document.removeEventListener('focusin', updateKeyboard)
      document.removeEventListener('focusout', updateKeyboard)
    }
  }, [])
  if (!visible || keyboardOpen) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-zinc-950/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-lg lg:hidden">
      <Button asChild className="w-full">
        <a href="#inscription">
          {label}
          <ArrowDown aria-hidden="true" className="size-4" />
        </a>
      </Button>
    </div>
  )
}
