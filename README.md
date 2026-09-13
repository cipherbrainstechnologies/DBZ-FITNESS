# Saiyan Ascend — Fitness App Project

Working name: Saiyan Ascend.
Public branding remains subject to commercial name and content clearance.

## Product overview

Saiyan Ascend is an inclusive fitness companion inspired by Dragon Ball training,
character growth, determination, and transformation.

Users select a character inspiration and receive practical workouts,
meal planning, habit support, music, motivational content, and reminders
that fit their real lives.

The experience should feel like progressing through a personal training saga.

A fictional character represents motivation and preferred training emphasis.
It must never represent a promised physical outcome.

### Primary audiences

1. People who need motivation to begin improving their fitness.
2. Corporate professionals balancing work, family, commuting, and exercise.
3. Gym users struggling with consistency.
4. People seeking strength, muscle gain, fat loss, or improved conditioning.
5. Beginners, returning exercisers, and experienced recreational trainees.

All genders can choose any character, training emphasis, and avatar.

### Deliverables

- Android application.
- iOS application.
- Responsive member web application.
- Web administration portal.
- Backend API.
- Background notification and maintenance workers.
- Database migrations and seed tooling.
- Media and content management.
- Automated verification of critical behaviour.
- Railway deployment configuration and operating instructions (templates only until authorised).

### Release boundary

Version 1 supports adults aged 18 and above.

Include older adults and people with access needs through supported,
reviewed adaptations. Do not claim the standard programme covers every
medical condition or disability.

People requiring specialist support can use suitable logging and general
habit features while automated prescriptions remain unavailable.

A future guardian-supported youth experience requires a separate programme,
consent design, and content review. Do not silently enrol minors into the
adult transformation programme.

## Content modes

The application supports interchangeable content packs via `CONTENT_MODE`:

| Mode | Purpose |
| --- | --- |
| `ORIGINAL` (default) | Original visual assets, copy, music, and character archetypes. Always the development default. |
| `DBZ_LICENSED` | Dragon Ball character experience using appropriately authorised names, branding, images, dialogue, and audio. |

Implement the complete DBZ content integration structure.
Keep the application functional with original content while licensed assets
are being arranged.

- Content mode changes **presentation**, not fitness safety rules.
- Seeded DBZ rows remain `DRAFT` / `UNAVAILABLE` until rights are verified.
- Never attribute original motivational copy to a Dragon Ball character as an authentic quotation.

See [docs/16-decisions-and-dependencies.md](docs/16-decisions-and-dependencies.md)
for rights and review gates (`DEP-M2-001` and related).

## Monorepo layout

```
apps/mobile     Expo React Native application
apps/web        Member web + administration (Next.js)
apps/api        NestJS HTTP API
apps/worker     BullMQ scheduled / async processing
packages/domain           Pure training, nutrition, progression, media, notification logic
packages/contracts        Zod API schemas and shared types
packages/database         Prisma schema, migrations, seed
packages/design-tokens    Colours, spacing, typography, motion
packages/providers        Server-side integration adapters
packages/test-fixtures    Deterministic development fixtures
docs/                     Specification + implementation evidence
deploy templates          apps/*/Dockerfile, apps/*/railway.toml, root railway.toml
```

Do not import database or secret-bearing provider packages into clients.

## Local startup

Prerequisites: Node.js ≥ 20, pnpm 9.15.9 (via `packageManager`), Docker Desktop
with a healthy engine (for Postgres/Redis), and a local `.env` copied from
`.env.example`.

### Commands (exact)

```bash
pnpm install
pnpm docker:up
pnpm db:migrate
pnpm db:seed
pnpm api:dev
pnpm web:dev
pnpm worker:dev
pnpm mobile:dev
```

Run API / web / worker / mobile in separate terminals after migrate + seed.

| Step | Command | Status |
| --- | --- | --- |
| Install dependencies | `pnpm install` | **VERIFIED** — lockfile-based install used in milestone builds |
| Start Postgres + Redis | `pnpm docker:up` | **BLOCKED** — Docker Desktop engine cannot start without an elevated Docker service / healthy engine on this Windows host; Compose not verified in recent sessions |
| Apply migrations | `pnpm db:migrate` | **BLOCKED** — requires reachable Postgres (`DATABASE_URL`) |
| Seed fixtures | `pnpm db:seed` | **BLOCKED** — requires migrated Postgres |
| API dev server | `pnpm api:dev` | **VERIFIED** (typecheck/build in milestones); live HTTP against DB **BLOCKED** until Docker/Postgres |
| Web dev server | `pnpm web:dev` | **VERIFIED** (lint/typecheck in milestones); full cookie E2E **BLOCKED** until API+DB |
| Worker dev process | `pnpm worker:dev` | **VERIFIED** (package present; heartbeat stub); live Redis **BLOCKED** until Docker |
| Mobile Expo | `pnpm mobile:dev` | Scaffold present; device/simulator run not claimed as verified here |

Owner action for Docker blocker: start Docker Desktop with a working elevated
`com.docker.service` (or equivalent), confirm `docker version` shows a Server,
then re-run `pnpm docker:up` → `pnpm db:migrate` → `pnpm db:seed`.

Copy `.env.example` → `.env` and replace placeholder secrets locally.
Never commit real secrets.

## Railway / release scaffolding

Milestone 11 templates only — **not deployed**:

- `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/worker/Dockerfile`
- `apps/*/railway.toml` + root `railway.toml` (index)
- Operator notes in [docs/14-deployment-and-configuration.md](docs/14-deployment-and-configuration.md)

Staging/production publish requires explicit owner authorisation.

## Status and decisions

- Implementation evidence: [docs/BUILD_STATUS.md](docs/BUILD_STATUS.md)
- Owner dependencies and decisions: [docs/16-decisions-and-dependencies.md](docs/16-decisions-and-dependencies.md)

## Read order

1. [AGENTS.md](AGENTS.md)
2. Product, design, and character specifications (`docs/01`–`03`)
3. Training and nutrition specifications (`docs/04`–`05`)
4. Media and notification specifications (`docs/06`–`07`)
5. Architecture and data/API specifications (`docs/08`–`09`)
6. AI, administration, and seed specifications (`docs/10`–`12`)
7. Testing, deployment, implementation, and dependency documents (`docs/13`–`16`)

## Definition of completion

A new member can:

- Register and complete onboarding.
- Choose an available character or original archetype.
- Receive an explainable, suitable training plan.
- Receive meals respecting their food restrictions.
- Complete and synchronise a workout.
- Log meals and relevant habits.
- Earn progression once for each eligible action.
- Receive opted-in reminders at appropriate local times.
- Review progress and adjust future plans.
- Export or delete their personal information.

An administrator can manage the supporting content and inspect failures
without gaining unrestricted access to private member health information.

A production release must distinguish implemented features, verified
integrations, unavailable integrations, and pending content approvals.
