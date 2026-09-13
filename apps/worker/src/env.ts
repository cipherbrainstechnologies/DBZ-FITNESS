import { z } from 'zod';

export const WorkerEnvSchema = z.object({
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  DATABASE_URL: z.string().min(1),
  APP_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug']).default('info'),
  HEARTBEAT_EVERY_MS: z.coerce.number().int().positive().default(60_000),
  /** Poll interval for SIMULATED notification intent processing. */
  NOTIFICATION_POLL_EVERY_MS: z.coerce.number().int().positive().default(30_000),
  /** Poll interval for fixture dry-run export/deletion jobs. */
  PRIVACY_POLL_EVERY_MS: z.coerce.number().int().positive().default(60_000),
});

export type WorkerEnv = z.infer<typeof WorkerEnvSchema>;

export function loadWorkerEnv(raw: NodeJS.ProcessEnv = process.env): WorkerEnv {
  const parsed = WorkerEnvSchema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid worker environment: ${details}`);
  }
  return parsed.data;
}
