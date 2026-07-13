-- CreateTable
CREATE TABLE "QuestProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "QuestProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestProgress_userId_questId_periodKey_key" ON "QuestProgress"("userId", "questId", "periodKey");

-- AddForeignKey
ALTER TABLE "QuestProgress" ADD CONSTRAINT "QuestProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
