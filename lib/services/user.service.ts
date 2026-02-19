/**
 * File: lib/services/user.service.ts
 * Description: Data access layer for users.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { z } from 'zod'
import prisma from '@/lib/core/prisma'
import type { updateAdminSchema } from '@/lib/validations/admin'
import { Role } from '@/prisma/generated/prisma/enums'

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
  })
}

export const getUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  })
}

export const createAdminUser = async (email: string, name: string) => {
  return prisma.user.create({
    data: {
      email,
      name,
      role: Role.ADMIN,
      emailVerified: true,
    },
  })
}

export const updateUserRole = async (id: string, role: Role) => {
  return prisma.user.update({
    where: { id },
    data: { role },
  })
}

export const updateUser = async (
  id: string,
  data: z.infer<typeof updateAdminSchema>,
) => {
  return prisma.user.update({
    where: { id },
    data,
  })
}

export const deleteUser = async (id: string) => {
  return prisma.user.delete({
    where: { id },
  })
}
