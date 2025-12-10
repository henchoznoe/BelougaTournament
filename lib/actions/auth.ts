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

import { redirect } from 'next/navigation'
import { logout } from '@/lib/services/auth.service'

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

export const logoutHandler = async () => {
  await logout()
  redirect('/')
}
