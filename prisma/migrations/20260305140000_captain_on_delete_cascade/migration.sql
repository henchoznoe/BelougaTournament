-- DropForeignKey
ALTER TABLE "team" DROP CONSTRAINT "team_captainId_fkey";

-- AddForeignKey with CASCADE
ALTER TABLE "team" ADD CONSTRAINT "team_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
