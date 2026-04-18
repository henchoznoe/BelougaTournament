/**
 * File: components/admin/ui/admin-breadcrumb.tsx
 * Description: Reusable breadcrumb navigation for admin pages.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import Link from 'next/link'
import { Fragment } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface BreadcrumbSegment {
  label: string
  href?: string
}

interface AdminBreadcrumbProps {
  segments: BreadcrumbSegment[]
}

export const AdminBreadcrumb = ({ segments }: AdminBreadcrumbProps) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1

          return (
            <Fragment key={segment.label}>
              {index > 0 && <BreadcrumbSeparator className="text-zinc-600" />}
              <BreadcrumbItem>
                {isLast || !segment.href ? (
                  <BreadcrumbPage className="text-zinc-300">
                    {segment.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={segment.href}
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      {segment.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
