-- Milestone 6: media / rights / publications
-- Milestone 7: notification preferences, devices, intents, in-app inbox

-- CreateEnum
CREATE TYPE "MediaAssetType" AS ENUM ('IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "QuoteKind" AS ENUM (
  'ORIGINAL_COPY',
  'VERIFIED_LICENSED_QUOTE',
  'LICENSED_AUDIO_DIALOGUE'
);

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM (
  'WORKOUT_REMINDER',
  'MEAL_REMINDER',
  'WEEKLY_REVIEW',
  'MOVEMENT_BREAK',
  'MOTIVATION',
  'ACCOUNT_SECURITY'
);

-- CreateEnum
CREATE TYPE "NotificationIntentStatus" AS ENUM (
  'PENDING',
  'CLAIMED',
  'SUBMITTED',
  'DELIVERED_SIMULATED',
  'FAILED',
  'EXPIRED',
  'SUPPRESSED',
  'CANCELLED'
);

-- CreateEnum
CREATE TYPE "NotificationDeliveryChannel" AS ENUM (
  'IN_APP',
  'PUSH_SIMULATED',
  'EMAIL_TRANSACTIONAL'
);

-- CreateTable
CREATE TABLE "RightsGrant" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "rightsHolder" TEXT NOT NULL,
    "evidenceReference" TEXT,
    "permittedUses" JSONB NOT NULL,
    "platforms" JSONB,
    "territories" JSONB,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "attributionText" TEXT,
    "offlinePermission" BOOLEAN NOT NULL DEFAULT false,
    "derivativePermission" BOOLEAN NOT NULL DEFAULT false,
    "reviewer" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RightsGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "type" "MediaAssetType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "checksum" TEXT,
    "dimensions" JSONB,
    "durationSeconds" INTEGER,
    "altText" TEXT,
    "transcript" TEXT,
    "characterTags" JSONB,
    "moodTags" JSONB,
    "activityTags" JSONB,
    "explicitContent" BOOLEAN NOT NULL DEFAULT false,
    "rightsGrantIds" JSONB,
    "contentPackId" UUID,
    "reviewStatus" "ContentReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "kind" "QuoteKind" NOT NULL,
    "attribution" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "dubVersion" TEXT,
    "sourceReference" TEXT,
    "contextTags" JSONB,
    "rightsGrantIds" JSONB,
    "contentPackId" UUID,
    "reviewStatus" "ContentReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPublication" (
    "id" UUID NOT NULL,
    "mediaAssetId" UUID,
    "quoteId" UUID,
    "rightsGrantId" UUID,
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "contentVersion" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3),
    "scheduledPublishAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPublication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "categoriesEnabled" JSONB NOT NULL,
    "preferredWorkoutReminderLocalTime" TEXT,
    "mealRemindersEnabled" BOOLEAN NOT NULL DEFAULT false,
    "movementBreaksEnabled" BOOLEAN NOT NULL DEFAULT false,
    "weeklyReviewEnabled" BOOLEAN NOT NULL DEFAULT true,
    "tone" TEXT,
    "quietHoursStartLocal" TEXT NOT NULL DEFAULT '22:00',
    "quietHoursEndLocal" TEXT NOT NULL DEFAULT '08:00',
    "sleepWindowStartLocal" TEXT,
    "sleepWindowEndLocal" TEXT,
    "workWindowStartLocal" TEXT,
    "workWindowEndLocal" TEXT,
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "dailyReminderCap" INTEGER NOT NULL DEFAULT 3,
    "pauseUntil" TIMESTAMP(3),
    "sensitiveLockScreenSafe" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceRegistration" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "deviceToken" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "label" TEXT,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "preferred" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationIntent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "channel" "NotificationDeliveryChannel" NOT NULL DEFAULT 'IN_APP',
    "sourceEntityId" TEXT,
    "occurrenceKey" TEXT,
    "scheduleVersion" INTEGER NOT NULL DEFAULT 1,
    "scheduledLocalTime" TEXT,
    "timeZone" TEXT NOT NULL,
    "scheduledAtUtc" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "contentVersion" TEXT,
    "status" "NotificationIntentStatus" NOT NULL DEFAULT 'PENDING',
    "dedupeKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "claimedAt" TIMESTAMP(3),
    "claimExpiresAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "deliveryMode" TEXT NOT NULL DEFAULT 'SIMULATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InAppNotification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "intentId" UUID,
    "category" "NotificationCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "deliveryMode" TEXT NOT NULL DEFAULT 'SIMULATED',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RightsGrant_key_key" ON "RightsGrant"("key");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_key_key" ON "MediaAsset"("key");

-- CreateIndex
CREATE INDEX "MediaAsset_publicationStatus_reviewStatus_idx" ON "MediaAsset"("publicationStatus", "reviewStatus");

-- CreateIndex
CREATE INDEX "MediaAsset_contentPackId_idx" ON "MediaAsset"("contentPackId");

-- CreateIndex
CREATE INDEX "MediaAsset_type_idx" ON "MediaAsset"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_key_key" ON "Quote"("key");

-- CreateIndex
CREATE INDEX "Quote_publicationStatus_reviewStatus_kind_idx" ON "Quote"("publicationStatus", "reviewStatus", "kind");

-- CreateIndex
CREATE INDEX "Quote_contentPackId_idx" ON "Quote"("contentPackId");

-- CreateIndex
CREATE INDEX "Quote_locale_idx" ON "Quote"("locale");

-- CreateIndex
CREATE INDEX "ContentPublication_publicationStatus_expiresAt_idx" ON "ContentPublication"("publicationStatus", "expiresAt");

-- CreateIndex
CREATE INDEX "ContentPublication_mediaAssetId_idx" ON "ContentPublication"("mediaAssetId");

-- CreateIndex
CREATE INDEX "ContentPublication_quoteId_idx" ON "ContentPublication"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "DeviceRegistration_userId_deactivatedAt_idx" ON "DeviceRegistration"("userId", "deactivatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceRegistration_userId_deviceToken_key" ON "DeviceRegistration"("userId", "deviceToken");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationIntent_dedupeKey_key" ON "NotificationIntent"("dedupeKey");

-- CreateIndex
CREATE INDEX "NotificationIntent_status_scheduledAtUtc_idx" ON "NotificationIntent"("status", "scheduledAtUtc");

-- CreateIndex
CREATE INDEX "NotificationIntent_userId_status_idx" ON "NotificationIntent"("userId", "status");

-- CreateIndex
CREATE INDEX "NotificationIntent_userId_category_scheduledAtUtc_idx" ON "NotificationIntent"("userId", "category", "scheduledAtUtc");

-- CreateIndex
CREATE UNIQUE INDEX "InAppNotification_intentId_key" ON "InAppNotification"("intentId");

-- CreateIndex
CREATE INDEX "InAppNotification_userId_createdAt_idx" ON "InAppNotification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "InAppNotification_userId_readAt_idx" ON "InAppNotification"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_contentPackId_fkey" FOREIGN KEY ("contentPackId") REFERENCES "ContentPack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_contentPackId_fkey" FOREIGN KEY ("contentPackId") REFERENCES "ContentPack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPublication" ADD CONSTRAINT "ContentPublication_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPublication" ADD CONSTRAINT "ContentPublication_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPublication" ADD CONSTRAINT "ContentPublication_rightsGrantId_fkey" FOREIGN KEY ("rightsGrantId") REFERENCES "RightsGrant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceRegistration" ADD CONSTRAINT "DeviceRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationIntent" ADD CONSTRAINT "NotificationIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "NotificationIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
