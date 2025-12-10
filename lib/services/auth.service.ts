/**
 * File: lib/services/auth.service.ts
 * Description: Service for handling authentication logic.
 * Author: Noé Henchoz
 * Date: 2025-12-10
 * License: MIT
 */

import { headers } from 'next/headers'
import auth from '@/lib/core/auth'

export const logout = async () => {
  await auth.api.signOut({
    headers: await headers(),
  })
}
