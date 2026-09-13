import { z } from 'zod';

/**
 * Runtime env validation for the API process.
 * Secrets must come from the environment — never commit real values.
 */
export const EnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(32),
  AUTH_SECRET: z.string().min(32).optional(),
  AUTH_ISSUER: z.string().min(1).default('saiyan-ascend'),
  AUTH_AUDIENCE: z.string().min(1).default('saiyan-ascend-api'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 30),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  APP_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:3001'),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  RUN_MIGRATIONS_ON_START: z.enum(['true', 'false']).optional(),
  SEED_ON_BOOT: z.enum(['true', 'false']).optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug']).default('info'),
  CONTENT_MODE: z.enum(['ORIGINAL', 'DBZ_LICENSED']).default('ORIGINAL'),
  /**
   * Coach provider selection. `openai` only activates when OPENAI_API_KEY is set;
   * otherwise FixtureCoachProvider is used (docs/16 DEP-M8-001 PENDING).
   */
  COACH_PROVIDER: z.enum(['fixture', 'openai']).default('fixture'),
  OPENAI_API_KEY: z.string().min(1).optional(),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid API environment: ${details}`);
  }
  return parsed.data;
}

export function corsOrigins(env: Env): string[] {
  const extra = env.CORS_ALLOWED_ORIGINS
    ? env.CORS_ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  return [
    env.APP_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...extra,
  ].filter((value, index, all) => all.indexOf(value) === index);
}
