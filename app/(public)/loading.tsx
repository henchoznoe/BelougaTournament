/**
 * File: app/(public)/loading.tsx
 * Description: Loading state for public pages.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { Skeleton } from '@/components/ui/skeleton'

export default function PublicLoading() {
    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <Skeleton className="h-[60vh] w-full rounded-xl" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        </div>
    )
}
