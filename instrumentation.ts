/**
 * File: instrumentation.ts
 * Description: Sentry SDK initialisation for the server (Node.js) and edge (Edge runtime).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import * as Sentry from '@sentry/nextjs';

const RUNTIME_NODE = 'nodejs';
const RUNTIME_EDGE = 'edge';

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === RUNTIME_NODE) {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === RUNTIME_EDGE) {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
