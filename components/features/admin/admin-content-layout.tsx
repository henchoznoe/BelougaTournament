/**
 * File: components/features/admin/admin-content-layout.tsx
 * Description: Reusable layout for admin pages providing breadcrumb, heading, and max-width container.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { LucideIcon } from 'lucide-react'
import { AdminBreadcrumb } from '@/components/features/admin/admin-breadcrumb'

interface BreadcrumbSegment {
  label: string
  href?: string
}

interface AdminContentLayoutProps {
  segments: BreadcrumbSegment[]
  icon: LucideIcon
  title: string
  titleExtra?: React.ReactNode
  subtitle?: string
  headerRight?: React.ReactNode
  children: React.ReactNode
}

export const AdminContentLayout = ({
  segments,
  icon: Icon,
  title,
  titleExtra,
  subtitle,
  headerRight,
  children,
}: AdminContentLayoutProps) => {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Breadcrumb */}
      <AdminBreadcrumb segments={segments} />

      {/* Page heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
            <Icon className="size-6 text-blue-400" />
            {title}
            {titleExtra}
          </h1>
          {subtitle && <p className="text-sm text-zinc-400">{subtitle}</p>}
        </div>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>

      {children}
    </div>
  )
}
