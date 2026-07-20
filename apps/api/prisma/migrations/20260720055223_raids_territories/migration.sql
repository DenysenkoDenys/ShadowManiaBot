-- AlterTable
ALTER TABLE "ClanQuest" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'CARDS';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastRaidAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "maxHp" INTEGER NOT NULL,
    "currentHp" INTEGER NOT NULL,
    "controllingClanId" TEXT,
    "lastPayoutAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_controllingClanId_fkey" FOREIGN KEY ("controllingClanId") REFERENCES "Clan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
