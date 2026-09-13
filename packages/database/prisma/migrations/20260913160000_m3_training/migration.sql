-- Milestone 3: training engine entities

-- CreateEnum
CREATE TYPE "ContentReviewStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TrainingPlanStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlannedSessionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SHORTENED', 'ABANDONED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkoutSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "Exercise" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "movementPattern" TEXT NOT NULL,
    "equipment" JSONB NOT NULL,
    "difficulty" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "restrictions" JSONB NOT NULL,
    "adaptations" JSONB,
    "preferenceTags" JSONB,
    "reviewStatus" "ContentReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgrammeTemplate" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "goalTags" JSONB NOT NULL,
    "eligibility" JSONB NOT NULL,
    "scheduleRules" JSONB NOT NULL,
    "preferenceTags" JSONB,
    "reviewStatus" "ContentReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgrammeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateSession" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "dayPattern" TEXT NOT NULL,
    "estimatedDuration" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateExercise" (
    "id" UUID NOT NULL,
    "templateSessionId" UUID NOT NULL,
    "exerciseId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "prescription" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingPlan" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "templateId" UUID NOT NULL,
    "profileVersionId" UUID NOT NULL,
    "screeningRecordId" UUID NOT NULL,
    "characterArchetypeId" UUID,
    "inputSnapshot" JSONB NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "explanationCodes" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "status" "TrainingPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingPlanPreview" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingPlanPreview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "localDate" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "durationBudget" INTEGER NOT NULL,
    "prescriptionSnapshot" JSONB NOT NULL,
    "status" "PlannedSessionStatus" NOT NULL DEFAULT 'PLANNED',
    "shortenedFromDuration" INTEGER,
    "explanationCodes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannedSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "plannedSessionId" UUID NOT NULL,
    "planVersion" INTEGER NOT NULL,
    "status" "WorkoutSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "actualDuration" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSet" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "exerciseId" UUID NOT NULL,
    "setIndex" INTEGER NOT NULL,
    "repetitions" INTEGER,
    "resistanceKg" DECIMAL(8,2),
    "durationSeconds" INTEGER,
    "effort" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "responseBody" JSONB NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_key_key" ON "Exercise"("key");

-- CreateIndex
CREATE INDEX "Exercise_publicationStatus_reviewStatus_idx" ON "Exercise"("publicationStatus", "reviewStatus");

-- CreateIndex
CREATE INDEX "Exercise_movementPattern_idx" ON "Exercise"("movementPattern");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammeTemplate_key_version_key" ON "ProgrammeTemplate"("key", "version");

-- CreateIndex
CREATE INDEX "ProgrammeTemplate_publicationStatus_reviewStatus_idx" ON "ProgrammeTemplate"("publicationStatus", "reviewStatus");

-- CreateIndex
CREATE INDEX "TemplateSession_templateId_sortOrder_idx" ON "TemplateSession"("templateId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateExercise_templateSessionId_sortOrder_key" ON "TemplateExercise"("templateSessionId", "sortOrder");

-- CreateIndex
CREATE INDEX "TemplateExercise_exerciseId_idx" ON "TemplateExercise"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingPlan_userId_version_key" ON "TrainingPlan"("userId", "version");

-- CreateIndex
CREATE INDEX "TrainingPlan_userId_status_effectiveFrom_idx" ON "TrainingPlan"("userId", "status", "effectiveFrom");

-- CreateIndex
CREATE INDEX "TrainingPlan_templateId_idx" ON "TrainingPlan"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingPlanPreview_token_key" ON "TrainingPlanPreview"("token");

-- CreateIndex
CREATE INDEX "TrainingPlanPreview_userId_expiresAt_idx" ON "TrainingPlanPreview"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "PlannedSession_userId_localDate_idx" ON "PlannedSession"("userId", "localDate");

-- CreateIndex
CREATE INDEX "PlannedSession_planId_status_idx" ON "PlannedSession"("planId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSession_plannedSessionId_key" ON "WorkoutSession"("plannedSessionId");

-- CreateIndex
CREATE INDEX "WorkoutSession_userId_startedAt_idx" ON "WorkoutSession"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSet_sessionId_exerciseId_setIndex_key" ON "WorkoutSet"("sessionId", "exerciseId", "setIndex");

-- CreateIndex
CREATE INDEX "WorkoutSet_sessionId_idx" ON "WorkoutSet"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_userId_scope_key_key" ON "IdempotencyRecord"("userId", "scope", "key");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_createdAt_idx" ON "IdempotencyRecord"("createdAt");

-- AddForeignKey
ALTER TABLE "TemplateSession" ADD CONSTRAINT "TemplateSession_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProgrammeTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateExercise" ADD CONSTRAINT "TemplateExercise_templateSessionId_fkey" FOREIGN KEY ("templateSessionId") REFERENCES "TemplateSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateExercise" ADD CONSTRAINT "TemplateExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProgrammeTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlanPreview" ADD CONSTRAINT "TrainingPlanPreview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedSession" ADD CONSTRAINT "PlannedSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedSession" ADD CONSTRAINT "PlannedSession_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TrainingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_plannedSessionId_fkey" FOREIGN KEY ("plannedSessionId") REFERENCES "PlannedSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSet" ADD CONSTRAINT "WorkoutSet_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSet" ADD CONSTRAINT "WorkoutSet_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "IdempotencyRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
