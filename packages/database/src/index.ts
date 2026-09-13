import { PrismaClient } from '@prisma/client';

/**
 * Shared Prisma client factory for server packages only.
 * Do not import @saiyan/database from web or mobile clients.
 */
export function createPrismaClient(url?: string): PrismaClient {
  return new PrismaClient(
    url
      ? {
          datasources: {
            db: { url },
          },
        }
      : undefined,
  );
}

export type { PrismaClient } from '@prisma/client';
export { Prisma } from '@prisma/client';

/** Singleton for local scripts; apps should inject their own instance. */
const globalForPrisma = globalThis as unknown as {
  __saiyanPrisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.__saiyanPrisma ?? createPrismaClient();

if (typeof process !== 'undefined' && process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.__saiyanPrisma = prisma;
}
