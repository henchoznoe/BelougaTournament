/**
 * File: app/api/auth/[...all]/route.ts
 * Description: API route for authentication.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { toNextJsHandler } from 'better-auth/next-js'
import auth from '@/lib/core/auth'

export const { GET, POST } = toNextJsHandler(auth)
