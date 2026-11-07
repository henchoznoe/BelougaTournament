/**
 * File: components/admin/ui/admin-content-layout.tsx
 * Description: Reusable layout for admin pages providing breadcrumb, heading, and max-width container.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { LucideIcon } from 'lucide-react'
import { AdminBreadcrumb } from '@/components/admin/ui/admin-breadcrumb'

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
    <div className="mx-auto w-full min-w-0 max-w-(--content-width) space-y-6">
      {/* Breadcrumb */}
      <AdminBreadcrumb segments={segments} />

      {/* Page heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="flex items-start gap-3 break-words text-2xl font-bold tracking-tight text-white">
            <Icon className="mt-1 size-6 shrink-0 text-blue-400" />
            <span className="min-w-0">{title}</span>
          </h1>
          {titleExtra && (
            <div className="flex flex-wrap items-center gap-2">
              {titleExtra}
            </div>
          )}
          {subtitle && <p className="text-sm text-zinc-400">{subtitle}</p>}
        </div>
        {headerRight && (
          <div className="flex max-w-full flex-wrap gap-2">{headerRight}</div>
        )}
      </div>

      {children}
    </div>
  )
}
