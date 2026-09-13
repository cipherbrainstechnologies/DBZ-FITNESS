# Build Status — Saiyan Ascend

Last updated: 2026-09-13

## Current milestone

Milestones 8 (AI coach) and 9 (privacy export/deletion) — **thin slices implemented in-repo**. Live Docker Compose / migrate / seed / HTTP E2E remain **BLOCKED**: Docker Desktop engine cannot start without an elevated Docker service / healthy engine on this Windows host.

Milestone 11 release scaffolding remains in-repo and **NOT DEPLOYED**.

## Milestone status summary

| Milestone | Code status | Runtime / Docker verification |
| --- | --- | --- |
| M1 Foundation | Implemented | **BLOCKED** — Docker/Postgres/Redis E2E not run |
| M2 Onboarding + characters | Implemented | **BLOCKED** — DB E2E not run |
| M3 Training | Implemented | **BLOCKED** (`DEP-M3-002`) |
| M4 Nutrition | Implemented | **BLOCKED** (`DEP-M4-002`) |
| M5 Progression | Implemented | **BLOCKED** (`DEP-M5-001`) |
| M6 Media | Foundational slice implemented | **BLOCKED** (`DEP-M6-003`) |
| M7 Notifications | Foundational slice (SIMULATED delivery) | **BLOCKED** (`DEP-M7-002`) |
| M8 AI coach | Thin slice implemented (fixture provider) | **BLOCKED** (`DEP-M8-002`); OpenAI **PENDING** (`DEP-M8-001`) |
| M9 Privacy export/deletion | Thin slice (FIXTURE_DRY_RUN; no DB wipe) | **BLOCKED** (`DEP-M9-003`); storage/wipe **PENDING** |
| M10 Admin | Not started | — |
| M11 Release scaffolding | Templates in-repo | **NOT DEPLOYED**; image builds not verified without Docker |

## Completed behaviour

### Milestone 1–7 (prior)

- Foundation through media + SIMULATED notifications (see prior entries / memory-bank).

### Milestone 8 (AI coach — thin)

- `packages/providers`: `CoachProvider` interface + `FixtureCoachProvider` (approved content only; `inventsNutritionNumbers=false`; refuses starvation/clinical/allergy/screening bypass / fabricated character quotes).
- Domain: `evaluateCoachProposalSafety` rejects screening/diet hard-rule bypasses and invented nutrition payloads (+ unit tests).
- Prisma: `CoachConversation`, `CoachMessage`, `CoachActionProposal` + migration `20260913210000_m8_coach_m9_privacy`.
- Nest `CoachingModule` + `CoachingFacade`:
  - `POST /coach/messages` — fixture unless `COACH_PROVIDER=openai` configured; OpenAI adapter not implemented → still fixture with honest note
  - `POST /coach/action-proposals/:id/confirm` (Idempotency-Key) | `reject`
- Confirm records proposal status only; does not silently mutate Training/Nutrition plans.
- Unit test: fixture coach never invents food nutrition numbers (`@saiyan/providers`).

### Milestone 9 (privacy — thin; offline sync deferred)

- Prisma: `DataExportJob`, `AccountDeletionRequest` + same M8/M9 migration.
- Nest `PrivacyModule` + `PrivacyFacade`:
  - `POST /me/export`, `GET /me/export/:id` (Idempotency-Key on create)
  - `POST /me/deletion-request` (password re-auth), `GET /me/deletion-status`
- Worker queue `saiyan-privacy`: export → `READY_FIXTURE` + `fixture://` URL; deletion → `SCHEDULED_FIXTURE` / `COMPLETED_FIXTURE` **without wiping User rows**.
- Offline workout persistence / sync from full M9 scope **not** in this thin slice.

### Milestone 11 (release scaffolding)

- Unchanged: Dockerfiles, Railway templates, README — **NOT DEPLOYED**.

## Files or modules changed

### M8/M9 (this update)

- `packages/providers` — coach port + FixtureCoachProvider + nutrition-invention tests
- `packages/domain` — coaching safety + tests
- `packages/contracts` — coach + privacy Zod contracts
- `packages/database` — schema + migration `20260913210000_m8_coach_m9_privacy`
- `apps/api` — `coaching/*`, `privacy/*`, env `COACH_PROVIDER` / `OPENAI_API_KEY`, AuthService re-auth, AppModule wiring, `@saiyan/providers` dep
- `apps/worker` — privacy queue + FIXTURE_DRY_RUN processors; `PRIVACY_POLL_EVERY_MS`
- `.env.example`, `docs/16`, `docs/BUILD_STATUS.md`, `memory-bank/**`

## Commands run and actual results

| Command | Result |
| --- | --- |
| `pnpm install` | PASS |
| `pnpm --filter @saiyan/database generate` | PASS — Prisma Client 6.5.0 |
| `pnpm --filter @saiyan/domain build` | PASS |
| `pnpm --filter @saiyan/contracts build` | PASS |
| `pnpm --filter @saiyan/providers build` | PASS |
| `pnpm --filter @saiyan/domain test` | PASS — **63 tests** (incl. 6 coach safety) |
| `pnpm --filter @saiyan/providers test` | PASS — **3 tests** (fixture never invents nutrition numbers) |
| `pnpm --filter @saiyan/api build` | PASS |
| `pnpm --filter @saiyan/worker lint` | PASS |
| `pnpm docker:up` / `pnpm db:migrate` / `pnpm db:seed` | **NOT RUN** — Docker/Postgres unavailable |
| Live coach + privacy HTTP / worker E2E | **NOT RUN** |

## What was simulated (honest modes)

- Coach: FixtureCoachProvider only; OpenAI/other **PENDING** (`DEP-M8-001`).
- Export downloads: `FIXTURE_DRY_RUN` / `fixture://export-dry-run/{id}` — not object storage.
- Account deletion: dry-run status machine only — **does not wipe DB**.
- Media / notifications: prior FIXTURE_SIMULATED / SIMULATED modes unchanged.

## Remaining failures / blockers

- Docker Desktop elevated-service / engine health blocker (Compose, migrate, seed, Redis worker, Dockerfile builds).
- DEP-M8-001 OpenAI PENDING; DEP-M8-002 / DEP-M9-003 Postgres (+ Redis) E2E blocked.
- DEP-M9-001 export storage PENDING; DEP-M9-002 authorised wipe PENDING.
- Prior DEP-M3/M4/M5/M6/M7 Postgres E2E blockers still open.
- DEP-M11-001 Railway access + deploy authorisation PENDING.
- After Docker is healthy: `pnpm docker:up` → `pnpm db:migrate` → `pnpm db:seed` → smoke coach messages + export/deletion fixture paths.

## External dependencies

- Postgres + Redis (Docker Compose locally; Railway managed plugins in templates).
- Auth secrets in `.env` (never commit real values).
- OpenAI/other coach key optional (`OPENAI_API_KEY`) — fixture remains default.
- Object storage, push, email, DBZ rights, fitness/nutrition reviews as in docs/16.
- Owner-authorised Railway project for any real deploy.

## Next milestone

1. Unblock Docker; verify migrate/seed + M8/M9 HTTP + worker E2E.
2. Milestone 10 administration, or remaining offline sync from full M9, or media player / schedule UI.
3. When authorised: wire Railway from templates — no production publish without separate authorisation.
