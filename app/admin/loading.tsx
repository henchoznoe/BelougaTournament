/**
 * File: app/admin/loading.tsx
 * Description: Loading state for admin pages.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { Skeleton } from '@/components/ui/skeleton'

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const AdminLoading = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  )
}

export default AdminLoading
