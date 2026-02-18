/**
 * File: prisma.config.ts
 * Description: Prisma configuration options.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed-admin.ts',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
})
