/**
 * Deterministic seed — Milestone 2–7 foundational fixtures.
 * M2 content packs, M3 training, M4 nutrition, M5 cosmetic milestones,
 * M6 ORIGINAL quotations (+ DRAFT DBZ dialogue structure without fabricated licences),
 * M7 has no catalogue seed (preferences created per user at runtime).
 * Idempotent upserts by stable keys. Does not invent clinical approval or
 * licensed DBZ rights. Nutrition values are fixture / USDA-style placeholders
 * with explicit source labels — not verified clinical data.
 *
 * Requires DATABASE_URL and applied migrations.
 */
import { PrismaClient, type PublicationStatus } from '@prisma/client';

const prisma = new PrismaClient();

const FIXTURE_SOURCE_LABEL =
  'fixture/USDA-style placeholder composition — development only; not clinical approval or verified FoodData Central import';

/** Cosmetic unlock table seeded on presentations (game level ≠ health). */
const COSMETIC_MILESTONE_DEFINITIONS = {
  policyVersion: 'cosmetic-v1',
  unlocks: [
    {
      id: 'cosmetic-level-2',
      requiredLevel: 2,
      kind: 'ACCENT',
      label: 'Accent refresh',
    },
    {
      id: 'cosmetic-level-3',
      requiredLevel: 3,
      kind: 'FRAME',
      label: 'Portrait frame',
    },
    {
      id: 'cosmetic-level-5',
      requiredLevel: 5,
      kind: 'TITLE',
      label: 'Consistency title',
    },
  ],
  note: 'Cosmetic only — game level is not a health outcome or body prediction',
} as const;

type Nutrient = {
  energyKcal: number;
  proteinG: number;
  fatG: number;
  carbohydrateG: number;
};

function scaleNutrients(per100g: Nutrient, grams: number): Nutrient {
  const f = grams / 100;
  return {
    energyKcal: per100g.energyKcal * f,
    proteinG: per100g.proteinG * f,
    fatG: per100g.fatG * f,
    carbohydrateG: per100g.carbohydrateG * f,
  };
}

function sumNutrients(parts: Nutrient[]): Nutrient {
  return parts.reduce(
    (acc, p) => ({
      energyKcal: acc.energyKcal + p.energyKcal,
      proteinG: acc.proteinG + p.proteinG,
      fatG: acc.fatG + p.fatG,
      carbohydrateG: acc.carbohydrateG + p.carbohydrateG,
    }),
    { energyKcal: 0, proteinG: 0, fatG: 0, carbohydrateG: 0 },
  );
}

const ORIGINAL_ARCHETYPES = [
  {
    key: 'explorer',
    emphasis: 'Balanced strength and conditioning',
    tone: 'Optimistic and curious',
    approvedName: 'Explorer',
    coachingStyleKey: 'explorer-coach-v1',
    sortOrder: 1,
  },
  {
    key: 'strategist',
    emphasis: 'Structured strength and discipline',
    tone: 'Direct and focused',
    approvedName: 'Strategist',
    coachingStyleKey: 'strategist-coach-v1',
    sortOrder: 2,
  },
  {
    key: 'scholar',
    emphasis: 'Sustainable strength around work and family',
    tone: 'Calm and encouraging',
    approvedName: 'Scholar',
    coachingStyleKey: 'scholar-coach-v1',
    sortOrder: 3,
  },
  {
    key: 'guardian',
    emphasis: 'Athletic conditioning and adaptability',
    tone: 'Practical and determined',
    approvedName: 'Guardian',
    coachingStyleKey: 'guardian-coach-v1',
    sortOrder: 4,
  },
  {
    key: 'titan',
    emphasis: 'Controlled strength and muscle development',
    tone: 'Powerful and composed',
    approvedName: 'Titan',
    coachingStyleKey: 'titan-coach-v1',
    sortOrder: 5,
  },
] as const;

/**
 * Placeholder rows for a future authorised DBZ_LICENSED pack.
 * Names are structural placeholders only — publicationStatus remains DRAFT /
 * UNAVAILABLE until commercial rights are verified. Not authentic licensed assets.
 */
const DBZ_PLACEHOLDER_PRESENTATIONS = [
  {
    archetypeKey: 'explorer',
    approvedName: 'Goku',
    coachingStyleKey: 'goku-coach-pending-rights',
    sortOrder: 1,
    publicationStatus: 'UNAVAILABLE' as PublicationStatus,
  },
  {
    archetypeKey: 'strategist',
    approvedName: 'Vegeta',
    coachingStyleKey: 'vegeta-coach-pending-rights',
    sortOrder: 2,
    publicationStatus: 'UNAVAILABLE' as PublicationStatus,
  },
  {
    archetypeKey: 'scholar',
    approvedName: 'Gohan',
    coachingStyleKey: 'gohan-coach-pending-rights',
    sortOrder: 3,
    publicationStatus: 'DRAFT' as PublicationStatus,
  },
  {
    archetypeKey: 'guardian',
    approvedName: 'Trunks',
    coachingStyleKey: 'trunks-coach-pending-rights',
    sortOrder: 4,
    publicationStatus: 'DRAFT' as PublicationStatus,
  },
  {
    archetypeKey: 'titan',
    approvedName: 'Broly',
    coachingStyleKey: 'broly-coach-pending-rights',
    sortOrder: 5,
    publicationStatus: 'UNAVAILABLE' as PublicationStatus,
  },
] as const;

/** Original exercise catalogue — general wellness descriptions only. */
const EXERCISES = [
  {
    key: 'bodyweight-squat',
    name: 'Bodyweight squat',
    movementPattern: 'SQUAT',
    equipment: ['BODYWEIGHT'],
    difficulty: 'BEGINNER',
    instructions:
      'Stand with feet roughly shoulder-width. Bend at hips and knees to lower, then stand. Stop if you feel sharp pain.',
    restrictions: [],
    adaptations: ['Reduce depth', 'Hold a stable support'],
    preferenceTags: ['general_fitness', 'home'],
  },
  {
    key: 'hip-hinge-good-morning',
    name: 'Standing hip hinge',
    movementPattern: 'HINGE',
    equipment: ['BODYWEIGHT'],
    difficulty: 'BEGINNER',
    instructions:
      'Soft knees, hinge at the hips while keeping a long spine, then return upright. Move within a comfortable range.',
    restrictions: [],
    adaptations: ['Reduce range of motion'],
    preferenceTags: ['general_fitness', 'home'],
  },
  {
    key: 'incline-push-up',
    name: 'Incline push-up',
    movementPattern: 'PUSH',
    equipment: ['BODYWEIGHT'],
    difficulty: 'BEGINNER',
    instructions:
      'Hands on a sturdy elevated surface. Lower chest toward the surface, then press away. Keep ribs down.',
    restrictions: [],
    adaptations: ['Use a higher surface', 'Reduce range'],
    preferenceTags: ['general_fitness', 'home'],
  },
  {
    key: 'table-row',
    name: 'Table bodyweight row',
    movementPattern: 'PULL',
    equipment: ['BODYWEIGHT'],
    difficulty: 'BEGINNER',
    instructions:
      'Lie under a sturdy table edge, grip, and pull your chest toward the edge. Only use furniture rated for this load.',
    restrictions: [],
    adaptations: ['Bend knees to reduce load'],
    preferenceTags: ['general_fitness', 'home'],
  },
  {
    key: 'dead-bug',
    name: 'Dead bug',
    movementPattern: 'CORE',
    equipment: ['BODYWEIGHT'],
    difficulty: 'BEGINNER',
    instructions:
      'Lie on your back, opposite arm and leg reach away slowly while keeping the lower back gently pressed down.',
    restrictions: [],
    adaptations: ['Reduce limb range'],
    preferenceTags: ['general_fitness', 'mobility'],
  },
  {
    key: 'march-in-place',
    name: 'March in place',
    movementPattern: 'LOCOMOTION',
    equipment: ['BODYWEIGHT'],
    difficulty: 'BEGINNER',
    instructions:
      'March gently in place lifting knees to a comfortable height. Use as a warm-up or short conditioning bout.',
    restrictions: [],
    adaptations: ['Seated marching'],
    preferenceTags: ['conditioning', 'home'],
  },
  {
    key: 'dumbbell-goblet-squat',
    name: 'Dumbbell goblet squat',
    movementPattern: 'SQUAT',
    equipment: ['DUMBBELL'],
    difficulty: 'BEGINNER',
    instructions:
      'Hold one dumbbell at the chest. Squat to a comfortable depth and stand. Choose a load you can control.',
    restrictions: [],
    adaptations: ['Use a lighter dumbbell', 'Reduce depth'],
    preferenceTags: ['strength', 'home'],
  },
  {
    key: 'dumbbell-row',
    name: 'Single-arm dumbbell row',
    movementPattern: 'PULL',
    equipment: ['DUMBBELL'],
    difficulty: 'BEGINNER',
    instructions:
      'Support one hand on a bench or sturdy surface. Row the dumbbell toward the hip without twisting the torso.',
    restrictions: [],
    adaptations: ['Reduce range', 'Use a lighter load'],
    preferenceTags: ['strength', 'home'],
  },
] as const;

async function upsertArchetypes() {
  const byKey = new Map<string, string>();
  for (const archetype of ORIGINAL_ARCHETYPES) {
    const row = await prisma.characterArchetype.upsert({
      where: { key: archetype.key },
      create: {
        key: archetype.key,
        emphasis: archetype.emphasis,
        tone: archetype.tone,
      },
      update: {
        emphasis: archetype.emphasis,
        tone: archetype.tone,
      },
    });
    byKey.set(archetype.key, row.id);
  }
  return byKey;
}

async function upsertOriginalPack(archetypeIds: Map<string, string>) {
  const pack = await prisma.contentPack.upsert({
    where: { key: 'original-en-v1' },
    create: {
      key: 'original-en-v1',
      name: 'Saiyan Ascend Original',
      mode: 'ORIGINAL',
      locale: 'en',
      version: 1,
      publicationStatus: 'PUBLISHED',
      supportedTerritories: ['*'],
      rightsGrantIds: [],
      adminNotes: 'Original product archetypes; no franchise licence required.',
      rightsVerifiedAt: new Date('2026-09-13T00:00:00.000Z'),
    },
    update: {
      name: 'Saiyan Ascend Original',
      publicationStatus: 'PUBLISHED',
      adminNotes: 'Original product archetypes; no franchise licence required.',
    },
  });

  for (const archetype of ORIGINAL_ARCHETYPES) {
    const archetypeId = archetypeIds.get(archetype.key);
    if (!archetypeId) {
      throw new Error(`Missing archetype ${archetype.key}`);
    }
    await prisma.characterPresentation.upsert({
      where: {
        archetypeId_contentPackId: {
          archetypeId,
          contentPackId: pack.id,
        },
      },
      create: {
        archetypeId,
        contentPackId: pack.id,
        approvedName: archetype.approvedName,
        artworkKey: null,
        coachingStyleKey: archetype.coachingStyleKey,
        milestoneDefinitions: COSMETIC_MILESTONE_DEFINITIONS,
        publicationStatus: 'PUBLISHED',
        sortOrder: archetype.sortOrder,
      },
      update: {
        approvedName: archetype.approvedName,
        coachingStyleKey: archetype.coachingStyleKey,
        milestoneDefinitions: COSMETIC_MILESTONE_DEFINITIONS,
        publicationStatus: 'PUBLISHED',
        sortOrder: archetype.sortOrder,
      },
    });
  }

  return pack;
}

async function upsertDbzLicensedPack(
  archetypeIds: Map<string, string>,
  fallbackPackId: string,
) {
  const pack = await prisma.contentPack.upsert({
    where: { key: 'dbz-licensed-en-v1' },
    create: {
      key: 'dbz-licensed-en-v1',
      name: 'DBZ Licensed (pending rights)',
      mode: 'DBZ_LICENSED',
      locale: 'en',
      version: 1,
      publicationStatus: 'DRAFT',
      supportedTerritories: [],
      rightsGrantIds: [],
      fallbackPackId,
      adminNotes:
        'Structural placeholders for Goku/Vegeta/Gohan/Trunks/Broly. Do not publish until commercial rights grants are verified. Not authentic licensed assets.',
      rightsVerifiedAt: null,
    },
    update: {
      publicationStatus: 'DRAFT',
      fallbackPackId,
      rightsVerifiedAt: null,
      adminNotes:
        'Structural placeholders for Goku/Vegeta/Gohan/Trunks/Broly. Do not publish until commercial rights grants are verified. Not authentic licensed assets.',
    },
  });

  for (const item of DBZ_PLACEHOLDER_PRESENTATIONS) {
    const archetypeId = archetypeIds.get(item.archetypeKey);
    if (!archetypeId) {
      throw new Error(`Missing archetype ${item.archetypeKey}`);
    }
    await prisma.characterPresentation.upsert({
      where: {
        archetypeId_contentPackId: {
          archetypeId,
          contentPackId: pack.id,
        },
      },
      create: {
        archetypeId,
        contentPackId: pack.id,
        approvedName: item.approvedName,
        artworkKey: null,
        coachingStyleKey: item.coachingStyleKey,
        milestoneDefinitions: {
          ...COSMETIC_MILESTONE_DEFINITIONS,
          policyVersion: 'cosmetic-v1-pending-rights',
          rightsStatus: 'UNVERIFIED',
        },
        publicationStatus: item.publicationStatus,
        sortOrder: item.sortOrder,
      },
      update: {
        approvedName: item.approvedName,
        coachingStyleKey: item.coachingStyleKey,
        milestoneDefinitions: {
          ...COSMETIC_MILESTONE_DEFINITIONS,
          policyVersion: 'cosmetic-v1-pending-rights',
          rightsStatus: 'UNVERIFIED',
        },
        publicationStatus: item.publicationStatus,
        sortOrder: item.sortOrder,
      },
    });
  }

  return pack;
}

async function upsertExercises() {
  const byKey = new Map<string, string>();
  for (const exercise of EXERCISES) {
    const row = await prisma.exercise.upsert({
      where: { key: exercise.key },
      create: {
        key: exercise.key,
        name: exercise.name,
        movementPattern: exercise.movementPattern,
        equipment: [...exercise.equipment],
        difficulty: exercise.difficulty,
        instructions: exercise.instructions,
        restrictions: [...exercise.restrictions],
        adaptations: [...exercise.adaptations],
        preferenceTags: [...exercise.preferenceTags],
        reviewStatus: 'APPROVED',
        publicationStatus: 'PUBLISHED',
      },
      update: {
        name: exercise.name,
        movementPattern: exercise.movementPattern,
        equipment: [...exercise.equipment],
        difficulty: exercise.difficulty,
        instructions: exercise.instructions,
        restrictions: [...exercise.restrictions],
        adaptations: [...exercise.adaptations],
        preferenceTags: [...exercise.preferenceTags],
        reviewStatus: 'APPROVED',
        publicationStatus: 'PUBLISHED',
      },
    });
    byKey.set(exercise.key, row.id);
  }
  return byKey;
}

async function upsertProgrammeTemplates(exerciseIds: Map<string, string>) {
  const requireExercise = (key: string) => {
    const id = exerciseIds.get(key);
    if (!id) {
      throw new Error(`Missing exercise ${key}`);
    }
    return id;
  };

  // Published beginner home bodyweight template (2 days).
  const published = await upsertTemplateWithSessions({
    key: 'beginner-home-bodyweight-2d',
    version: 1,
    name: 'Beginner home bodyweight (2 days)',
    goalTags: ['general_fitness'],
    preferenceTags: ['home', 'bodyweight', 'general_fitness'],
    eligibility: {
      requiredEquipment: ['BODYWEIGHT'],
      experienceLevels: ['BEGINNER', 'RETURNING'],
      minDaysPerWeek: 2,
      maxDaysPerWeek: 3,
      maxSessionMinutes: 30,
    },
    scheduleRules: { pattern: 'every_other_day', sessionsPerWeek: 2 },
    reviewStatus: 'APPROVED',
    publicationStatus: 'PUBLISHED',
    sessions: [
      {
        dayPattern: 'DAY_A',
        estimatedDuration: 25,
        sortOrder: 0,
        exercises: [
          {
            exerciseKey: 'march-in-place',
            sortOrder: 0,
            prescription: {
              priority: 'CORE',
              sets: 1,
              repMin: 1,
              repMax: 1,
              restSeconds: 0,
              estimatedMinutes: 3,
              notes: 'Warm-up',
            },
          },
          {
            exerciseKey: 'bodyweight-squat',
            sortOrder: 1,
            prescription: {
              priority: 'CORE',
              sets: 2,
              repMin: 8,
              repMax: 12,
              restSeconds: 60,
              estimatedMinutes: 8,
            },
          },
          {
            exerciseKey: 'incline-push-up',
            sortOrder: 2,
            prescription: {
              priority: 'CORE',
              sets: 2,
              repMin: 6,
              repMax: 10,
              restSeconds: 60,
              estimatedMinutes: 7,
            },
          },
          {
            exerciseKey: 'dead-bug',
            sortOrder: 3,
            prescription: {
              priority: 'OPTIONAL',
              sets: 2,
              repMin: 6,
              repMax: 8,
              restSeconds: 45,
              estimatedMinutes: 5,
            },
          },
        ],
      },
      {
        dayPattern: 'DAY_B',
        estimatedDuration: 25,
        sortOrder: 1,
        exercises: [
          {
            exerciseKey: 'march-in-place',
            sortOrder: 0,
            prescription: {
              priority: 'CORE',
              sets: 1,
              repMin: 1,
              repMax: 1,
              restSeconds: 0,
              estimatedMinutes: 3,
              notes: 'Warm-up',
            },
          },
          {
            exerciseKey: 'hip-hinge-good-morning',
            sortOrder: 1,
            prescription: {
              priority: 'CORE',
              sets: 2,
              repMin: 8,
              repMax: 12,
              restSeconds: 60,
              estimatedMinutes: 7,
            },
          },
          {
            exerciseKey: 'table-row',
            sortOrder: 2,
            prescription: {
              priority: 'CORE',
              sets: 2,
              repMin: 6,
              repMax: 10,
              restSeconds: 60,
              estimatedMinutes: 7,
            },
          },
          {
            exerciseKey: 'dead-bug',
            sortOrder: 3,
            prescription: {
              priority: 'OPTIONAL',
              sets: 2,
              repMin: 6,
              repMax: 8,
              restSeconds: 45,
              estimatedMinutes: 5,
            },
          },
        ],
      },
    ],
    requireExercise,
  });

  // Draft dumbbell home template — not published; for review workflow only.
  const draft = await upsertTemplateWithSessions({
    key: 'beginner-home-dumbbell-2d',
    version: 1,
    name: 'Beginner home dumbbell (2 days) — draft',
    goalTags: ['strength'],
    preferenceTags: ['home', 'strength'],
    eligibility: {
      requiredEquipment: ['DUMBBELL'],
      experienceLevels: ['BEGINNER', 'RETURNING'],
      minDaysPerWeek: 2,
      maxDaysPerWeek: 3,
      maxSessionMinutes: 35,
    },
    scheduleRules: { pattern: 'every_other_day', sessionsPerWeek: 2 },
    reviewStatus: 'DRAFT',
    publicationStatus: 'DRAFT',
    sessions: [
      {
        dayPattern: 'DAY_A',
        estimatedDuration: 30,
        sortOrder: 0,
        exercises: [
          {
            exerciseKey: 'march-in-place',
            sortOrder: 0,
            prescription: {
              priority: 'CORE',
              sets: 1,
              repMin: 1,
              repMax: 1,
              restSeconds: 0,
              estimatedMinutes: 3,
            },
          },
          {
            exerciseKey: 'dumbbell-goblet-squat',
            sortOrder: 1,
            prescription: {
              priority: 'CORE',
              sets: 2,
              repMin: 8,
              repMax: 12,
              restSeconds: 75,
              estimatedMinutes: 10,
            },
          },
          {
            exerciseKey: 'dumbbell-row',
            sortOrder: 2,
            prescription: {
              priority: 'CORE',
              sets: 2,
              repMin: 8,
              repMax: 12,
              restSeconds: 75,
              estimatedMinutes: 10,
            },
          },
        ],
      },
    ],
    requireExercise,
  });

  return { published, draft };
}

async function upsertTemplateWithSessions(input: {
  key: string;
  version: number;
  name: string;
  goalTags: string[];
  preferenceTags: string[];
  eligibility: Record<string, unknown>;
  scheduleRules: Record<string, unknown>;
  reviewStatus: 'DRAFT' | 'APPROVED';
  publicationStatus: PublicationStatus;
  sessions: Array<{
    dayPattern: string;
    estimatedDuration: number;
    sortOrder: number;
    exercises: Array<{
      exerciseKey: string;
      sortOrder: number;
      prescription: Record<string, unknown>;
    }>;
  }>;
  requireExercise: (key: string) => string;
}) {
  const existing = await prisma.programmeTemplate.findUnique({
    where: {
      key_version: { key: input.key, version: input.version },
    },
    include: { sessions: true },
  });

  const template =
    existing ??
    (await prisma.programmeTemplate.create({
      data: {
        key: input.key,
        version: input.version,
        name: input.name,
        goalTags: input.goalTags,
        preferenceTags: input.preferenceTags,
        eligibility: input.eligibility,
        scheduleRules: input.scheduleRules,
        reviewStatus: input.reviewStatus,
        publicationStatus: input.publicationStatus,
      },
    }));

  if (existing) {
    await prisma.programmeTemplate.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        goalTags: input.goalTags,
        preferenceTags: input.preferenceTags,
        eligibility: input.eligibility,
        scheduleRules: input.scheduleRules,
        reviewStatus: input.reviewStatus,
        publicationStatus: input.publicationStatus,
      },
    });
    // Rebuild sessions for idempotent seed (small catalogue only).
    await prisma.templateExercise.deleteMany({
      where: { session: { templateId: existing.id } },
    });
    await prisma.templateSession.deleteMany({ where: { templateId: existing.id } });
  }

  for (const session of input.sessions) {
    const createdSession = await prisma.templateSession.create({
      data: {
        templateId: template.id,
        dayPattern: session.dayPattern,
        estimatedDuration: session.estimatedDuration,
        sortOrder: session.sortOrder,
        isOptional: false,
      },
    });
    for (const exercise of session.exercises) {
      await prisma.templateExercise.create({
        data: {
          templateSessionId: createdSession.id,
          exerciseId: input.requireExercise(exercise.exerciseKey),
          sortOrder: exercise.sortOrder,
          prescription: exercise.prescription,
        },
      });
    }
  }

  return template;
}

/** ORIGINAL Indian-friendly food fixtures — traceable placeholder labels only. */
const FOODS = [
  {
    key: 'cooked-basmati-rice',
    providerId: 'fixture-rice-001',
    name: 'Cooked basmati rice',
    state: 'COOKED' as const,
    nutrientsPer100g: { energyKcal: 121, proteinG: 2.7, fatG: 0.3, carbohydrateG: 25.2 },
    allergens: [] as string[],
    allergensKnown: true,
    ingredientCategories: ['PLANT'],
  },
  {
    key: 'cooked-toor-dal',
    providerId: 'fixture-dal-001',
    name: 'Cooked toor dal',
    state: 'COOKED' as const,
    nutrientsPer100g: { energyKcal: 114, proteinG: 7.6, fatG: 0.4, carbohydrateG: 19.5 },
    allergens: [],
    allergensKnown: true,
    ingredientCategories: ['PLANT'],
  },
  {
    key: 'chapati-whole-wheat',
    providerId: 'fixture-roti-001',
    name: 'Whole-wheat chapati',
    state: 'COOKED' as const,
    nutrientsPer100g: { energyKcal: 297, proteinG: 9.6, fatG: 4.2, carbohydrateG: 51.0 },
    allergens: ['GLUTEN'],
    allergensKnown: true,
    ingredientCategories: ['PLANT'],
  },
  {
    key: 'paneer',
    providerId: 'fixture-paneer-001',
    name: 'Paneer',
    state: 'RAW' as const,
    nutrientsPer100g: { energyKcal: 265, proteinG: 18.3, fatG: 20.8, carbohydrateG: 1.2 },
    allergens: ['MILK'],
    allergensKnown: true,
    ingredientCategories: ['DAIRY'],
  },
  {
    key: 'curd-plain',
    providerId: 'fixture-curd-001',
    name: 'Plain curd (dahi)',
    state: 'PREPARED' as const,
    nutrientsPer100g: { energyKcal: 61, proteinG: 3.5, fatG: 3.3, carbohydrateG: 4.7 },
    allergens: ['MILK'],
    allergensKnown: true,
    ingredientCategories: ['DAIRY'],
  },
  {
    key: 'chickpeas-cooked',
    providerId: 'fixture-chana-001',
    name: 'Cooked chickpeas',
    state: 'COOKED' as const,
    nutrientsPer100g: { energyKcal: 164, proteinG: 8.9, fatG: 2.6, carbohydrateG: 27.4 },
    allergens: [],
    allergensKnown: true,
    ingredientCategories: ['PLANT'],
  },
  {
    key: 'tofu-firm',
    providerId: 'fixture-tofu-001',
    name: 'Firm tofu',
    state: 'PREPARED' as const,
    nutrientsPer100g: { energyKcal: 144, proteinG: 17.3, fatG: 8.7, carbohydrateG: 2.8 },
    allergens: ['SOY'],
    allergensKnown: true,
    ingredientCategories: ['PLANT'],
  },
  {
    key: 'egg-whole-boiled',
    providerId: 'fixture-egg-001',
    name: 'Boiled whole egg',
    state: 'COOKED' as const,
    nutrientsPer100g: { energyKcal: 155, proteinG: 12.6, fatG: 10.6, carbohydrateG: 1.1 },
    allergens: ['EGG'],
    allergensKnown: true,
    ingredientCategories: ['EGG'],
  },
  {
    key: 'chicken-breast-cooked',
    providerId: 'fixture-chicken-001',
    name: 'Cooked chicken breast',
    state: 'COOKED' as const,
    nutrientsPer100g: { energyKcal: 165, proteinG: 31.0, fatG: 3.6, carbohydrateG: 0 },
    allergens: [],
    allergensKnown: true,
    ingredientCategories: ['POULTRY'],
  },
  {
    key: 'peanut-chutney',
    providerId: 'fixture-peanut-001',
    name: 'Peanut chutney',
    state: 'PREPARED' as const,
    nutrientsPer100g: { energyKcal: 520, proteinG: 22.0, fatG: 44.0, carbohydrateG: 16.0 },
    allergens: ['PEANUT'],
    allergensKnown: true,
    ingredientCategories: ['PLANT'],
  },
  {
    key: 'onion-raw',
    providerId: 'fixture-onion-001',
    name: 'Raw onion',
    state: 'RAW' as const,
    nutrientsPer100g: { energyKcal: 40, proteinG: 1.1, fatG: 0.1, carbohydrateG: 9.3 },
    allergens: [],
    allergensKnown: true,
    ingredientCategories: ['PLANT'],
  },
  {
    key: 'tomato-raw',
    providerId: 'fixture-tomato-001',
    name: 'Raw tomato',
    state: 'RAW' as const,
    nutrientsPer100g: { energyKcal: 18, proteinG: 0.9, fatG: 0.2, carbohydrateG: 3.9 },
    allergens: [],
    allergensKnown: true,
    ingredientCategories: ['PLANT'],
  },
  {
    key: 'cooking-oil-neutral',
    providerId: 'fixture-oil-001',
    name: 'Neutral cooking oil',
    state: 'RAW' as const,
    nutrientsPer100g: { energyKcal: 884, proteinG: 0, fatG: 100, carbohydrateG: 0 },
    allergens: [],
    allergensKnown: true,
    ingredientCategories: ['PLANT'],
  },
  {
    key: 'spinach-cooked',
    providerId: 'fixture-spinach-001',
    name: 'Cooked spinach',
    state: 'COOKED' as const,
    nutrientsPer100g: { energyKcal: 23, proteinG: 2.9, fatG: 0.3, carbohydrateG: 3.6 },
    allergens: [],
    allergensKnown: true,
    ingredientCategories: ['PLANT'],
  },
] as const;

type RecipeSeed = {
  key: string;
  name: string;
  instructions: string;
  cookedYieldGrams: number;
  portions: number;
  mealTypes: string[];
  preparationTags: string[];
  cuisineTags: string[];
  ingredients: Array<{ foodKey: string; quantityGrams: number }>;
};

const RECIPES: RecipeSeed[] = [
  {
    key: 'dal-rice-bowl',
    name: 'Dal and rice bowl',
    instructions: 'Warm dal, serve over rice. Original fixture recipe.',
    cookedYieldGrams: 450,
    portions: 2,
    mealTypes: ['LUNCH', 'DINNER'],
    preparationTags: ['BATCH_COOKING', 'OFFICE_REHEAT'],
    cuisineTags: ['INDIAN'],
    ingredients: [
      { foodKey: 'cooked-toor-dal', quantityGrams: 200 },
      { foodKey: 'cooked-basmati-rice', quantityGrams: 200 },
      { foodKey: 'cooking-oil-neutral', quantityGrams: 5 },
    ],
  },
  {
    key: 'chana-salad-bowl',
    name: 'Chana salad bowl',
    instructions: 'Combine chickpeas with tomato and onion. No reheating required.',
    cookedYieldGrams: 350,
    portions: 1,
    mealTypes: ['LUNCH', 'SNACK'],
    preparationTags: ['PACKED_LUNCH', 'NO_REHEATING'],
    cuisineTags: ['INDIAN'],
    ingredients: [
      { foodKey: 'chickpeas-cooked', quantityGrams: 200 },
      { foodKey: 'tomato-raw', quantityGrams: 80 },
      { foodKey: 'onion-raw', quantityGrams: 40 },
    ],
  },
  {
    key: 'paneer-roti-plate',
    name: 'Paneer with roti',
    instructions: 'Pan-warm paneer; serve with chapati. Vegetarian dairy meal.',
    cookedYieldGrams: 280,
    portions: 1,
    mealTypes: ['LUNCH', 'DINNER'],
    preparationTags: ['QUICK'],
    cuisineTags: ['INDIAN'],
    ingredients: [
      { foodKey: 'paneer', quantityGrams: 100 },
      { foodKey: 'chapati-whole-wheat', quantityGrams: 80 },
      { foodKey: 'cooking-oil-neutral', quantityGrams: 5 },
      { foodKey: 'spinach-cooked', quantityGrams: 60 },
    ],
  },
  {
    key: 'curd-rice',
    name: 'Curd rice',
    instructions: 'Mix curd with cooled rice. Cool office-friendly option.',
    cookedYieldGrams: 300,
    portions: 1,
    mealTypes: ['LUNCH', 'SNACK'],
    preparationTags: ['PACKED_LUNCH', 'NO_REHEATING'],
    cuisineTags: ['INDIAN'],
    ingredients: [
      { foodKey: 'curd-plain', quantityGrams: 150 },
      { foodKey: 'cooked-basmati-rice', quantityGrams: 120 },
    ],
  },
  {
    key: 'tofu-spinach-bowl',
    name: 'Tofu spinach bowl',
    instructions: 'Sauté tofu with spinach; serve over rice. Vegan option.',
    cookedYieldGrams: 400,
    portions: 2,
    mealTypes: ['LUNCH', 'DINNER'],
    preparationTags: ['BATCH_COOKING', 'OFFICE_REHEAT'],
    cuisineTags: ['INDIAN', 'INTERNATIONAL'],
    ingredients: [
      { foodKey: 'tofu-firm', quantityGrams: 150 },
      { foodKey: 'spinach-cooked', quantityGrams: 100 },
      { foodKey: 'cooked-basmati-rice', quantityGrams: 150 },
      { foodKey: 'cooking-oil-neutral', quantityGrams: 8 },
    ],
  },
  {
    key: 'egg-bhurji-roti',
    name: 'Egg bhurji with roti',
    instructions: 'Scramble eggs with onion and tomato; serve with chapati.',
    cookedYieldGrams: 320,
    portions: 1,
    mealTypes: ['BREAKFAST', 'LUNCH'],
    preparationTags: ['QUICK_BREAKFAST'],
    cuisineTags: ['INDIAN'],
    ingredients: [
      { foodKey: 'egg-whole-boiled', quantityGrams: 100 },
      { foodKey: 'onion-raw', quantityGrams: 40 },
      { foodKey: 'tomato-raw', quantityGrams: 50 },
      { foodKey: 'chapati-whole-wheat', quantityGrams: 80 },
      { foodKey: 'cooking-oil-neutral', quantityGrams: 8 },
    ],
  },
  {
    key: 'boiled-egg-rice',
    name: 'Boiled egg rice bowl',
    instructions: 'Serve sliced boiled egg over rice with tomato.',
    cookedYieldGrams: 350,
    portions: 1,
    mealTypes: ['BREAKFAST', 'LUNCH'],
    preparationTags: ['PACKED_LUNCH'],
    cuisineTags: ['INDIAN'],
    ingredients: [
      { foodKey: 'egg-whole-boiled', quantityGrams: 100 },
      { foodKey: 'cooked-basmati-rice', quantityGrams: 180 },
      { foodKey: 'tomato-raw', quantityGrams: 50 },
    ],
  },
  {
    key: 'chicken-rice-bowl',
    name: 'Chicken and rice bowl',
    instructions: 'Serve cooked chicken over rice with tomato.',
    cookedYieldGrams: 400,
    portions: 1,
    mealTypes: ['LUNCH', 'DINNER'],
    preparationTags: ['OFFICE_REHEAT', 'BATCH_COOKING'],
    cuisineTags: ['INDIAN'],
    ingredients: [
      { foodKey: 'chicken-breast-cooked', quantityGrams: 120 },
      { foodKey: 'cooked-basmati-rice', quantityGrams: 180 },
      { foodKey: 'tomato-raw', quantityGrams: 40 },
      { foodKey: 'cooking-oil-neutral', quantityGrams: 5 },
    ],
  },
  {
    key: 'peanut-chutney-idli-style-snack',
    name: 'Rice with peanut chutney snack',
    instructions:
      'Fixture snack including peanut chutney — for allergy exclusion tests.',
    cookedYieldGrams: 200,
    portions: 1,
    mealTypes: ['SNACK', 'BREAKFAST'],
    preparationTags: ['QUICK'],
    cuisineTags: ['INDIAN'],
    ingredients: [
      { foodKey: 'cooked-basmati-rice', quantityGrams: 120 },
      { foodKey: 'peanut-chutney', quantityGrams: 30 },
    ],
  },
  {
    key: 'spinach-chapati-wrap',
    name: 'Spinach chapati wrap',
    instructions: 'Warm chapati with spinach filling. Vegan when oil is plant-based.',
    cookedYieldGrams: 220,
    portions: 1,
    mealTypes: ['BREAKFAST', 'SNACK', 'LUNCH'],
    preparationTags: ['QUICK_BREAKFAST', 'PACKED_LUNCH'],
    cuisineTags: ['INDIAN'],
    ingredients: [
      { foodKey: 'chapati-whole-wheat', quantityGrams: 80 },
      { foodKey: 'spinach-cooked', quantityGrams: 100 },
      { foodKey: 'cooking-oil-neutral', quantityGrams: 5 },
    ],
  },
];

async function upsertFoods(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const food of FOODS) {
    const row = await prisma.food.upsert({
      where: { key: food.key },
      create: {
        key: food.key,
        provider: 'SAIYAN_FIXTURE',
        providerId: food.providerId,
        sourceVersion: 'fixture-v1',
        sourceRetrievedAt: new Date('2026-09-13T00:00:00.000Z'),
        sourceLabel: FIXTURE_SOURCE_LABEL,
        name: food.name,
        aliases: [],
        state: food.state,
        nutrientsPer100g: food.nutrientsPer100g,
        servingConversions: [{ label: '100g', grams: 100 }],
        allergens: [...food.allergens],
        allergensKnown: food.allergensKnown,
        ingredientCategories: [...food.ingredientCategories],
        dataCompleteness: 'PARTIAL',
        reviewStatus: 'APPROVED',
        publicationStatus: 'PUBLISHED',
      },
      update: {
        name: food.name,
        sourceLabel: FIXTURE_SOURCE_LABEL,
        nutrientsPer100g: food.nutrientsPer100g,
        allergens: [...food.allergens],
        allergensKnown: food.allergensKnown,
        ingredientCategories: [...food.ingredientCategories],
        publicationStatus: 'PUBLISHED',
        reviewStatus: 'APPROVED',
      },
    });
    ids.set(food.key, row.id);
  }
  return ids;
}

async function upsertRecipes(foodIds: Map<string, string>): Promise<void> {
  const requireFood = (key: string): string => {
    const id = foodIds.get(key);
    if (!id) {
      throw new Error(`Missing food key in seed: ${key}`);
    }
    return id;
  };

  for (const recipe of RECIPES) {
    const nutrientParts = recipe.ingredients.map((ing) => {
      const food = FOODS.find((f) => f.key === ing.foodKey);
      if (!food) {
        throw new Error(`Unknown food in recipe ${recipe.key}: ${ing.foodKey}`);
      }
      return scaleNutrients(food.nutrientsPer100g, ing.quantityGrams);
    });
    const batch = sumNutrients(nutrientParts);
    const nutrientsPerPortion = {
      energyKcal: batch.energyKcal / recipe.portions,
      proteinG: batch.proteinG / recipe.portions,
      fatG: batch.fatG / recipe.portions,
      carbohydrateG: batch.carbohydrateG / recipe.portions,
    };

    const existing = await prisma.recipe.findUnique({
      where: { key_version: { key: recipe.key, version: 1 } },
      include: { ingredients: true },
    });

    const row =
      existing ??
      (await prisma.recipe.create({
        data: {
          key: recipe.key,
          version: 1,
          name: recipe.name,
          instructions: recipe.instructions,
          cookedYieldGrams: recipe.cookedYieldGrams,
          portions: recipe.portions,
          preparationTags: recipe.preparationTags,
          mealTypes: recipe.mealTypes,
          cuisineTags: recipe.cuisineTags,
          nutrientsPerPortion,
          sourceLabel: FIXTURE_SOURCE_LABEL,
          reviewStatus: 'APPROVED',
          publicationStatus: 'PUBLISHED',
        },
      }));

    if (existing) {
      await prisma.recipe.update({
        where: { id: existing.id },
        data: {
          name: recipe.name,
          instructions: recipe.instructions,
          cookedYieldGrams: recipe.cookedYieldGrams,
          portions: recipe.portions,
          preparationTags: recipe.preparationTags,
          mealTypes: recipe.mealTypes,
          cuisineTags: recipe.cuisineTags,
          nutrientsPerPortion,
          sourceLabel: FIXTURE_SOURCE_LABEL,
          reviewStatus: 'APPROVED',
          publicationStatus: 'PUBLISHED',
        },
      });
      await prisma.recipeIngredient.deleteMany({ where: { recipeId: existing.id } });
    }

    let sortOrder = 0;
    for (const ing of recipe.ingredients) {
      await prisma.recipeIngredient.create({
        data: {
          recipeId: row.id,
          foodId: requireFood(ing.foodKey),
          quantityGrams: ing.quantityGrams,
          sortOrder,
        },
      });
      sortOrder += 1;
    }
  }
}

/** Product-owned motivational lines — never authentic Dragon Ball dialogue. */
const ORIGINAL_QUOTATIONS = [
  {
    key: 'original-quote-next-level',
    text: 'Your next level starts with today\'s small effort.',
    contextTags: ['motivation', 'consistency'],
  },
  {
    key: 'original-quote-control-movement',
    text: 'Control the movement. Own the progress.',
    contextTags: ['training', 'form'],
  },
  {
    key: 'original-quote-short-session',
    text: 'A short session still moves your story forward.',
    contextTags: ['busy-day', 'motivation'],
  },
  {
    key: 'original-quote-recovery',
    text: 'Recovery prepares you for the next challenge.',
    contextTags: ['recovery', 'rest'],
  },
  {
    key: 'original-quote-return-plan',
    text: 'Return with a plan, not punishment.',
    contextTags: ['missed-session', 'wellbeing'],
  },
  {
    key: 'original-quote-real-life',
    text: 'Build a routine your real life can support.',
    contextTags: ['consistency', 'work-life'],
  },
] as const;

/**
 * Admin-ready DRAFT structure for future licensed DBZ dialogue.
 * No fabricated licence evidence — publicationStatus stays DRAFT;
 * rightsGrantIds empty; attribution is explicitly non-authentic.
 */
const DBZ_DIALOGUE_DRAFT_STRUCTURE = [
  {
    key: 'dbz-dialogue-placeholder-goku-pending',
    text: '[PENDING RIGHTS] Licensed English dialogue placeholder — do not publish or attribute as authentic until a verified RightsGrant exists.',
    kind: 'LICENSED_AUDIO_DIALOGUE' as const,
    attribution: 'Pending verified licence — not authentic dialogue',
    speakerPlaceholder: 'Goku',
  },
  {
    key: 'dbz-dialogue-placeholder-vegeta-pending',
    text: '[PENDING RIGHTS] Licensed English dialogue placeholder — do not publish or attribute as authentic until a verified RightsGrant exists.',
    kind: 'LICENSED_AUDIO_DIALOGUE' as const,
    attribution: 'Pending verified licence — not authentic dialogue',
    speakerPlaceholder: 'Vegeta',
  },
] as const;

async function upsertMediaAndQuotes(
  originalPackId: string,
  dbzPackId: string,
): Promise<{ originalQuoteKeys: string[]; draftDialogueKeys: string[] }> {
  const originalQuoteKeys: string[] = [];

  for (const quote of ORIGINAL_QUOTATIONS) {
    const row = await prisma.quote.upsert({
      where: { key: quote.key },
      create: {
        key: quote.key,
        text: quote.text,
        kind: 'ORIGINAL_COPY',
        attribution: 'Saiyan Ascend original copy',
        locale: 'en',
        contextTags: [...quote.contextTags],
        rightsGrantIds: [],
        contentPackId: originalPackId,
        reviewStatus: 'APPROVED',
        publicationStatus: 'PUBLISHED',
        version: 1,
      },
      update: {
        text: quote.text,
        kind: 'ORIGINAL_COPY',
        attribution: 'Saiyan Ascend original copy',
        locale: 'en',
        contextTags: [...quote.contextTags],
        rightsGrantIds: [],
        contentPackId: originalPackId,
        reviewStatus: 'APPROVED',
        publicationStatus: 'PUBLISHED',
      },
    });
    originalQuoteKeys.push(row.key);

    const existingPub = await prisma.contentPublication.findFirst({
      where: { quoteId: row.id },
    });
    if (!existingPub) {
      await prisma.contentPublication.create({
        data: {
          quoteId: row.id,
          publicationStatus: 'PUBLISHED',
          contentVersion: 1,
          publishedAt: new Date(),
          adminNotes: 'ORIGINAL_COPY seed publication — product-owned copy',
        },
      });
    }
  }

  // Fixture media card (optional strip art) — ORIGINAL only.
  const media = await prisma.mediaAsset.upsert({
    where: { key: 'original-motivational-card-v1' },
    create: {
      key: 'original-motivational-card-v1',
      type: 'IMAGE',
      storageKey: 'fixtures/original/motivational-card-v1.svg',
      mimeType: 'image/svg+xml',
      altText: 'Abstract motivational card artwork (fixture)',
      moodTags: ['encouraging'],
      activityTags: ['motivation'],
      explicitContent: false,
      rightsGrantIds: [],
      contentPackId: originalPackId,
      reviewStatus: 'APPROVED',
      publicationStatus: 'PUBLISHED',
      version: 1,
    },
    update: {
      storageKey: 'fixtures/original/motivational-card-v1.svg',
      mimeType: 'image/svg+xml',
      altText: 'Abstract motivational card artwork (fixture)',
      reviewStatus: 'APPROVED',
      publicationStatus: 'PUBLISHED',
      contentPackId: originalPackId,
    },
  });

  const mediaPub = await prisma.contentPublication.findFirst({
    where: { mediaAssetId: media.id },
  });
  if (!mediaPub) {
    await prisma.contentPublication.create({
      data: {
        mediaAssetId: media.id,
        publicationStatus: 'PUBLISHED',
        contentVersion: 1,
        publishedAt: new Date(),
        adminNotes: 'ORIGINAL fixture media — delivery via FIXTURE_SIMULATED URLs',
      },
    });
  }

  const draftDialogueKeys: string[] = [];
  for (const draft of DBZ_DIALOGUE_DRAFT_STRUCTURE) {
    const row = await prisma.quote.upsert({
      where: { key: draft.key },
      create: {
        key: draft.key,
        text: draft.text,
        kind: draft.kind,
        attribution: draft.attribution,
        locale: 'en',
        dubVersion: null,
        sourceReference: null,
        contextTags: ['admin-workflow', 'pending-rights', draft.speakerPlaceholder],
        rightsGrantIds: [],
        contentPackId: dbzPackId,
        reviewStatus: 'DRAFT',
        publicationStatus: 'DRAFT',
        version: 1,
      },
      update: {
        text: draft.text,
        kind: draft.kind,
        attribution: draft.attribution,
        contextTags: ['admin-workflow', 'pending-rights', draft.speakerPlaceholder],
        rightsGrantIds: [],
        contentPackId: dbzPackId,
        reviewStatus: 'DRAFT',
        publicationStatus: 'DRAFT',
      },
    });
    draftDialogueKeys.push(row.key);

    const existingDraftPub = await prisma.contentPublication.findFirst({
      where: { quoteId: row.id },
    });
    if (!existingDraftPub) {
      await prisma.contentPublication.create({
        data: {
          quoteId: row.id,
          publicationStatus: 'DRAFT',
          contentVersion: 1,
          adminNotes:
            'Admin-ready DBZ dialogue workflow shell. No RightsGrant attached. Admin approval checkbox ≠ licence. Do not publish until DEP-M2-001 / media rights verified.',
        },
      });
    }
  }

  return { originalQuoteKeys, draftDialogueKeys };
}

async function main(): Promise<void> {
  const archetypeIds = await upsertArchetypes();
  const original = await upsertOriginalPack(archetypeIds);
  const dbz = await upsertDbzLicensedPack(archetypeIds, original.id);
  const exerciseIds = await upsertExercises();
  const templates = await upsertProgrammeTemplates(exerciseIds);
  const foodIds = await upsertFoods();
  await upsertRecipes(foodIds);
  const media = await upsertMediaAndQuotes(original.id, dbz.id);

  console.log(
    JSON.stringify({
      ok: true,
      seed: 'm2-m7-foundation',
      originalPackId: original.id,
      dbzLicensedPackId: dbz.id,
      archetypes: ORIGINAL_ARCHETYPES.map((a) => a.key),
      exercises: EXERCISES.map((e) => e.key),
      templates: {
        published: { key: templates.published.key, version: templates.published.version },
        draft: { key: templates.draft.key, version: templates.draft.version },
      },
      foods: FOODS.map((f) => f.key),
      recipes: RECIPES.map((r) => r.key),
      cosmeticMilestones: COSMETIC_MILESTONE_DEFINITIONS.unlocks.map((u) => u.id),
      originalQuotes: media.originalQuoteKeys,
      dbzDialogueDrafts: media.draftDialogueKeys,
      note:
        'DBZ_LICENSED presentations and dialogue remain DRAFT/UNAVAILABLE; ORIGINAL quotations only are published; nutrition fixtures are not clinical approval; cosmetic milestones are not health claims; push delivery is SIMULATED until FCM/APNs configured',
    }),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
