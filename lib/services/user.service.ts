/**
 * File: lib/services/user.service.ts
 * Description: Data access layer for users.
 */

import type { z } from 'zod'
import prisma from '@/lib/core/db'
import type { updateAdminSchema } from '@/lib/validations/admin'
import { Role } from '@/prisma/generated/prisma/client'

// ----------------------------------------------------------------------
// READS
// ----------------------------------------------------------------------

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

// ----------------------------------------------------------------------
// WRITES
// ----------------------------------------------------------------------

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
