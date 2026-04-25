/**
 * File: instrumentation-client.ts
 * Description: Client-side instrumentation for Next.js 15.3+.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

// Suppress benign ResizeObserver loop errors that trigger false-positive alerts.
// These occur naturally when field-sizing-content textareas resize across frames.
window.addEventListener('error', event => {
  if (event.message?.includes('ResizeObserver loop')) {
    event.stopImmediatePropagation()
  }
})
