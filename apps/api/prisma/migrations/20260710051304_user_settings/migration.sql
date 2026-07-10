-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyArenaTimer" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyCardTimer" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "premiumUntil" TIMESTAMP(3);
