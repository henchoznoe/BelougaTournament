-- AlterTable: Convert Tournament.imageUrl (String?) to Tournament.imageUrls (String[])
-- Migrate existing data: if imageUrl is not null, wrap it in an array

ALTER TABLE "Tournament" ADD COLUMN "imageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "Tournament" SET "imageUrls" = ARRAY["imageUrl"] WHERE "imageUrl" IS NOT NULL;

ALTER TABLE "Tournament" DROP COLUMN "imageUrl";
