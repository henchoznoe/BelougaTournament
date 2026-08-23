/**
 * File: lib/utils/posthog-browser.ts
 * Description: Lazy browser-only PostHog queue loaded directly from the EU CDN.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { POSTHOG } from '@/lib/config/constants/analytics'

type PostHogArguments = unknown[]
type PostHogQueue = PostHogArguments[] & {
  __loaded?: boolean
  _i?: PostHogArguments[]
  capture?: (...args: PostHogArguments) => void
  captureException?: (...args: PostHogArguments) => void
  identify?: (...args: PostHogArguments) => void
  init?: (...args: PostHogArguments) => void
  reset?: (...args: PostHogArguments) => void
}

declare global {
  interface Window {
    posthog?: PostHogQueue
  }
}

const getQueue = (): PostHogQueue | undefined =>
  typeof window === 'undefined' ? undefined : window.posthog

const enqueue = (method: string, args: PostHogArguments): void => {
  const queue = getQueue()
  if (!queue) return
  const callable = queue[method as keyof PostHogQueue] as unknown
  if (typeof callable === 'function') {
    const capture = callable as (...values: PostHogArguments) => void
    capture(...args)
  } else queue.push([method, ...args])
}

export const posthogBrowser = {
  get __loaded(): boolean {
    return Boolean(getQueue()?.__loaded)
  },
  capture: (...args: PostHogArguments): void => enqueue('capture', args),
  captureException: (...args: PostHogArguments): void =>
    enqueue('captureException', args),
  identify: (...args: PostHogArguments): void => enqueue('identify', args),
  reset: (...args: PostHogArguments): void => enqueue('reset', args),
}

const QUEUED_METHODS = [
  'capture',
  'captureException',
  'identify',
  'reset',
] as const

export const initializePostHogBrowser = (apiKey: string): void => {
  if (typeof window === 'undefined' || window.posthog) return

  const queue = [] as PostHogQueue
  queue._i = []
  for (const method of QUEUED_METHODS) {
    queue[method] = (...args: PostHogArguments) => queue.push([method, ...args])
  }
  queue.init = (...args: PostHogArguments) => queue._i?.push(args)
  window.posthog = queue

  queue.init(apiKey, {
    api_host: POSTHOG.API_HOST,
    ui_host: POSTHOG.UI_HOST,
    defaults: '2025-05-24',
    capture_exceptions: true,
    respect_dnt: true,
    autocapture: false,
    disable_session_recording: true,
  })

  const script = document.createElement('script')
  script.async = true
  script.crossOrigin = 'anonymous'
  script.src = `${POSTHOG.ASSETS_HOST}/static/array.js`
  document.head.append(script)
}
