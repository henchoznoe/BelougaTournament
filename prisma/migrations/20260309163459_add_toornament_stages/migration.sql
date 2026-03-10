-- CreateTable
CREATE TABLE "ToornamentStage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "number" INTEGER NOT NULL DEFAULT 0,
    "tournamentId" TEXT NOT NULL,

    CONSTRAINT "ToornamentStage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ToornamentStage" ADD CONSTRAINT "ToornamentStage_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
