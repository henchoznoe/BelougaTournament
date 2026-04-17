/**
 * File: components/features/admin/user-detail.tsx
 * Description: Orchestrator component for the admin user detail page, composing all sub-sections.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { UserDangerSection } from '@/components/features/admin/user-detail/user-danger-section'
import { UserEditSection } from '@/components/features/admin/user-detail/user-edit-section'
import { UserProfileHeader } from '@/components/features/admin/user-detail/user-profile-header'
import { UserRegistrationsSection } from '@/components/features/admin/user-detail/user-registrations-section'
import { UserRoleSection } from '@/components/features/admin/user-detail/user-role-section'
import type { UserDetail as UserDetailType } from '@/lib/types/user'

interface UserDetailProps {
  user: UserDetailType
  viewerIsOwner: boolean
}

export const UserDetail = ({ user, viewerIsOwner }: UserDetailProps) => {
  const canEdit = true

  return (
    <div className="space-y-6">
      <UserProfileHeader user={user} />
      <UserRegistrationsSection user={user} />
      {canEdit && <UserEditSection user={user} />}
      <UserRoleSection user={user} viewerIsOwner={viewerIsOwner} />
      <UserDangerSection user={user} viewerIsOwner={viewerIsOwner} />
    </div>
  )
}
