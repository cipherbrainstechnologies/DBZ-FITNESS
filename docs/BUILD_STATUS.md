# Build Status — Saiyan Ascend

Last updated: 2026-09-14 (personal coach selection)

## Current milestone

The chosen character is a **persistent personal coach**, not a motivational theme. Catalogue listing, post-login journey, ORIGINAL content-pack readiness, selection UI, Today briefing actions, and persona-aware notifications are **implemented in-repo**.

Local Docker Compose / Postgres on this Windows host remains **BLOCKED**. Railway production still serves the previous build until the owner authorises a redeploy (migrate + seed on API boot).

## Milestone status summary

| Milestone | Code status | Runtime / Docker verification |
| --- | --- | --- |
| M1 Foundation | Implemented + session BFF | Browser: register/login via proxy PASS; local Docker/Postgres E2E still BLOCKED |
| M2 Onboarding + characters | Personal coach journey + named ORIGINAL coaches | Domain tests PASS; live catalogue E2E **BLOCKED** until API+web redeploy + seed |
| M3 Training | Implemented; coach can start/shorten eligible sessions | **BLOCKED** (`DEP-M3-002`) |
| M4 Nutrition | Implemented; diet/allergy hard rules still apply | **BLOCKED** (`DEP-M4-002`) |
| M5 Progression | Implemented | **BLOCKED** (`DEP-M5-001`) |
| M6 Media | ORIGINAL static images served; missing art does not block coaches | Local public PNG PASS; licensed DBZ stills **not** claimed |
| M7 Notifications | SIMULATED delivery; worker re-resolves current persona | **BLOCKED** (`DEP-M7-002`) |
| M8 AI coach | Fixture persona fallback + briefing/actions | **BLOCKED** (`DEP-M8-002`); OpenAI **PENDING** (`DEP-M8-001`) |
| M9 Privacy export/deletion | Thin slice (FIXTURE_DRY_RUN; no DB wipe) | **BLOCKED** (`DEP-M9-003`); storage/wipe **PENDING** |
| M10 Admin | Content-readiness diagnostics on `/admin` | Full CMS not started |
| M11 Release scaffolding | Templates in-repo; boot migrate/seed | **NOT REDEPLOYED** — owner authorisation required |

## Completed behaviour

### Personal coach (2026-09-14)

- Post-auth resolver `resolveAuthenticatedMemberJourney`: no session → sign-in; loading without redirect; no valid coach → `/app/coach`; incomplete fitness onboarding → `/app/onboarding`; complete → `/app` Today. Temporary fetch errors keep the session and do not clear a saved coach.
- CHARACTER is the first personalised onboarding step after WELCOME/consent. Existing members without a selection see coach selection on the next authenticated visit. A valid selection is not re-asked on every login.
- ORIGINAL catalogue lists **published presentations by `contentPack.mode`**, not a single pack row. Empty catalogue is a recoverable page error with operator diagnostics (`GET /characters/admin/content-readiness`); it is not a highlighted-field validation error and does not leak `ORIGINAL` to members.
- Seed publishes first-party coaches named Goku, Vegeta, Gohan, Future Trunks, and Broly. Does not republish WITHDRAWN rows or overwrite custom administrator display names. Does not backfill a default coach onto existing members.
- Selection is stored on `CharacterSelection` (presentationId, personaVersion, coachingTone, timestamps) scoped to the authenticated user. Change Coach from Profile and Today. Changing coach increments personaVersion, bumps pending reminder `scheduleVersion`, and does not alter training load, calories, XP, or logs.
- Today briefing is persona-specific with a working follow-through (`START_WORKOUT`, shorter session when eligible, check-in, or honest href). Fixture coach fallback remains when OpenAI is unset.
- Worker re-resolves the current selection before simulated MOTIVATION / WORKOUT_REMINDER / WEEKLY_REVIEW / MEAL_REMINDER copy.

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

### Personal coach (2026-09-14)

- `packages/domain` — journey resolver, step order WELCOME→CHARACTER, personas/briefing, expanded coach actions
- `packages/database` — `personaVersion`, `coachingTone`, `CoachingMemoryEntry`, migration `20260914120000_m12_personal_coach`, ORIGINAL seed names Goku–Broly
- `packages/contracts` — journey, presentation persona fields, briefing/context/memory, action types
- `apps/api` — catalogue by pack mode, content-readiness, selection versioning, GET `/onboarding` journey, `/coach/briefing|context|memory`, confirmable actions
- `apps/web` — `/app/coach`, journey gate, login/register routing, Today briefing CTAs, Profile My Coach, About disclosures, admin readiness
- `apps/mobile` — matching step order and coach copy
- `apps/worker` — re-resolve persona before simulated reminder copy
- `docs/BUILD_STATUS.md`, `docs/03-character-and-progression.md`, `docs/16-decisions-and-dependencies.md`, `memory-bank/**`

### Auth BFF + original art (prior)

- `apps/web/src/app/api/v1/[...path]/route.ts` — same-origin cookie BFF
- `apps/web/src/lib/api.ts`, login/register forms, character UI, public portraits
- `apps/api` — static `/static`, boot migrate/seed, character `artworkUrl`, `GET /characters/selection`
- `packages/contracts`, `packages/database` seed + prisma CLI as runtime dependency
- `apps/mobile` — onboarding, portraits, Today theme, Android API default
- `.env.example`, `.railway/railway.ts`, `docs/BUILD_STATUS.md`, `memory-bank/**`

## Commands run and actual results

| Command | Result |
| --- | --- |
| `pnpm --filter @saiyan/database generate` | PASS |
| `pnpm --filter @saiyan/domain test` | PASS — **78 tests** |
| `pnpm --filter @saiyan/providers test` | PASS — **3 tests** |
| Domain / contracts / API / web / worker / mobile `tsc` | PASS |
| `@saiyan/web` `next build` | PASS (`/app/coach`, `/app/profile`, `/about`) |
| `@saiyan/api` `tsc -p tsconfig.build.json` | PASS |
| Browser: home “personal coach” copy; About AI/health/content disclosure; signed-in member without a valid coach lands on `/app/coach` | PASS against local Next + live Railway API |
| Live `GET /characters` still returns empty catalogue + `No content pack configured for mode ORIGINAL` | Expected until API redeploy runs migrate/seed; web maps this to “We couldn't load your coaches” (not a field error) |
| `pnpm db:migrate` / `pnpm db:seed` | **NOT RUN** (no local Postgres) |
| `pnpm docker:up` / local Postgres `:5432` | **NOT RUN / refused** on this host |

Prepared (not run against a database): `pnpm db:migrate` or `prisma migrate deploy`, then `pnpm db:seed`. Production API boot already runs migrate+seed when `APP_ENV=production` (`SEED_ON_BOOT`).

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
- Official Dragon Ball Z stills / names-as-licensed-identity remain PENDING (`DEP-M2-001`). ORIGINAL named coaches with original portraits are the current production fallback.
- After Docker is healthy: `pnpm docker:up` → `pnpm db:migrate` → `pnpm db:seed` → register → `/app/coach` → remaining onboarding → Today briefing CTA.

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
