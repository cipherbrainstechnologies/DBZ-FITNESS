# Architecture — Saiyan Ascend

## Stack

- Monorepo: pnpm workspaces (`apps/*`, `packages/*`)
- Mobile: Expo React Native + Expo Router
- Web: Next.js (member + admin)
- API: NestJS modular monolith
- Worker: BullMQ + Redis
- DB: PostgreSQL + Prisma (`@saiyan/database`)
- Domain: pure TypeScript in `packages/domain`
- Contracts: Zod schemas in `packages/contracts`
- Design tokens: `packages/design-tokens` (docs/02 colours)
- Providers: stub + fixture adapters in `packages/providers`
- Fixtures: deterministic members in `packages/test-fixtures`

## Domain boundaries

Cross-module reads/writes go through owning module facades/application services.
Clients never import `packages/database` or secret-bearing providers.

## Content packs

- `ORIGINAL`: always functional for development; seed publishes Explorer/Strategist/Scholar/Guardian/Titan
- `DBZ_LICENSED`: structure present (Goku/Vegeta/Gohan/Trunks/Broly placeholder rows); gated on rights verification (`DRAFT`/`UNAVAILABLE` until verified)
- Env: `CONTENT_MODE=ORIGINAL` (default) | `DBZ_LICENSED`
## Auth model

Roles: MEMBER, SUPPORT, CONTENT_EDITOR, FITNESS_REVIEWER, NUTRITION_REVIEWER, ADMIN.
Server is authoritative for permissions, plan versions, and XP.

## Local infrastructure

- `docker-compose.yml`: Postgres 16 (`5432`), Redis 7 (`6379`), named volumes + healthchecks
- Root scripts: `build`, `lint`, `test`, `db:generate`, `db:migrate`, `db:seed`, `docker:up`, `api:dev`, `web:dev`, `worker:dev`, `mobile:dev`

## Web (Milestone 1–7)

- Package: `@saiyan/web` (`apps/web`) — Next.js 15 App Router, dark fitness theme from `@saiyan/design-tokens`
- Auth: cookie mode via `credentials: 'include'` + `Accept: application/json; auth=cookie`; session from `GET /me`
- Routes: `/` marketing, `/login`, `/register`, `/app` Today (planned-session Start/Resume CTA + next-meal Fuel snippet when meal plan exists + optional ORIGINAL media strip), `/app/train` plan preview/activate + session list, `/app/train/session/[plannedSessionId]` workout player, `/app/fuel` meal plan / swap / meal log / grocery, `/app/progress` XP summary + ledger, `/app/onboarding` wizard, `/today` → `/app`, `/admin` (ADMIN only)
- Training UI: preview/activate with explainable eligibility; busy-day shorten; set logging; complete/abandon; honest empty states; no licensed exercise demo media
- Fuel UI: meal-plan preview/activate; habit-only targets; planned vs logged visually separate; swap flow; grocery list; optional calorie estimates only for ESTIMATED/PROFESSIONAL modes with explicit non-guarantee labelling
- Progress UI: XP summary, daily category caps, append-only ledger, recent days; explicit disclaimer that game level ≠ health
- Media UI: Today strip (`TodayMediaStrip`) loads ORIGINAL content/today when available; absence must not break workout CTAs
- Onboarding UI: PUT each step with loading/error/success; CHARACTER uses GET `/characters` + POST `/characters/select`; ORIGINAL archetypes only; character-as-theme disclaimer; POST `/onboarding/complete` → `/app`
- i18n: next-intl en / fr / es (`en` default, `localePrefix: as-needed`) — onboarding + training + fuel + progress + today media strings in all three locales
- Fonts: Oxanium (display) + Sora (body) via `next/font`
- Config: `NEXT_PUBLIC_API_URL` default `http://localhost:3001`

## Mobile (Milestone 1)

- Package: `@saiyan/mobile` (`apps/mobile`) — Expo SDK 53, Expo Router, dark theme from `@saiyan/design-tokens`
- Auth: bearer login/register/refresh; tokens in `expo-secure-store` (web sessionStorage fallback)
- Tabs: Today / Train / Fuel / Progress / Profile — Today + Profile load GET `/me`; others honest empty states
- i18n: en / fr / es via `t()` helper; display font Sora (`@expo-google-fonts/sora`)
- Config: `EXPO_PUBLIC_API_URL` default `http://localhost:3001/api/v1`

## API modules (Milestone 1–9)

- `identity` — User / AuthCredential / AuthSession / UserRole; local email+password (argon2id); JWT access + hashed opaque refresh; cookie mode via `Accept` (`auth=cookie`); password re-auth for deletion
- `profiles` — `ProfileFacade` / `ProfileApplicationService` own `ProfileVersion` (other modules must not query Profile entities directly)
- `onboarding` — `OnboardingFacade` owns `OnboardingProgress`, `ConsentRecord`, `ScreeningRecord`, `DietPreference`; GET/PUT `/onboarding`, POST `/onboarding/complete`; exposes diet preference summaries for Nutrition
- `characters` — `CharacterFacade` owns `ContentPack`, archetypes/presentations/selection; GET `/characters`, POST `/characters/select` (selection does not wipe XP)
- `training` — `TrainingFacade` owns Exercise / ProgrammeTemplate / TrainingPlan / PlannedSession / Workout*; preview/activate/shorten/set-log/complete; on complete calls `ProgressionFacade.awardIfEligible` in the same transaction; calls Profile/Onboarding/Character/Progression façades only (does **not** import Nutrition or XpLedger Prisma)
- `nutrition` — `NutritionFacade` owns Food / Recipe / NutritionTarget / MealPlan / PlannedMeal / MealLog / Grocery*; diet filtering + allergy hard rules; HABIT_ONLY and optional estimates with no calorie guarantees; calls Onboarding/Profile façades only
- `progression` — `ProgressionFacade` owns XpLedgerEntry / DailyXpCategory / MilestoneUnlock; GET `/progress/summary`, `/progress/xp-ledger`, `/progress/history`; idempotent awards with daily caps
- `media` — `MediaFacade` owns MediaAsset / Quote / RightsGrant / ContentPublication; GET `/content/today` (ORIGINAL fixtures), GET `/media`, POST `/media/:id/access` (FIXTURE_SIMULATED labelled)
- `notifications` — `NotificationsFacade` owns NotificationPreference / DeviceRegistration / NotificationIntent / InAppNotification; preferences, devices, inbox; delivery is SIMULATED until push provider configured
- `coaching` — `CoachingFacade` owns CoachConversation / CoachMessage / CoachActionProposal; POST `/coach/messages`, confirm/reject proposals; FixtureCoachProvider by default (OpenAI PENDING)
- `privacy` — `PrivacyFacade` owns DataExportJob / AccountDeletionRequest; POST/GET `/me/export*`, POST `/me/deletion-request`, GET `/me/deletion-status`; fixture dry-run only
- `health` — `GET /health`, `/health/live`, `/health/ready`

## Worker (Milestone 1 + 7 + 9)

- BullMQ queue `saiyan-health` with noop `heartbeat` processor
- BullMQ queue `saiyan-notifications` processes due intents in **SIMULATED** mode (in-app inbox rows only; not FCM/APNs)
- BullMQ queue `saiyan-privacy` processes export/deletion stubs in **FIXTURE_DRY_RUN** (no object storage upload; **never wipes** User rows)

## Release scaffolding (Milestone 11 — not deployed)

- Dockerfiles: `apps/api`, `apps/web`, `apps/worker` (pnpm monorepo, non-root)
- Railway templates: `apps/*/railway.toml` + root `railway.toml` index; docs/14 snippets for Postgres/Redis plugins
- Local Docker Compose E2E **BLOCKED** when Docker Desktop engine requires elevated service
