/**
 * File: app/admin/settings/loading.tsx
 * Description: Content loading state for this admin route.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { AdminPageSkeleton } from '@/components/admin/ui/admin-page-skeleton'

export default function Loading() {
  return <AdminPageSkeleton variant="form" />
}
