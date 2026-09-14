# Decision Evolution Log

### Decision #001 – Empty-repo monorepo scaffold
- Date: 2026-09-13
- Author: Cursor Agent (Love Chauhan owner)
- Summary: Scaffold Saiyan Ascend as documented pnpm monorepo with NestJS, Next.js, Expo, Prisma, BullMQ.
- Reason: Repository contained only the specification pack; README defines this layout.
- Affected Modules: all apps and packages
- Reversal Conditions: Existing suitable implementation appears (none found)
- Status: Active

### Decision #002 – Local email/password auth for Milestone 1
- Date: 2026-09-13
- Author: Cursor Agent
- Summary: Use Argon2id password hashing with revocable server sessions; HttpOnly cookies for web; bearer access + refresh for mobile.
- Reason: Spec requires maintained auth patterns without inventing crypto; credentials for third-party IdP not configured.
- Affected Modules: Identity
- Reversal Conditions: Owner configures external IdP
- Status: Active

### Decision #004 – Nest API ESM + profiles façade boundary
- Date: 2026-09-13
- Author: Cursor Agent (API/worker subagent)
- Summary: `apps/api` is ESM NestJS importing `@saiyan/database` / `@saiyan/contracts`; profiles owned only via `ProfileFacade`.
- Reason: Workspace packages are ESM; façade enforces modular-monolith ownership for later modules.
- Affected Modules: Identity, Profiles, Health, Worker
- Reversal Conditions: Dual-publish CJS packages if Nest ESM becomes problematic
- Status: Active

### Decision #005 – Web cookie credentials + next-intl
- Date: 2026-09-13
- Author: Cursor Agent (web subagent)
- Summary: Milestone 1 web uses Next.js 15 App Router, calls API with `credentials: 'include'` and `Accept: application/json; auth=cookie`, and ships next-intl dictionaries for en/fr/es.
- Reason: Aligns with API cookie mode; production-first i18n without blocking M1 on a full CMS.
- Affected Modules: Web
- Reversal Conditions: None while first-party BFF remains the web session path
- Status: Active

### Decision #016 – Same-origin web BFF + original character portraits
- Date: 2026-09-13
- Author: Cursor Agent
- Summary: Browser calls `/api/v1` on the Next.js host; the route handler proxies to the API and rebinds cookies to the web origin. ORIGINAL portraits are product-owned illustrations with honest inspiration labels — not official Dragon Ball Z stills.
- Reason: Split Railway domains dropped cross-site auth cookies after register; third-party cookie blocking made SameSite=Lax on the API host unusable. Licensed franchise artwork remains PENDING (`DEP-M2-001`).
- Affected Modules: Web auth, Identity cookies, Characters, Media static, Mobile onboarding
- Reversal Conditions: Collapse web+API onto one origin with first-party cookies, or obtain verified DBZ grants before publishing licensed stills
- Status: Active

### Decision #005 – Expo SDK 53 mobile shell
- Date: 2026-09-13
- Author: Cursor Agent (mobile subagent)
- Summary: Scaffold `@saiyan/mobile` with Expo SDK 53 + Expo Router tabs template; monorepo Metro watchFolders; SecureStore bearer tokens.
- Reason: SDK 53 installs cleanly on Node 20+ (verified Node 26); matches Expo Router + TypeScript tabs path without interactive SDK picker.
- Affected Modules: Mobile
- Reversal Conditions: Move to SDK 52 only if a device/Expo Go pin requires it
- Status: Active

### Decision #006 – Milestone 2 onboarding/character façades
- Date: 2026-09-13
- Author: Cursor Agent
- Summary: Own onboarding/screening/diet via `OnboardingFacade` and content packs/characters via `CharacterFacade`; `CONTENT_MODE` env selects active pack; DBZ rows seeded DRAFT/UNAVAILABLE until rights verified.
- Reason: Modular-monolith ownership for Training/Nutrition; rights-aware content without blocking ORIGINAL development.
- Affected Modules: Onboarding, Characters, Database, Domain, Contracts
- Reversal Conditions: None while M2 boundaries hold
- Status: Active

### Decision #007 – Web onboarding wizard under /app/onboarding
- Date: 2026-09-13
- Author: Cursor Agent (web subagent)
- Summary: Member web resumes GET `/onboarding`, saves each step via PUT with UI states, selects ORIGINAL characters via GET `/characters` + POST `/characters/select`, completes then redirects to Today; Today redirects incomplete members back to the wizard.
- Reason: Milestone 2 client vertical slice; character is motivational theme only with explicit disclaimer; no fake workout/meal stats or licensed-asset claims.
- Affected Modules: Web
- Reversal Conditions: Move wizard into a dedicated marketing funnel route if product later separates setup from `/app`
- Status: Superseded by Decision #016 (character is a persistent personal coach)

### Decision #008 – Milestone 3 TrainingFacade + constraint-first plan engine
- Date: 2026-09-13
- Author: Cursor Agent
- Summary: Own training catalogue/plans/workouts via `TrainingFacade`; deterministic preview with `TRAINING_POLICY_VERSION`; character preference tags may rank templates but never override equipment, time, or screening; Idempotency-Key on activate/complete; XP awarded in completion transaction via ProgressionFacade (M5).
- Reason: docs/04 precedence + modular-monolith ownership; Docker may be down so code ships without claiming DB E2E.
- Affected Modules: Training, Domain, Contracts, Database, Profile/Onboarding/Character façades
- Reversal Conditions: None while M3 boundaries hold
- Status: Active

### Decision #009 – Milestone 4 NutritionFacade + diet/allergy hard filters
- Date: 2026-09-13
- Author: Cursor Agent
- Summary: Own food/recipe/targets/meal-plans/logs/grocery via `NutritionFacade`; `NUTRITION_POLICY_VERSION`; diet-pattern + allergy hard filters (unknown allergen metadata unsafe); planned vs logged consumption separate; HABIT_ONLY and optional estimates with explicit no-calorie-guarantee disclaimers; diet prefs via `OnboardingFacade` only; Training must not import Nutrition entities.
- Reason: docs/05 + docs/09 nutrition routes; fixture foods labelled as non-clinical; Docker/DB E2E not claimed without Postgres.
- Affected Modules: Nutrition, Domain, Contracts, Database, Onboarding façade
- Reversal Conditions: None while M4 boundaries hold
- Status: Active

### Decision #009 – Member web training routes under /app/train
- Date: 2026-09-13
- Author: Cursor Agent (web subagent)
- Summary: Milestone 3 member web uses `/app/train` for current plan + preview/activate and `/app/train/session/[plannedSessionId]` for the workout player (POST start is idempotent resume); Today shows a real Start/Resume CTA only when a planned session exists for the member local date; `screeningRecordId` exposed on onboarding progress for preview inputs; no licensed exercise demo media.
- Reason: Complete M3 client vertical slice against cookie-auth training APIs with honest empty states and en/fr/es i18n.
- Affected Modules: Web, Onboarding contracts (screeningRecordId), Contracts training response types
- Reversal Conditions: Add GET `/workout-sessions/:id` and switch player route to workout session id if deep-linking without start-on-load is required
- Status: Active

### Decision #010 – Member web Fuel routes under /app/fuel
- Date: 2026-09-13
- Author: Cursor Agent (web subagent)
- Summary: Milestone 4 member web uses `/app/fuel` for meal-plan preview/activate, habit-only target preview/activate, planned vs session-logged consumption lanes, swap preview/confirm, and grocery current; Today shows a compact next-meal snippet only when an active meal plan exists; calorie figures only for ESTIMATED/PROFESSIONAL API modes with estimate labelling; consumed list is session-scoped because there is no GET meal-logs list.
- Reason: Complete M4 client vertical slice against cookie-auth NutritionFacade routes with honest empty states and en/fr/es i18n.
- Affected Modules: Web, Contracts nutrition response type exports
- Reversal Conditions: Add GET meal-logs (and optionally GET current nutrition target) if persisted consumed history or server target display is required across sessions
- Status: Active

### Decision #011 – Milestone 5 ProgressionFacade + XP ledger
- Date: 2026-09-13
- Author: Cursor Agent
- Summary: Own append-only XP ledger / daily category caps / cosmetic milestone unlocks via `ProgressionFacade`; `applyXpAward` enforces eligible sustainable events and caps; Training completes workouts by calling `awardIfEligible` in the same DB transaction; character switch upserts presentation only and never clears XP; web `/app/progress` shows ledger with game-level ≠ health disclaimer.
- Reason: docs/03 progression integrity + façade boundaries; retries must not inflate XP; Docker/DB E2E not claimed without Postgres.
- Affected Modules: Progression, Training, Domain, Contracts, Database, Characters (comment), Web
- Reversal Conditions: None while M5 ledger uniqueness and façade ownership hold
- Status: Active

### Decision #012 – Milestone 6–7 media + SIMULATED notifications
- Date: 2026-09-13
- Author: Cursor Agent (sibling)
- Summary: MediaFacade serves ORIGINAL fixture content with honest attribution; NotificationsFacade + worker process intents in SIMULATED delivery only until push provider is configured.
- Reason: docs/06–07 require graceful unavailable media and opt-in scheduling without fabricating licences or claiming real push.
- Affected Modules: Media, Notifications, Worker, Database, Domain, Contracts, Web Today strip
- Reversal Conditions: Replace FIXTURE_SIMULATED / SIMULATED modes only after storage and push credentials are VERIFIED
- Status: Active

### Decision #013 – Milestone 11 Railway scaffolding without deploy
- Date: 2026-09-13
- Author: Cursor Agent
- Summary: Ship pnpm-aware Dockerfiles and railway.toml templates for api/web/worker plus managed Postgres/Redis notes; do not deploy until owner authorises.
- Reason: docs/14 + M11 require deploy files as implementation scope while forbidding unauthorised publish.
- Affected Modules: deploy templates, README, docs/14, docs/BUILD_STATUS
- Reversal Conditions: None for templates; live service settings may diverge after first authorised Railway link
- Status: Active

### Decision #012 – Milestone 6 MediaFacade + ORIGINAL-only today content
- Date: 2026-09-13
- Author: Cursor Agent
- Summary: Own MediaAsset / Quote / RightsGrant / ContentPublication via `MediaFacade`; seed publishes ORIGINAL_COPY only; DRAFT DBZ dialogue rows are admin workflow shells without rights grants; access URLs are FIXTURE_SIMULATED or labelled SIGNED_URL_STUB; Training/Nutrition do not import media Prisma models.
- Reason: docs/06 rights-aware delivery; never fabricate authentic DBZ quotations or licences.
- Affected Modules: Media, Domain, Contracts, Database, Web (Today strip), Worker (no media jobs yet)
- Reversal Conditions: Switch access to real signed URLs only after DEP-M6-001 object storage is verified
- Status: Active

### Decision #013 – Milestone 7 NotificationsFacade + SIMULATED worker dispatch
- Date: 2026-09-13
- Author: Cursor Agent
- Summary: Own preferences / devices / intents / in-app inbox via `NotificationsFacade`; domain enforces quiet hours, daily motivational caps, and timezone scheduling; worker claims due intents and writes InAppNotification with deliveryMode=SIMULATED only — not FCM/APNs (DEP-M7-001 PENDING).
- Reason: docs/07 delivery honesty and member controls; development continues without push credentials.
- Affected Modules: Notifications, Domain, Contracts, Database, Worker
- Reversal Conditions: Replace SIMULATED path with provider adapter after DEP-M7-001 is VERIFIED
- Status: Active

### Decision #014 – Milestone 8 CoachingFacade + FixtureCoachProvider
- Date: 2026-09-13
- Author: Cursor Agent
- Summary: Own coach conversations/messages/action proposals via `CoachingFacade`; `FixtureCoachProvider` returns structured responses from approved content only (`inventsNutritionNumbers=false`); domain `evaluateCoachProposalSafety` rejects screening/diet hard-rule bypasses; `COACH_PROVIDER=openai` falls back to fixture until DEP-M8-001 OpenAI adapter is implemented and keyed.
- Reason: docs/10 optional AI layer; core product works without LLM; never invent nutrition or override screening.
- Affected Modules: Coaching, Providers, Domain, Contracts, Database, API
- Reversal Conditions: Wire real OpenAI adapter only after DEP-M8-001 CONFIGURED/VERIFIED; keep safety gate.
- Status: Active

### Decision #015 – Milestone 9 PrivacyFacade + fixture export/deletion
- Date: 2026-09-13
- Author: Cursor Agent
- Summary: Own `DataExportJob` / `AccountDeletionRequest` via `PrivacyFacade`; deletion requires password re-auth; worker advances jobs in FIXTURE_DRY_RUN and never wipes User rows; download URLs are `fixture://…` until object storage (DEP-M9-001) and authorised wipe (DEP-M9-002).
- Reason: docs/08–09 privacy controls; honest dry-run until storage and deletion policy are ready; tests must not wipe DB.
- Affected Modules: Privacy, Database, Contracts, Worker, Identity (re-auth)
- Reversal Conditions: Enable real archive upload and account wipe only after owner authorisation + verified storage.
- Status: Active

### Decision #016 – Character is a persistent personal coach
- Date: 2026-09-14
- Author: Cursor Agent
- Summary: The chosen DBZ-named first-party coach (Goku, Vegeta, Gohan, Future Trunks, Broly in ORIGINAL mode) is a versioned, server-persisted coaching persona. Post-auth routing uses `resolveAuthenticatedMemberJourney`. Optional ORIGINAL media must not block selection. Safety/screening/equipment/nutrition rules remain authoritative; the coach explains them. Original coaching copy only — not authentic quotations, not a franchise service.
- Reason: Owner clarification supersedes “motivational theme only.” Catalogue listing by pack `mode` (not a single pack row) plus dedicated `/app/coach` after WELCOME/consent.
- Affected Modules: Domain, Onboarding, Characters, Coaching, Notifications worker, Web, Mobile, Database, Contracts
- Reversal Conditions: None while the personal-coach product requirement holds
- Status: Active
