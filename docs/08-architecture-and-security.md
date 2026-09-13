# Architecture and Security

## Default stack

- Monorepo: pnpm workspaces.
- Mobile: Expo React Native with Expo Router.
- Web: Next.js with TypeScript.
- API: NestJS.
- Database: PostgreSQL.
- ORM and migrations: Prisma.
- Jobs: BullMQ with Redis.
- Object storage: private S3-compatible buckets.
- Mobile local workout storage: SQLite.
- Web local workout storage: IndexedDB.
- Server-state client: TanStack Query or existing equivalent.
- Contracts: shared validated schemas.
- Local infrastructure: Docker Compose.
- Hosting: Railway for web, API, worker, PostgreSQL, and Redis.

Confirm current compatibility before installation.
Do not install arbitrary "latest" versions independently.

Mobile binaries are built and distributed through appropriate Android/iOS
build and store channels. Railway hosts their backend services.

## Architecture shape

Use a modular monolith with a separate worker process.

Modules:

- Identity.
- Profiles and consent.
- Character/content packs.
- Training.
- Nutrition.
- Progression.
- Media.
- Notifications.
- Coaching.
- Administration.
- Data export and deletion.

Avoid microservices unless a measured need emerges.

## Ownership of logic

packages/domain:
Pure rules and calculations.

apps/api:
Authentication, authorisation, validation, orchestration, persistence.

apps/worker:
Outbox dispatch, notification scheduling, media maintenance, exports,
deletion tasks, and aggregate calculations.

Clients:
Presentation, local input validation, local session capture,
and optimistic updates with reconciliation.

The server is authoritative for permissions, active plan versions,
published targets, and awarded XP.

## Authentication

Use a maintained authentication library/provider compatible with the stack.
Do not invent cryptographic protocols.

Support:
email/password, verification, reset, logout, session revocation,
and administrator MFA.

Use secure password hashing where passwords are managed locally.

Web:
HttpOnly secure cookies, appropriate SameSite settings, and CSRF protection
for cookie-authenticated mutations.

Mobile:
short-lived access tokens with secure refresh-token storage.

Store server-side session or refresh-token identifiers in a revocable form.
Apply rate limits and account-enumeration protections.

## Authorisation

Roles:

- MEMBER.
- SUPPORT.
- CONTENT_EDITOR.
- FITNESS_REVIEWER.
- NUTRITION_REVIEWER.
- ADMIN.

Enforce roles and resource ownership on every endpoint.

Support should see operational metadata by default, not private photos,
nutrition histories, or screening answers.

Reviewer qualifications are owner-managed records.
A software role alone is not a professional credential.

## Sensitive information

Collect only information required for enabled features.

- Private object storage.
- Short-lived authorised media URLs.
- Encryption in transit and configured encryption at rest.
- Redacted logs.
- Separate credentials for environments.
- Least-privilege database and storage accounts.
- Audit records for privileged actions.
- No raw health profile in product analytics.
- No advertising targeting from health information.

## Offline workouts

Persist local sessions and append local events with stable event IDs.

Each event includes:
clientEventId, userId, sessionId, entityId, baseVersion,
occurredAt, capturedTimeZone, payload.

On reconnect:
submit pending events, deduplicate by event ID, and reconcile with
server versions.

Use optimistic concurrency for conflicting edits.
Return an explicit conflict instead of silently overwriting another device.

Clients can display provisional XP, clearly labelled pending sync.
Only the server finalises XP.

Clear account-associated local caches on logout and deletion.
Keep sensitive offline data minimal.

## Transactions and outbox

Workout completion, eligible XP award, and outbox event creation happen
in one database transaction.

Workers may retry.
Consumers must be idempotent.

Use PostgreSQL as the durable source of truth.
Redis loss must not destroy workout history or earned progression.

## Uploads

Restrict size and MIME type.
Verify content rather than trusting file extensions.
Use random storage keys and ownership checks.
Scan or safely process uploads before publication.
Do not accept arbitrary server-fetch URLs that enable SSRF.

## Deletion

Re-authenticate before destructive account actions.

Immediately revoke sessions and stop future notifications.
Process associated private objects, personal records, and provider data
through a documented deletion workflow.

Define retention for limited legal/security records and backups.
Explain that backup expiry is separate from immediate account removal.

## Observability

Record:
request ID, operation, timing, result code, provider state,
queue age, and relevant non-sensitive identifiers.

Monitor:
API failures, queue lag, dead-letter jobs, failed synchronisation,
invalid tokens, content expiry, and failed deletions.

## Privacy release review

Create an owner-reviewed privacy notice, consent records, retention policy,
and incident process appropriate to launch territories.

Check applicable Indian data-protection requirements and any other target
markets at release time, including effective dates.

Do not claim regulatory compliance merely because these features exist.
