# Build Status — Saiyan Ascend

Last updated: 2026-09-13 (auth BFF + original character art)

## Current milestone

Member login/session on split web/API hosts, original character portraits, production boot migrate/seed, and a usable mobile onboarding path are **implemented in-repo**. Railway production still serves the previous build until the owner authorises a redeploy.

Local Docker Compose / Postgres on this Windows host remains **BLOCKED**. Browser verification used the Next.js same-origin proxy against the live Railway API.

## Milestone status summary

| Milestone | Code status | Runtime / Docker verification |
| --- | --- | --- |
| M1 Foundation | Implemented + session BFF | Browser: register/login via proxy PASS; local Docker/Postgres E2E still BLOCKED |
| M2 Onboarding + characters | Implemented + original portraits | Browser: post-login onboarding PASS; portraits on login/register |
| M3 Training | Implemented | **BLOCKED** (`DEP-M3-002`) |
| M4 Nutrition | Implemented | **BLOCKED** (`DEP-M4-002`) |
| M5 Progression | Implemented | **BLOCKED** (`DEP-M5-001`) |
| M6 Media | ORIGINAL static images served | Local public PNG PASS; licensed DBZ stills **not** claimed |
| M7 Notifications | Foundational slice (SIMULATED delivery) | **BLOCKED** (`DEP-M7-002`) |
| M8 AI coach | Thin slice implemented (fixture provider) | **BLOCKED** (`DEP-M8-002`); OpenAI **PENDING** (`DEP-M8-001`) |
| M9 Privacy export/deletion | Thin slice (FIXTURE_DRY_RUN; no DB wipe) | **BLOCKED** (`DEP-M9-003`); storage/wipe **PENDING** |
| M10 Admin | Not started | — |
| M11 Release scaffolding | Templates in-repo; boot migrate/seed | **NOT REDEPLOYED** — owner authorisation required |

## Completed behaviour

### Auth BFF, original character art, production boot (2026-09-13)

- Web browser calls same-origin `/api/v1/*`. Next.js proxies to `API_PROXY_TARGET` / `API_INTERNAL_URL` and rebinds `Set-Cookie` to the web host (fixes register-success then bounce back to login on split Railway domains / third-party cookie blocking).
- After login/register the client confirms `GET /onboarding` before navigating; a missing cookie shows an honest session error instead of a silent loop.
- API production boot runs `prisma migrate deploy` + idempotent content seed when `APP_ENV=production` (override with `RUN_MIGRATIONS_ON_START` / `SEED_ON_BOOT`). Static original portraits at `/static/characters/*.png`.
- ORIGINAL character cards show product-owned portraits with “training emphasis inspired by Goku/Vegeta/Gohan/Trunks/Broly” labels. **Not official Dragon Ball Z stills; no licence is claimed** (`DEP-M2-001` still PENDING).
- Mobile: Android emulator API default `10.0.2.2`, onboarding wizard with portraits, Today theme card, tabs gate until onboarding completes.

### Railway security dependency refresh (2026-09-13)

- Upgraded `@saiyan/web` **Next.js** `15.2.4` → `15.5.25` (fixes 3 critical RCE advisories and related high/moderate Next.js CVEs).
- Upgraded **next-intl** `4.1.0` → `4.14.4` (open-redirect + prototype-pollution fixes).
- Added root **pnpm overrides** for transitive deps used by Railway services: `lodash@^4.18.1`, `multer@^2.3.0`, `postcss@^8.5.23`, `uuid@^11.1.1`, `decode-uri-component@^0.5.0`.
- `pnpm audit`: **56 → 2** findings (remaining 2 high are `image-size` via Expo/mobile only — no upstream patch published; not included in API/web/worker Docker images).
- Fixed API Docker image build: include and compile `packages/providers` (`@saiyan/providers` is required by coaching module).
- Fixed API runtime ESM circular dependency (`OnboardingFacade` ↔ `CharacterFacade`) via lazy `esmForwardRef()` — resolves Railway crash `Cannot access 'OnboardingApplicationService' before initialization`.
- Verified: `@saiyan/api`, `@saiyan/web`, `@saiyan/worker` production builds; API Docker build context simulation PASS; domain (63) + providers (3) tests PASS.

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

### Auth BFF + original art (this update)

- `apps/web/src/app/api/v1/[...path]/route.ts` — same-origin cookie BFF
- `apps/web/src/lib/api.ts`, login/register forms, character UI, public portraits
- `apps/api` — static `/static`, boot migrate/seed, character `artworkUrl` / `inspiredByLabel`, `GET /characters/selection`
- `packages/contracts`, `packages/database` seed + prisma CLI as runtime dependency
- `apps/mobile` — onboarding, portraits, Today theme, Android API default
- `.env.example`, `.railway/railway.ts`, `docs/BUILD_STATUS.md`, `memory-bank/**`

## Commands run and actual results

| Command | Result |
| --- | --- |
| `pnpm install` | PASS |
| `pnpm --filter @saiyan/contracts build` | PASS |
| `pnpm --filter @saiyan/domain build` | PASS |
| `pnpm --filter @saiyan/database build` | PASS |
| `pnpm --filter @saiyan/api build` | PASS |
| `pnpm --filter @saiyan/web build` | PASS (Next.js 15.5.25) |
| `pnpm --filter @saiyan/mobile exec tsc -p tsconfig.json --noEmit` | PASS |
| `pnpm --filter @saiyan/domain test` | PASS — **63 tests** |
| Browser: register → onboarding; logout → login → onboarding via same-origin proxy to Railway API | PASS |
| `pnpm docker:up` / local Postgres `:5432` | **NOT RUN / refused** on this host |

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
- DEP-M11-001 Railway access + deploy authorisation PENDING. Redeploy web with `API_PROXY_TARGET` (private or public API URL) and API with `APP_ENV=production` so migrate/seed and portraits go live. Live Railway still serves the previous build.
- Official Dragon Ball Z stills / names-as-licensed-identity remain PENDING (`DEP-M2-001`). Original portraits are the current production fallback.
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
