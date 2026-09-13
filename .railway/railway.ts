import {
  defineRailway,
  github,
  postgres,
  preserve,
  project,
  redis,
  service,
  volume,
} from "railway/iac";

/**
 * Railway IaC for Saiyan Ascend (project sparkling-intuition).
 * Each app service builds its OWN Dockerfile — never share apps/api for web/worker.
 */
export default defineRailway(() => {
  const DBZFITNESS = github("cipherbrainstechnologies/DBZ-FITNESS", {
    checkSuites: false,
  });

  const Redis = redis("Redis", { region: "us-east4-eqdc4a" });
  Redis.deploy = {
    startCommand:
      '/bin/sh -c "rm -rf $RAILWAY_VOLUME_MOUNT_PATH/lost+found/ && exec docker-entrypoint.sh redis-server --requirepass $REDIS_PASSWORD --save 60 1 --dir $RAILWAY_VOLUME_MOUNT_PATH"',
  };
  Redis.networking = { privateNetworkEndpoint: "redis" };

  const Postgres = postgres("Postgres", { region: "us-east4-eqdc4a" });
  Postgres.networking = {
    privateNetworkEndpoint: "postgres",
    tcpProxies: { "5432": {} },
  };

  const redisVolume = volume("redis-volume", {
    alerts: { usage: { "100": {}, "80": {}, "95": {} } },
    allowOnlineResize: true,
    region: "us-east4-eqdc4a",
    sizeMB: 50000,
  });
  const postgresVolume = volume("postgres-volume", {
    alerts: { usage: { "100": {}, "80": {}, "95": {} } },
    allowOnlineResize: true,
    region: "us-east4-eqdc4a",
    sizeMB: 50000,
  });

  // Expo is not hosted on Railway. Keep the existing service record until removed in the dashboard.
  const _saiyanmobile = service("@saiyan/mobile", {
    source: github("cipherbrainstechnologies/DBZ-FITNESS", {
      checkSuites: false,
      rootDirectory: "apps/mobile",
    }),
    build: { builder: "RAILPACK", watchPatterns: ["/apps/mobile/**"] },
    start: "pnpm start",
    replicas: { "us-east4-eqdc4a": 1 },
    networking: { privateNetworkEndpoint: "saiyanmobile" },
    env: {
      EXPO_PUBLIC_API_BASE_URL: preserve(),
      EXPO_PUBLIC_API_URL: preserve(),
    },
  });

  const _saiyanapi = service("@saiyan/api", {
    source: DBZFITNESS,
    build: {
      builder: "DOCKERFILE",
      dockerfilePath: "apps/api/Dockerfile",
      watchPatterns: [
        "apps/api/**",
        "packages/contracts/**",
        "packages/domain/**",
        "packages/database/**",
        "packages/providers/**",
        "pnpm-lock.yaml",
        "package.json",
      ],
    },
    start: "node dist/main.js",
    healthcheck: "/health/live",
    healthcheckTimeout: 30,
    replicas: { "us-east4-eqdc4a": 1 },
    networking: { privateNetworkEndpoint: "saiyanapi" },
    env: {
      ACCESS_TOKEN_TTL_SECONDS: preserve(),
      API_URL: preserve(),
      APP_ENV: preserve(),
      APP_URL: preserve(),
      AUTH_AUDIENCE: preserve(),
      AUTH_ISSUER: preserve(),
      AUTH_SECRET: preserve(),
      COACH_PROVIDER: preserve(),
      CONTENT_MODE: preserve(),
      COOKIE_SECURE: preserve(),
      CORS_ALLOWED_ORIGINS: preserve(),
      DATABASE_URL: preserve(),
      JWT_SECRET: preserve(),
      LOG_LEVEL: preserve(),
      PORT: preserve(),
      REDIS_URL: preserve(),
      REFRESH_TOKEN_TTL_SECONDS: preserve(),
    },
  });

  const _saiyanworker = service("@saiyan/worker", {
    source: DBZFITNESS,
    build: {
      builder: "DOCKERFILE",
      dockerfilePath: "apps/worker/Dockerfile",
      watchPatterns: [
        "apps/worker/**",
        "packages/database/**",
        "packages/domain/**",
        "pnpm-lock.yaml",
        "package.json",
      ],
    },
    start: "node dist/main.js",
    replicas: { "us-east4-eqdc4a": 1 },
    networking: { privateNetworkEndpoint: "saiyanworker" },
    env: {
      APP_ENV: preserve(),
      DATABASE_URL: preserve(),
      HEARTBEAT_EVERY_MS: preserve(),
      LOG_LEVEL: preserve(),
      NOTIFICATION_POLL_EVERY_MS: preserve(),
      PRIVACY_POLL_EVERY_MS: preserve(),
      REDIS_URL: preserve(),
    },
  });

  const _saiyanweb = service("@saiyan/web", {
    source: DBZFITNESS,
    build: {
      builder: "DOCKERFILE",
      dockerfilePath: "apps/web/Dockerfile",
      watchPatterns: [
        "apps/web/**",
        "packages/contracts/**",
        "packages/design-tokens/**",
        "pnpm-lock.yaml",
        "package.json",
      ],
    },
    start: "node scripts/start-prod.mjs",
    healthcheck: "/health",
    healthcheckTimeout: 30,
    replicas: { "us-east4-eqdc4a": 1 },
    networking: { privateNetworkEndpoint: "saiyanweb" },
    env: {
      NEXT_PUBLIC_API_BASE_URL: preserve(),
      NEXT_PUBLIC_API_URL: preserve(),
      NEXT_TELEMETRY_DISABLED: preserve(),
      NODE_ENV: preserve(),
    },
  });

  return project("sparkling-intuition", {
    resources: [
      Redis,
      _saiyanmobile,
      _saiyanapi,
      Postgres,
      _saiyanworker,
      _saiyanweb,
      redisVolume,
      postgresVolume,
    ],
  });
});
