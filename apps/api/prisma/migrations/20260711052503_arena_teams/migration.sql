-- AlterTable
ALTER TABLE "User" ADD COLUMN     "arenaDefended" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "arenaTeamCardIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "lastArenaBattleLog" JSONB;
