# Deployment and Configuration

## Local development

Provide Docker Compose services for:

- PostgreSQL.
- Redis.
- S3-compatible local object storage.
- Local email capture.

Provide documented scripts for:

- Installing dependencies.
- Starting infrastructure.
- Generating database clients.
- Applying development migrations.
- Seeding development fixtures.
- Running web, API, and worker.
- Starting the mobile development build.
- Running required checks.

The root README must state the exact commands after implementation.

Do not assume Docker is installed.
If unavailable, document connection alternatives without changing production
configuration or deleting existing resources.

## Environment separation

Support:

- development.
- test.
- staging.
- production.

Separate databases, storage buckets, notification credentials,
and AI budgets.

Do not run development seed users in production.

## Railway services

Provision or document:

1. web.
2. api.
3. worker.
4. PostgreSQL.
5. Redis.

Use private service networking where supported.
Expose only services that need public access.

Use private S3-compatible object storage for user uploads and restricted media.

Mobile application binaries are not deployed as Railway web services.

### Railway scaffolding status (Milestone 11)

**NOT DEPLOYED.** Templates exist in-repo for owner-authorised staging later.
Do not treat file presence as a live environment.

| Service | Template files | Notes |
| --- | --- | --- |
| api | `apps/api/Dockerfile`, `apps/api/railway.toml` | Public HTTP; health `/health/live` |
| web | `apps/web/Dockerfile`, `apps/web/railway.toml` | Public HTTP; health `/health` |
| worker | `apps/worker/Dockerfile`, `apps/worker/railway.toml` | Private process; Redis consumer |
| postgres | managed plugin (snippet below) | Private networking only |
| redis | managed plugin (snippet below) | Private networking only |
| index | `railway.toml` (root) | Documentation index only — do not run as an app |

Shared monorepo deploy rules:

- Leave each **app** service Root Directory empty (repository root) so
  `pnpm-workspace.yaml` and `pnpm-lock.yaml` are visible.
- Set Config as Code path to `/apps/<service>/railway.toml`, **or** set
  `RAILWAY_DOCKERFILE_PATH=apps/<service>/Dockerfile`.
- Inject `DATABASE_URL` and `REDIS_URL` from Railway private references.
- Run a single controlled migration job (`pnpm --filter @saiyan/database migrate:deploy`)
  per release — do not enable `preDeployCommand` on every replica until reviewed.
- Seed (`pnpm db:seed`) is for development/staging fixtures only — never production.

#### api service (template)

```toml
# From apps/api/railway.toml — template only
[build]
builder = "DOCKERFILE"
dockerfilePath = "apps/api/Dockerfile"

[deploy]
startCommand = "node dist/main.js"
healthcheckPath = "/health/live"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
```

Required variables (see root `.env.example`): `DATABASE_URL`, `JWT_SECRET`,
`APP_URL`, `API_URL`, `CONTENT_MODE`, `CORS_ALLOWED_ORIGINS`, `APP_ENV`.
Optional: `REDIS_URL`, `AUTH_SECRET`, `AUTH_ISSUER`, `AUTH_AUDIENCE`, `LOG_LEVEL`,
`COOKIE_SECURE`.

#### web service (template)

```toml
# From apps/web/railway.toml — template only
[build]
builder = "DOCKERFILE"
dockerfilePath = "apps/web/Dockerfile"

[deploy]
startCommand = "pnpm exec next start --hostname 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
```

Build args / public vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_BASE_URL`
(point at the public API URL). No secrets in public client variables.

#### worker service (template)

```toml
# From apps/worker/railway.toml — template only
[build]
builder = "DOCKERFILE"
dockerfilePath = "apps/worker/Dockerfile"

[deploy]
startCommand = "node dist/main.js"
restartPolicyType = "ON_FAILURE"
```

Required: `REDIS_URL`, `DATABASE_URL`. Optional: `APP_ENV`, `LOG_LEVEL`,
`HEARTBEAT_EVERY_MS`, `NOTIFICATION_POLL_EVERY_MS`.
Do not attach a public domain. Delivery mode remains **SIMULATED** until a push
provider is configured and verified.

#### postgres (managed plugin — template notes)

- Add Railway **PostgreSQL** plugin; do not ship a custom Postgres Dockerfile.
- Reference `${{Postgres.DATABASE_URL}}` (or equivalent private variable) into API.
- No public TCP exposure.
- Enable provider backups before production; restore drill is an owner gate.
- Migrations: `pnpm --filter @saiyan/database migrate:deploy` against this URL only
  from a controlled job.

#### redis (managed plugin — template notes)

- Add Railway **Redis** plugin; do not ship a custom Redis Dockerfile.
- Reference `${{Redis.REDIS_URL}}` into API (optional until queue features) and worker (required).
- Private networking only; no public port.
- Worker queue today: `saiyan-health` heartbeat stub — real notification dispatch later.

## Build requirements

Create production Dockerfiles or equivalent verified build configuration.

For a shared monorepo:

- Build from a context that includes required shared packages.
- Use service-specific build and start commands.
- Preserve lockfile-based dependency resolution.
- Do not exclude packages required at runtime.
- Run as a non-root user where practical.
- Bind HTTP services to 0.0.0.0 and the supplied PORT.

Implemented templates (Milestone 11 scaffolding):

- Root `.dockerignore` for lean, secret-free build context.
- `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/worker/Dockerfile`
  (pnpm filter installs, non-root user, lockfile frozen).
- Image builds are **not verified** in CI/local Docker until the Docker engine
  is available (see README / BUILD_STATUS).

Check current Railway documentation before finalising service settings.

## Migrations

Use a single controlled migration job for each release.

Production uses migration deployment, not schema-reset commands.

Apply backward-compatible expansion migrations before new code.
Defer destructive contraction until older code no longer depends on it.

Do not run simultaneous uncontrolled migrations from every replica.

## Health checks

API:

- /health/live: process is alive.
- /health/ready: critical dependencies are usable.

Web:
health endpoint suitable for deployment checks.

Worker:
heartbeat and queue-processing visibility.
Avoid exposing administrative worker endpoints publicly.

A temporary optional provider outage must not make the whole API unready.

## Configuration catalogue

### Server only

DATABASE_URL
REDIS_URL

AUTH_SECRET
AUTH_ISSUER
AUTH_AUDIENCE

S3_ENDPOINT
S3_REGION
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
S3_PRIVATE_BUCKET

EMAIL_PROVIDER
EMAIL_FROM
EMAIL_API_KEY

PUSH_PROVIDER
EXPO_ACCESS_TOKEN

AI_PROVIDER
AI_API_KEY
AI_MODEL
AI_DAILY_BUDGET

FOOD_DATA_PROVIDER
USDA_API_KEY

CONTENT_MODE
APP_ENV
CORS_ALLOWED_ORIGINS
LOG_LEVEL

Only include variables actually used by the selected implementation.
Document any renamed or additional variables.

### Public client configuration

NEXT_PUBLIC_API_BASE_URL
EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_PROJECT_ID

Public variables must contain no secrets.

### Native build configuration

Android package identifier.
iOS bundle identifier.
Expo/EAS project association where used.
Android push credentials.
Apple push credentials and entitlements.
Store-signing configuration.

Keep service-account secrets out of the application bundle.

## Provider fallback matrix

Email:
local capture in development; configured provider in production.

Push:
simulated inbox delivery in development; real provider when configured.

AI:
deterministic helpful fallback when disabled.

Food data:
traceable imported local catalogue; provider search when configured.

Media:
original available content; licensed pack when its assets and grants exist.

Storage:
local S3-compatible service in development; private object storage in production.

Fixture mode must be visible and impossible to mistake for successful
external delivery.

## Backups and recovery

Enable and document database backups.
Define initial recovery objectives with the owner.
Perform one staging restore exercise before launch.

Use object versioning or appropriate protection for critical media and
licence evidence.

Record how to restore application state without replaying external
notifications or duplicating XP.

## Release sequence

1. Required tests pass.
2. Production configuration validated.
3. Backup/recovery readiness checked.
4. Migration reviewed.
5. Staging deployed and smoke-tested.
6. Concrete release summary prepared.
7. Follow existing owner authorisation for production publishing.
8. Deploy migration and services in the documented order.
9. Verify key user journeys and worker processing.
10. Observe errors and queue lag.

## Rollback

Document rollback to the previous application image.

Database changes should permit that rollback where feasible.
Do not automatically reverse destructive migrations.

Pause affected workers if rollback would otherwise replay side effects.

## Costs

Do not invent current hosting or provider prices.

Provide a configurable cost worksheet covering:

- Web/API/worker resources.
- PostgreSQL and backups.
- Redis.
- Storage and egress.
- Email.
- AI usage.
- Mobile build/distribution accounts.
- Original or licensed content.

Populate current prices from provider sources when the owner requests a budget.
