/**
 * File: prisma/seed-admin.ts
 * Description: Seed script to create the initial admin user.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@belouga.com';
  const password = 'admin'; // Change this in production!
  const hashedPassword = await hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: hashedPassword,
      role: 'SUPERADMIN',
    },
  });

  console.log({ user });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
