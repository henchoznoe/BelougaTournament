/**
 * File: lib/services/auth.service.ts
 * Description: Service for handling authentication logic.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { headers } from 'next/headers'
import auth from '@/lib/core/auth'

export const logout = async () => {
  await auth.api.signOut({
    headers: await headers(),
  })
}
