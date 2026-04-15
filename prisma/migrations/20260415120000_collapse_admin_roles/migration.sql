-- Invalidate sessions for users whose effective role changes.
DELETE FROM "session"
USING "user"
WHERE "session"."userId" = "user"."id"
  AND "user"."role" IN ('ADMIN', 'SUPERADMIN');

-- Convert the enum column to text so values can be remapped safely.
ALTER TABLE "user"
ALTER COLUMN "role" DROP DEFAULT,
ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;

-- Old scoped admins become players, previous super admins become admins.
UPDATE "user"
SET "role" = 'USER'
WHERE "role" = 'ADMIN';

UPDATE "user"
SET "role" = 'ADMIN'
WHERE "role" = 'SUPERADMIN';

-- Replace the enum with the new two-role model.
ALTER TYPE "Role" RENAME TO "Role_old";

CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

ALTER TABLE "user"
ALTER COLUMN "role" TYPE "Role" USING "role"::"Role",
ALTER COLUMN "role" SET DEFAULT 'USER';

DROP TYPE "Role_old";

-- Tournament-level admin assignments are no longer used.
DROP TABLE "admin_assignment";
