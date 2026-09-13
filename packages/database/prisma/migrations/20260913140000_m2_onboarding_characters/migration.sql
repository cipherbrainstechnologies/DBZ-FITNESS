-- Milestone 2: onboarding, screening, diet, content packs, characters

-- CreateEnum
CREATE TYPE "ContentPackMode" AS ENUM ('ORIGINAL', 'DBZ_LICENSED');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'UNAVAILABLE', 'PUBLISHED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ScreeningOutcome" AS ENUM ('CLEAR', 'ADAPTATIONS_REQUIRED', 'SPECIALIST_SUPPORT', 'TEMPORARY_TRAINING_PAUSE');

-- CreateEnum
CREATE TYPE "ConsentPurpose" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'HEALTH_DATA_PROCESSING', 'MARKETING', 'ANALYTICS');

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "purpose" "ConsentPurpose" NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScreeningRecord" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "questionnaireVersion" TEXT NOT NULL,
    "answersRestricted" JSONB,
    "outcome" "ScreeningOutcome" NOT NULL,
    "restrictions" JSONB NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScreeningRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietPreference" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "pattern" TEXT NOT NULL,
    "ingredientExclusions" JSONB,
    "allergyRestrictions" JSONB,
    "cuisinePreferences" JSONB,
    "budgetPreference" TEXT,
    "preparationConstraints" JSONB,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DietPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPack" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mode" "ContentPackMode" NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "version" INTEGER NOT NULL DEFAULT 1,
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "supportedTerritories" JSONB,
    "rightsGrantIds" JSONB,
    "fallbackPackId" UUID,
    "adminNotes" TEXT,
    "rightsVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterArchetype" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "emphasis" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterArchetype_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterPresentation" (
    "id" UUID NOT NULL,
    "archetypeId" UUID NOT NULL,
    "contentPackId" UUID NOT NULL,
    "approvedName" TEXT NOT NULL,
    "artworkKey" TEXT,
    "coachingStyleKey" TEXT,
    "milestoneDefinitions" JSONB,
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterPresentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterSelection" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "presentationId" UUID NOT NULL,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingProgress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "currentStep" TEXT NOT NULL,
    "completedSteps" JSONB NOT NULL,
    "stepData" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_purpose_grantedAt_idx" ON "ConsentRecord"("userId", "purpose", "grantedAt");

-- CreateIndex
CREATE INDEX "ScreeningRecord_userId_effectiveAt_idx" ON "ScreeningRecord"("userId", "effectiveAt");

-- CreateIndex
CREATE INDEX "DietPreference_userId_effectiveAt_idx" ON "DietPreference"("userId", "effectiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "DietPreference_userId_version_key" ON "DietPreference"("userId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ContentPack_key_key" ON "ContentPack"("key");

-- CreateIndex
CREATE INDEX "ContentPack_mode_publicationStatus_idx" ON "ContentPack"("mode", "publicationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterArchetype_key_key" ON "CharacterArchetype"("key");

-- CreateIndex
CREATE INDEX "CharacterPresentation_contentPackId_publicationStatus_idx" ON "CharacterPresentation"("contentPackId", "publicationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterPresentation_archetypeId_contentPackId_key" ON "CharacterPresentation"("archetypeId", "contentPackId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterSelection_userId_key" ON "CharacterSelection"("userId");

-- CreateIndex
CREATE INDEX "CharacterSelection_presentationId_idx" ON "CharacterSelection"("presentationId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProgress_userId_key" ON "OnboardingProgress"("userId");

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningRecord" ADD CONSTRAINT "ScreeningRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietPreference" ADD CONSTRAINT "DietPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPack" ADD CONSTRAINT "ContentPack_fallbackPackId_fkey" FOREIGN KEY ("fallbackPackId") REFERENCES "ContentPack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterPresentation" ADD CONSTRAINT "CharacterPresentation_archetypeId_fkey" FOREIGN KEY ("archetypeId") REFERENCES "CharacterArchetype"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterPresentation" ADD CONSTRAINT "CharacterPresentation_contentPackId_fkey" FOREIGN KEY ("contentPackId") REFERENCES "ContentPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSelection" ADD CONSTRAINT "CharacterSelection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSelection" ADD CONSTRAINT "CharacterSelection_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "CharacterPresentation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
