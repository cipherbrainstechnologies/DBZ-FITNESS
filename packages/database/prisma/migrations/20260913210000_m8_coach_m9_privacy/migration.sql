-- Milestone 8 AI coach + Milestone 9 privacy export/deletion

CREATE TYPE "CoachMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
CREATE TYPE "CoachProposalStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'EXPIRED', 'FAILED_SAFETY');
CREATE TYPE "DataExportJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY_FIXTURE', 'FAILED', 'EXPIRED');
CREATE TYPE "AccountDeletionStatus" AS ENUM ('PENDING', 'PROCESSING', 'SCHEDULED_FIXTURE', 'CANCELLED', 'COMPLETED_FIXTURE', 'FAILED');

CREATE TABLE "CoachConversation" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CoachMessage" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "CoachMessageRole" NOT NULL,
    "messageText" TEXT NOT NULL,
    "structuredResponse" JSONB,
    "providerMode" TEXT,
    "safetyStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CoachActionProposal" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "conversationId" UUID,
    "messageId" UUID,
    "actionType" TEXT NOT NULL,
    "validatedPayload" JSONB NOT NULL,
    "sourceVersions" JSONB,
    "status" "CoachProposalStatus" NOT NULL DEFAULT 'PENDING',
    "safetyStatus" TEXT NOT NULL DEFAULT 'SAFE',
    "rejectionReason" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachActionProposal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DataExportJob" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "DataExportJobStatus" NOT NULL DEFAULT 'PENDING',
    "scope" TEXT NOT NULL DEFAULT 'FULL_ACCOUNT',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "downloadUrl" TEXT,
    "downloadMode" TEXT NOT NULL DEFAULT 'FIXTURE_DRY_RUN',
    "failureReason" TEXT,
    "idempotencyKey" TEXT,
    "requestHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataExportJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountDeletionRequest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "AccountDeletionStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passwordVerifiedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "failureReason" TEXT,
    "notes" TEXT,
    "idempotencyKey" TEXT,
    "requestHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CoachConversation_userId_createdAt_idx" ON "CoachConversation"("userId", "createdAt");
CREATE INDEX "CoachMessage_conversationId_createdAt_idx" ON "CoachMessage"("conversationId", "createdAt");
CREATE INDEX "CoachMessage_userId_createdAt_idx" ON "CoachMessage"("userId", "createdAt");
CREATE INDEX "CoachActionProposal_userId_status_idx" ON "CoachActionProposal"("userId", "status");
CREATE INDEX "CoachActionProposal_userId_createdAt_idx" ON "CoachActionProposal"("userId", "createdAt");
CREATE INDEX "DataExportJob_status_requestedAt_idx" ON "DataExportJob"("status", "requestedAt");
CREATE INDEX "DataExportJob_userId_requestedAt_idx" ON "DataExportJob"("userId", "requestedAt");
CREATE UNIQUE INDEX "DataExportJob_userId_idempotencyKey_key" ON "DataExportJob"("userId", "idempotencyKey");
CREATE INDEX "AccountDeletionRequest_status_requestedAt_idx" ON "AccountDeletionRequest"("status", "requestedAt");
CREATE INDEX "AccountDeletionRequest_userId_requestedAt_idx" ON "AccountDeletionRequest"("userId", "requestedAt");
CREATE UNIQUE INDEX "AccountDeletionRequest_userId_idempotencyKey_key" ON "AccountDeletionRequest"("userId", "idempotencyKey");

ALTER TABLE "CoachConversation" ADD CONSTRAINT "CoachConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachMessage" ADD CONSTRAINT "CoachMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CoachConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachMessage" ADD CONSTRAINT "CoachMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachActionProposal" ADD CONSTRAINT "CoachActionProposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachActionProposal" ADD CONSTRAINT "CoachActionProposal_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CoachConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CoachActionProposal" ADD CONSTRAINT "CoachActionProposal_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "CoachMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DataExportJob" ADD CONSTRAINT "DataExportJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountDeletionRequest" ADD CONSTRAINT "AccountDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
