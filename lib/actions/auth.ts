/**
 * File: lib/actions/auth.ts
 * Description: Server actions for authentication.
 * Author: Noé Henchoz
 * Date: 2025-12-08
 * License: MIT
 */

'use server'

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import auth from '@/lib/core/auth'

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

export async function logout() {
  await auth.api.signOut({
    headers: await headers(),
  })
  redirect('/')
}
