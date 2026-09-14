-- Personal coach selection versioning and limited coaching memory.

ALTER TABLE "CharacterSelection" ADD COLUMN "personaVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "CharacterSelection" ADD COLUMN "coachingTone" TEXT;

CREATE TABLE "CoachingMemoryEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "valueText" TEXT NOT NULL,
    "sourceRef" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingMemoryEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoachingMemoryEntry_userId_key_key" ON "CoachingMemoryEntry"("userId", "key");
CREATE INDEX "CoachingMemoryEntry_userId_occurredAt_idx" ON "CoachingMemoryEntry"("userId", "occurredAt");

ALTER TABLE "CoachingMemoryEntry" ADD CONSTRAINT "CoachingMemoryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
