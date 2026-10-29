/**
 * File: scripts/deploy-migrations.ts
 * Description: Applies migrations to the database configured for Vercel Preview or Production.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { spawnSync } from 'node:child_process'
import path from 'node:path'

if (
  process.env.VERCEL_ENV === 'production' ||
  process.env.VERCEL_ENV === 'preview'
) {
  const prismaCli = path.resolve('node_modules/prisma/build/index.js')
  const result = spawnSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: process.env,
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
} else {
  console.info(
    'Skipping database migrations outside Vercel Preview or Production.',
  )
}
