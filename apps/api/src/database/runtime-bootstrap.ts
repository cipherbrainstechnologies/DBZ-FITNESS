import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Logger } from '@nestjs/common';

/**
 * Production boot: apply Prisma migrations and idempotent content seed.
 * Disabled in local watch unless RUN_MIGRATIONS_ON_START / SEED_ON_BOOT are true.
 */
export function runRuntimeDatabaseBootstrap(): void {
  const log = new Logger('DbBootstrap');
  const appEnv = process.env.APP_ENV ?? 'development';
  const migrate =
    (process.env.RUN_MIGRATIONS_ON_START ?? (appEnv === 'production' ? 'true' : 'false')) ===
    'true';
  const seed =
    (process.env.SEED_ON_BOOT ?? (appEnv === 'production' ? 'true' : 'false')) === 'true';

  if (!migrate && !seed) {
    return;
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, '../../../..');
  const schema = resolve(repoRoot, 'packages/database/prisma/schema.prisma');
  const seedFile = resolve(repoRoot, 'packages/database/prisma/seed.ts');

  let prismaCli: string;
  try {
    const require = createRequire(resolve(repoRoot, 'packages/database/package.json'));
    prismaCli = require.resolve('prisma/build/index.js');
  } catch (error) {
    log.error(
      `Prisma CLI not found — cannot migrate/seed (${error instanceof Error ? error.message : String(error)})`,
    );
    if (migrate) {
      throw error;
    }
    return;
  }

  if (migrate) {
    log.log('Applying Prisma migrations (migrate deploy)');
    const result = spawnSync(process.execPath, [prismaCli, 'migrate', 'deploy', '--schema', schema], {
      cwd: repoRoot,
      env: process.env,
      stdio: 'inherit',
    });
    if (result.status !== 0) {
      throw new Error(`prisma migrate deploy exited ${result.status ?? 'unknown'}`);
    }
  }

  if (seed) {
    log.log('Seeding original content pack (idempotent)');
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', seedFile],
      {
        cwd: repoRoot,
        env: process.env,
        stdio: 'inherit',
      },
    );
    if (result.status !== 0) {
      throw new Error(`content seed exited ${result.status ?? 'unknown'}`);
    }
  }
}
