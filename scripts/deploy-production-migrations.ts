/**
 * File: scripts/deploy-production-migrations.ts
 * Description: Runs deploy migrations only for intentional Vercel production builds.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { spawnSync } from 'node:child_process'
import path from 'node:path'

if (process.env.VERCEL_ENV === 'production') {
  const prismaCli = path.resolve('node_modules/prisma/build/index.js')
  const result = spawnSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: process.env,
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
} else {
  console.info('Skipping database migrations outside Vercel Production.')
}
