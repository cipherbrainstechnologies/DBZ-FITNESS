-- Milestone 4: nutrition entities

-- CreateEnum
CREATE TYPE "NutritionMode" AS ENUM ('HABIT_ONLY', 'ESTIMATED_TARGET', 'PROFESSIONAL_TARGET');

-- CreateEnum
CREATE TYPE "NutritionTargetStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'CANCELLED', 'REVIEW_REQUIRED');

-- CreateEnum
CREATE TYPE "MealPlanStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateEnum
CREATE TYPE "MealLogSource" AS ENUM ('PLANNED', 'MANUAL', 'RESTAURANT_ESTIMATE');

-- CreateEnum
CREATE TYPE "MealLogEstimateStatus" AS ENUM ('PROVIDER', 'RECIPE_CALCULATED', 'MEMBER_ESTIMATE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "FoodState" AS ENUM ('RAW', 'COOKED', 'PREPARED');

-- CreateEnum
CREATE TYPE "NutrientDataCompleteness" AS ENUM ('COMPLETE', 'PARTIAL', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Food" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "sourceVersion" TEXT,
    "sourceRetrievedAt" TIMESTAMP(3),
    "sourceLabel" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" JSONB,
    "state" "FoodState" NOT NULL,
    "nutrientsPer100g" JSONB NOT NULL,
    "servingConversions" JSONB,
    "allergens" JSONB NOT NULL,
    "allergensKnown" BOOLEAN NOT NULL DEFAULT false,
    "ingredientCategories" JSONB NOT NULL,
    "dataCompleteness" "NutrientDataCompleteness" NOT NULL DEFAULT 'PARTIAL',
    "reviewStatus" "ContentReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "cookedYieldGrams" DECIMAL(10,2) NOT NULL,
    "portions" INTEGER NOT NULL,
    "preparationTags" JSONB,
    "mealTypes" JSONB NOT NULL,
    "cuisineTags" JSONB,
    "nutrientsPerPortion" JSONB,
    "sourceLabel" TEXT NOT NULL,
    "reviewStatus" "ContentReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" UUID NOT NULL,
    "recipeId" UUID NOT NULL,
    "foodId" UUID NOT NULL,
    "quantityGrams" DECIMAL(10,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionTarget" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "mode" "NutritionMode" NOT NULL,
    "calculationInputs" JSONB,
    "policyVersion" TEXT NOT NULL,
    "energyKcal" DECIMAL(10,2),
    "proteinG" DECIMAL(10,2),
    "fatG" DECIMAL(10,2),
    "carbohydrateG" DECIMAL(10,2),
    "explanationCodes" JSONB NOT NULL,
    "warnings" JSONB,
    "dietPreferenceId" UUID,
    "profileVersionId" UUID,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "status" "NutritionTargetStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionTargetPreview" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionTargetPreview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "targetId" UUID,
    "dietPreferenceId" UUID NOT NULL,
    "startLocalDate" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "explanationCodes" JSONB NOT NULL,
    "isPartial" BOOLEAN NOT NULL DEFAULT false,
    "status" "MealPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlanPreview" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlanPreview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedMeal" (
    "id" UUID NOT NULL,
    "mealPlanId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "localDate" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "recipeId" UUID NOT NULL,
    "portions" DECIMAL(6,2) NOT NULL DEFAULT 1,
    "nutrientSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannedMeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "plannedMealId" UUID,
    "consumedAt" TIMESTAMP(3) NOT NULL,
    "localDate" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "source" "MealLogSource" NOT NULL,
    "mealType" "MealType",
    "recipeId" UUID,
    "foodId" UUID,
    "portions" DECIMAL(6,2) NOT NULL DEFAULT 1,
    "nutrientSnapshot" JSONB NOT NULL,
    "estimateStatus" "MealLogEstimateStatus" NOT NULL,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryList" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "mealPlanId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "pantryAdjustments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryListItem" (
    "id" UUID NOT NULL,
    "groceryListId" UUID NOT NULL,
    "foodId" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "quantityGrams" DECIMAL(12,2) NOT NULL,
    "excluded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryListItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Food_key_key" ON "Food"("key");

-- CreateIndex
CREATE INDEX "Food_publicationStatus_reviewStatus_idx" ON "Food"("publicationStatus", "reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Food_provider_providerId_key" ON "Food"("provider", "providerId");

-- CreateIndex
CREATE INDEX "Recipe_publicationStatus_reviewStatus_idx" ON "Recipe"("publicationStatus", "reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_key_version_key" ON "Recipe"("key", "version");

-- CreateIndex
CREATE INDEX "RecipeIngredient_recipeId_sortOrder_idx" ON "RecipeIngredient"("recipeId", "sortOrder");

-- CreateIndex
CREATE INDEX "RecipeIngredient_foodId_idx" ON "RecipeIngredient"("foodId");

-- CreateIndex
CREATE INDEX "NutritionTarget_userId_status_effectiveFrom_idx" ON "NutritionTarget"("userId", "status", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionTarget_userId_version_key" ON "NutritionTarget"("userId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionTargetPreview_token_key" ON "NutritionTargetPreview"("token");

-- CreateIndex
CREATE INDEX "NutritionTargetPreview_userId_expiresAt_idx" ON "NutritionTargetPreview"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "MealPlan_userId_status_effectiveFrom_idx" ON "MealPlan"("userId", "status", "effectiveFrom");

-- CreateIndex
CREATE INDEX "MealPlan_targetId_idx" ON "MealPlan"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "MealPlan_userId_version_key" ON "MealPlan"("userId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "MealPlanPreview_token_key" ON "MealPlanPreview"("token");

-- CreateIndex
CREATE INDEX "MealPlanPreview_userId_expiresAt_idx" ON "MealPlanPreview"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "PlannedMeal_mealPlanId_localDate_idx" ON "PlannedMeal"("mealPlanId", "localDate");

-- CreateIndex
CREATE INDEX "PlannedMeal_userId_localDate_idx" ON "PlannedMeal"("userId", "localDate");

-- CreateIndex
CREATE INDEX "MealLog_userId_localDate_idx" ON "MealLog"("userId", "localDate");

-- CreateIndex
CREATE INDEX "MealLog_plannedMealId_idx" ON "MealLog"("plannedMealId");

-- CreateIndex
CREATE INDEX "GroceryList_userId_mealPlanId_idx" ON "GroceryList"("userId", "mealPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryList_userId_mealPlanId_version_key" ON "GroceryList"("userId", "mealPlanId", "version");

-- CreateIndex
CREATE INDEX "GroceryListItem_groceryListId_idx" ON "GroceryListItem"("groceryListId");

-- CreateIndex
CREATE INDEX "GroceryListItem_foodId_idx" ON "GroceryListItem"("foodId");

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionTarget" ADD CONSTRAINT "NutritionTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionTargetPreview" ADD CONSTRAINT "NutritionTargetPreview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "NutritionTarget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanPreview" ADD CONSTRAINT "MealPlanPreview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedMeal" ADD CONSTRAINT "PlannedMeal_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedMeal" ADD CONSTRAINT "PlannedMeal_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedMeal" ADD CONSTRAINT "PlannedMeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealLog" ADD CONSTRAINT "MealLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryList" ADD CONSTRAINT "GroceryList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryList" ADD CONSTRAINT "GroceryList_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryListItem" ADD CONSTRAINT "GroceryListItem_groceryListId_fkey" FOREIGN KEY ("groceryListId") REFERENCES "GroceryList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryListItem" ADD CONSTRAINT "GroceryListItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
