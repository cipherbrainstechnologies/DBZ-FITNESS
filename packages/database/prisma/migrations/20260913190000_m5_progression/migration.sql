-- Milestone 5: progression XP ledger, daily category caps, milestone unlocks

-- CreateEnum
CREATE TYPE "XpLedgerEventType" AS ENUM (
  'WORKOUT_COMPLETE',
  'REST_MISSION',
  'CONSISTENCY_CHECK_IN',
  'MEAL_REFLECTION',
  'RECOVERY_CHECK_IN',
  'WELLBEING_HABIT',
  'COMPENSATING_CORRECTION'
);

-- CreateEnum
CREATE TYPE "XpAwardCategory" AS ENUM (
  'MAIN_MISSION',
  'MEAL_REFLECTION',
  'RECOVERY_CHECK_IN',
  'WELLBEING_HABIT'
);

-- CreateTable
CREATE TABLE "XpLedgerEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "eventType" "XpLedgerEventType" NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "category" "XpAwardCategory" NOT NULL,
    "localDate" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyXpCategory" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "localDate" TEXT NOT NULL,
    "category" "XpAwardCategory" NOT NULL,
    "awardedAmount" INTEGER NOT NULL DEFAULT 0,
    "policyVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyXpCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneUnlock" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "milestoneDefinitionId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "levelAtUnlock" INTEGER,
    "totalXpAtUnlock" INTEGER,

    CONSTRAINT "MilestoneUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "XpLedgerEntry_userId_localDate_idx" ON "XpLedgerEntry"("userId", "localDate");

-- CreateIndex
CREATE INDEX "XpLedgerEntry_userId_createdAt_idx" ON "XpLedgerEntry"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "XpLedgerEntry_userId_eventType_sourceEntityId_policyVersion_key" ON "XpLedgerEntry"("userId", "eventType", "sourceEntityId", "policyVersion");

-- CreateIndex
CREATE INDEX "DailyXpCategory_userId_localDate_idx" ON "DailyXpCategory"("userId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyXpCategory_userId_localDate_category_policyVersion_key" ON "DailyXpCategory"("userId", "localDate", "category", "policyVersion");

-- CreateIndex
CREATE INDEX "MilestoneUnlock_userId_unlockedAt_idx" ON "MilestoneUnlock"("userId", "unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneUnlock_userId_milestoneDefinitionId_key" ON "MilestoneUnlock"("userId", "milestoneDefinitionId");

-- AddForeignKey
ALTER TABLE "XpLedgerEntry" ADD CONSTRAINT "XpLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyXpCategory" ADD CONSTRAINT "DailyXpCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneUnlock" ADD CONSTRAINT "MilestoneUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
