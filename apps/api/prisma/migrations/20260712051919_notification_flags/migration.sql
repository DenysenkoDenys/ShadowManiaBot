-- AlterTable
ALTER TABLE "User" ADD COLUMN     "arenaTimerNotified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cardTimerNotified" BOOLEAN NOT NULL DEFAULT false;
