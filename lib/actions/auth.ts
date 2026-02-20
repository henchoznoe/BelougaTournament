/**
 * File: lib/actions/auth.ts
 * Description: Server actions for authentication.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { redirect } from 'next/navigation'
import { logout } from '@/lib/services/auth.service'

export const logoutHandler = async () => {
  await logout()
  redirect('/')
}
