-- CreateTable
CREATE TABLE "BonusMilestoneClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BonusMilestoneClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BonusMilestoneClaim_userId_threshold_key" ON "BonusMilestoneClaim"("userId", "threshold");

-- AddForeignKey
ALTER TABLE "BonusMilestoneClaim" ADD CONSTRAINT "BonusMilestoneClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
