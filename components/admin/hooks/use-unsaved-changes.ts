/**
 * File: components/admin/hooks/use-unsaved-changes.ts
 * Description: Protects unsaved forms on link navigation, browser traversal and unload.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { useCallback, useEffect, useRef } from 'react'

export const useUnsavedChanges = (dirty: boolean) => {
  const allowLeave = useRef(false)
  useEffect(() => {
    if (!dirty) allowLeave.current = false
  }, [dirty])
  useEffect(() => {
    if (!dirty) return
    const confirmLeave = () =>
      allowLeave.current ||
      window.confirm(
        'Vous avez des modifications non enregistrées. Quitter sans enregistrer ?',
      )
    const unload = (event: BeforeUnloadEvent) => {
      if (allowLeave.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const anchor = (event.target as Element).closest<HTMLAnchorElement>(
        'a[href]',
      )
      if (
        !anchor ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download')
      )
        return
      const destination = new URL(anchor.href, window.location.href)
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search &&
        destination.origin === window.location.origin
      )
        return
      if (!confirmLeave()) {
        event.preventDefault()
        event.stopImmediatePropagation()
      } else allowLeave.current = true
    }
    // Navigation API covers same-document back/forward when the browser permits
    // cancellation. Older browsers retain native unload and link protection.
    const navigation = (window as unknown as { navigation?: EventTarget })
      .navigation
    const navigate = (event: Event) => {
      if (!event.cancelable || allowLeave.current) return
      const details = event as Event & {
        navigationType?: string
        destination?: { url: string }
      }
      if (details.navigationType !== 'traverse' || !details.destination) return
      const destination = new URL(details.destination.url)
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search
      )
        return
      if (!confirmLeave()) event.preventDefault()
    }
    document.addEventListener('click', click, true)
    window.addEventListener('beforeunload', unload)
    navigation?.addEventListener('navigate', navigate)
    return () => {
      document.removeEventListener('click', click, true)
      window.removeEventListener('beforeunload', unload)
      navigation?.removeEventListener('navigate', navigate)
    }
  }, [dirty])
  return useCallback(() => {
    allowLeave.current = true
  }, [])
}
