# Decisions and Dependencies

## Accepted starting assumptions

- Product working name: Saiyan Ascend.
- Audience: inclusive adult fitness, version 1 ages 18+.
- Platforms: Android, iOS, and responsive member web.
- Administration: web.
- Backend hosting preference: Railway.
- Primary language: English.
- Initial food emphasis: Indian and practical international options.
- Unit storage: metric.
- Display units: member-selectable where implemented.
- Pilot monetisation: free.
- Core planning: deterministic rules.
- AI coaching: optional.
- Calendar and wearables: deferred.
- User notifications: opt-in.
- Progress photos: optional and private.
- Original content: immediately usable once appropriately sourced.
- DBZ content: complete integration path with usage-specific rights records.

These are implementation assumptions, not claims that the owner has already
purchased services or licensed franchise content.

## Owner dependencies

| Dependency | Needed for | Continue without it |
| --- | --- | --- |
| Final brand/domain | Public branding | Use working branding |
| DBZ commercial permissions | Franchise publication | Build complete system with original content |
| Approved artwork and dialogue | Authentic character experience | Original visuals and copy |
| Music rights and files | Full in-app soundtrack | Original permitted samples or external links |
| Exercise/programme review | Public automated training guidance | Draft templates and labelled fixtures |
| Nutrition-policy review | Public automated nutrition targets | Habit mode and draft calculations |
| Food-data credentials/import | Expanded food search | Traceable local catalogue |
| Email provider | Production account email | Local email capture |
| Mobile push configuration | Real push delivery | Inbox and simulation |
| AI key and budget | Generative coach | Deterministic fallback |
| Object storage | Production private uploads | Local development storage |
| Railway project access | Hosted deployment | Docker and deployment files |
| Apple/Google developer setup | Store distribution | Development builds |
| Privacy contact and policies | Public operation | Draft operational documents |

## How to request a dependency

When a dependency becomes necessary, provide:

1. The implemented feature it enables.
2. The current fallback.
3. The exact credential, file, or owner decision required.
4. Where the owner should configure it securely.
5. The verification that will follow.

Do not ask for the same item repeatedly.
Do not treat optional AI or franchise-media availability as a blocker to
the rest of the application.

## Owner decisions that can remain open during development

- Final product name.
- Exact launch territories.
- Licensed character availability.
- Original artwork style.
- Final approved programme catalogue.
- Commercial subscription structure.
- Additional languages.
- Timing of wearable and calendar integrations.

## Material constraints

- Fictional character physiques are not achievable-outcome guarantees.
- Adult general-wellness logic is not a universal medical programme.
- An app role does not establish professional qualifications.
- A rights checkbox does not create a licence.
- A streaming subscription does not automatically permit music reuse.
- Push notifications are subject to permissions, device state, and delivery limits.
- Railway deployment does not publish mobile applications to stores.
- Provider integrations require real credentials and verification.
- Database correctness cannot be established by UI demonstrations alone.

## Change control

If the owner changes a decision:

- Record the change and date.
- Identify affected specifications.
- Update only relevant future behaviour.
- Preserve historical member records.
- Adjust the implementation plan.
- Explain material consequences concisely.

## Implementation status template

For every dependency record:

ID:
Description:
Status: NOT_NEEDED / PENDING / CONFIGURED / VERIFIED / BLOCKED
Affected feature:
Current fallback:
Owner action:
Secure configuration location:
Verification required:
Last checked:
Notes:

## Milestone 2 dependency records

### DEP-M2-001 – DBZ commercial content rights

ID: DEP-M2-001  
Description: Commercial permissions for franchise character names, artwork, dialogue, and related media in `DBZ_LICENSED` content pack.  
Status: PENDING  
Affected feature: Published character presentations when `CONTENT_MODE=DBZ_LICENSED`; licensed media delivery.  
Current fallback: `CONTENT_MODE=ORIGINAL` (default). Seed creates ORIGINAL archetypes (Explorer, Strategist, Scholar, Guardian, Titan) as PUBLISHED. DBZ_LICENSED pack rows exist for Goku/Vegeta/Gohan/Trunks/Broly with `publicationStatus` DRAFT or UNAVAILABLE and `rightsVerifiedAt=null`. These are structural placeholders only — not authentic licensed assets and not claimed as approved for publication.  
Owner action: Provide verified rights grant evidence (holder, permitted uses, territories, validity) before any admin publishes DBZ presentations.  
Secure configuration location: Admin rights-grant records (future) + env `CONTENT_MODE`; never commit grant documents with secrets.  
Verification required: After grants are recorded, set pack/presentation publicationStatus to PUBLISHED only for covered uses; confirm `GET /api/v1/characters` returns licensed presentations solely when mode and rights allow.  
Last checked: 2026-09-13  
Notes: Selecting Broly (or Titan) must never auto-select an advanced programme; screening outcomes remain authoritative.

### DEP-M2-002 – Screening answer encryption at rest

ID: DEP-M2-002  
Description: Application-layer or KMS encryption for `ScreeningRecord.answersRestricted`.  
Status: PENDING  
Affected feature: Long-term storage of restricted screening signals.  
Current fallback: Answers stored as access-restricted JSON; member-facing `GET /onboarding` returns outcome + restriction codes only (never raw answers).  
Owner action: Choose encryption approach (provider KMS / app cipher) and configure keys out of band.  
Secure configuration location: Environment / secret manager (not chat).  
Verification required: Confirm GET responses omit `answersRestricted`; decrypt path limited to authorised support roles.  
Last checked: 2026-09-13  
Notes: Milestone 2 intentionally does not invent field-level crypto.

## Milestone 3 dependency records

### DEP-M3-001 – Fitness programme content review

ID: DEP-M3-001  
Description: Qualified review before publishing automated programme templates and exercise catalogue beyond draft fixtures.  
Status: PENDING  
Affected feature: Public automated training guidance; expanding beyond the seeded ORIGINAL beginner bodyweight template.  
Current fallback: Seed publishes a small ORIGINAL exercise catalogue and one beginner home bodyweight programme template as PUBLISHED for development; a dumbbell template remains DRAFT. Domain engine never invents substitutes or clinical claims. Draft/review statuses are explicit.  
Owner action: Arrange fitness-reviewer approval of catalogue and templates before treating them as production automated guidance.  
Secure configuration location: Admin content-review workflow (future); no secrets required for this decision.  
Verification required: After review, confirm `publicationStatus`/`reviewStatus` for approved templates; member preview/activation only uses PUBLISHED templates.  
Last checked: 2026-09-13  
Notes: Character emphasis may bias preference ranking only; equipment, time, and screening remain hard constraints (domain unit-tested).

### DEP-M3-002 – Postgres for training migrate/seed/E2E

ID: DEP-M3-002  
Description: Running Postgres (and Redis for other services) to apply M3 migration, seed training catalogue, and verify training API E2E.  
Status: BLOCKED  
Affected feature: Live `pnpm db:migrate` / `pnpm db:seed` and HTTP verification of training routes.  
Current fallback: Migration SQL, Prisma schema, Nest Training module, domain engine, and contracts are implemented in-repo; no claim that DB tests passed while Docker/Postgres is unavailable.  
Owner action: Start Docker Compose (`pnpm docker:up`) or provide a reachable `DATABASE_URL`.  
Secure configuration location: `.env` `DATABASE_URL` (not chat).  
Verification required: `pnpm db:migrate` → `pnpm db:seed` → exercise list, plan preview/activate (Idempotency-Key), shorten, workout set log, complete/abandon against live API.  
Last checked: 2026-09-13  
Notes: XP award on workout complete is implemented via ProgressionFacade (Milestone 5); live E2E still blocked on Postgres.

## Milestone 4 dependency records

### DEP-M4-001 – Nutrition policy and food-data review

ID: DEP-M4-001  
Description: Qualified nutrition-policy review and permitted food-data import before treating automated energy targets or fixture macros as production guidance.  
Status: PENDING  
Affected feature: Public `ESTIMATED_TARGET` automation; expanding beyond seeded ORIGINAL Indian-friendly fixture foods/recipes.  
Current fallback: `HABIT_ONLY` is fully supported; optional Mifflin–St Jeor drafts and soft energy proximity are labelled estimates with `NO_CALORIE_GUARANTEE` disclaimers. Seed foods/recipes use explicit `fixture/USDA-style placeholder` source labels — not clinical approval and not claimed as verified FoodData Central imports. Allergy and diet-pattern hard filters always apply.  
Owner action: Arrange nutrition-reviewer approval of policy bounds and approve a permitted food-data source/credentials for catalogue expansion.  
Secure configuration location: Future admin review workflow + food-provider credentials in secret manager (not chat).  
Verification required: After review, confirm publication/review statuses; member target activation only uses reviewed modes; fixture labels remain honest until replaced by verified imports.  
Last checked: 2026-09-13  
Notes: Do not invent calorie guarantees; planned meals and meal logs remain separate records.

### DEP-M4-002 – Postgres for nutrition migrate/seed/E2E

ID: DEP-M4-002  
Description: Running Postgres to apply M4 migration, seed nutrition fixtures, and verify nutrition API E2E.  
Status: BLOCKED  
Affected feature: Live `pnpm db:migrate` / `pnpm db:seed` and HTTP verification of nutrition routes.  
Current fallback: Migration SQL, Prisma schema, Nest Nutrition module, domain filters/targets/plans, and contracts are implemented in-repo; **no claim that DB tests passed** while Docker/Postgres is unavailable.  
Owner action: Start Docker Compose (`pnpm docker:up`) or provide a reachable `DATABASE_URL`.  
Secure configuration location: `.env` `DATABASE_URL` (not chat).  
Verification required: `pnpm db:migrate` → `pnpm db:seed` → foods/recipes list, HABIT_ONLY target preview/activate, meal-plan preview/activate (Idempotency-Key), swap, meal-log CRUD, grocery current against live API.  
Last checked: 2026-09-13  
Notes: Cross-domain diet preference reads go through `OnboardingFacade`; Training must not import Nutrition entities.

## Milestone 5 dependency records

### DEP-M5-001 – Postgres for progression migrate/seed/E2E

ID: DEP-M5-001  
Description: Running Postgres to apply M5 migration, seed cosmetic milestone definitions, and verify progress API + workout-complete XP E2E.  
Status: BLOCKED  
Affected feature: Live `pnpm db:migrate` / `pnpm db:seed` and HTTP verification of `/progress/*` and XP award on workout complete.  
Current fallback: Migration SQL, Prisma schema, Nest Progression module, domain `applyXpAward`/caps, contracts, and web `/app/progress` are implemented in-repo; **no claim that DB tests passed** while Docker/Postgres is unavailable.  
Owner action: Start Docker Compose (`pnpm docker:up`) or provide a reachable `DATABASE_URL`.  
Secure configuration location: `.env` `DATABASE_URL` (not chat).  
Verification required: `pnpm db:migrate` → `pnpm db:seed` → complete workout twice with same Idempotency-Key / retry → single ledger row; `GET /progress/summary`, `/progress/xp-ledger`, `/progress/history`; `POST /characters/select` switch → XP ledger unchanged.  
Last checked: 2026-09-13  
Notes: Training awards XP only via `ProgressionFacade.awardIfEligible` inside the workout-complete transaction. Character selection must never delete ledger rows. Game level is cosmetic only (not a health claim).

### Decision — ProgressionFacade owns XP ledger

- Date: 2026-09-13
- Summary: Append-only `XpLedgerEntry` with uniqueness on `(userId, eventType, sourceEntityId, policyVersion)` plus `DailyXpCategory` for daily caps; `ProgressionFacade` is the only write path; Training calls `awardIfEligible` in the same transaction as workout completion.
- Reason: docs/03 idempotency and facade boundaries; prevent multi-device / retry inflation.
- Status: Active

## Milestone 6 dependency records

### DEP-M6-001 – Object storage for media delivery

ID: DEP-M6-001  
Description: Production object storage (and optional CDN signed URLs) for private media delivery.  
Status: PENDING  
Affected feature: Real `POST /media/:id/access` signed URLs beyond fixtures.  
Current fallback: Development returns `FIXTURE_SIMULATED` URLs (`fixture://…`); production path returns an explicitly labelled `SIGNED_URL_STUB` host (`signed-url-stub.invalid`) — not a working CDN.  
Owner action: Choose storage provider and configure credentials out of band.  
Secure configuration location: Secret manager / env (not chat).  
Verification required: After configuration, access returns time-limited signed URLs; withdrawn/expired assets fail eligibility checks.  
Last checked: 2026-09-13  
Notes: Eligibility is rechecked server-side on every access.

### DEP-M6-002 – DBZ dialogue / media commercial rights

ID: DEP-M6-002  
Description: Verified rights grants for licensed English dialogue and franchise media.  
Status: PENDING  
Affected feature: Publishing `VERIFIED_LICENSED_QUOTE` / `LICENSED_AUDIO_DIALOGUE` and DBZ pack media.  
Current fallback: Seed publishes ORIGINAL_COPY quotations only. Admin-ready DRAFT DBZ dialogue rows exist with empty `rightsGrantIds` and DRAFT publication — **no fabricated licences**. `GET /content/today` returns ORIGINAL fixtures only and labels copy as non-authentic.  
Owner action: Supply verified RightsGrant evidence before any publish.  
Secure configuration location: Admin rights-grant records + DEP-M2-001.  
Verification required: Member APIs never return licensed dialogue as authentic until grants cover use/territory/platform and publicationStatus is PUBLISHED.  
Last checked: 2026-09-13  
Notes: Extends DEP-M2-001 for dialogue/media specifically.

### DEP-M6-003 – Postgres for media migrate/seed/E2E

ID: DEP-M6-003  
Description: Running Postgres to apply M6/M7 migration, seed ORIGINAL quotes, and verify media HTTP routes.  
Status: BLOCKED  
Affected feature: Live migrate/seed and `GET /content/today`, `GET /media`, `POST /media/:id/access` E2E.  
Current fallback: Schema, migration, Nest Media module, domain eligibility helpers, contracts, and web Today strip implemented in-repo; **no DB E2E claim** without Postgres.  
Owner action: Start Docker Desktop with a healthy elevated engine (`pnpm docker:up`) or provide reachable `DATABASE_URL`.  
Secure configuration location: `.env` `DATABASE_URL`.  
Verification required: migrate → seed → today content returns ORIGINAL quotes only; access returns FIXTURE_SIMULATED; DRAFT DBZ dialogue absent from member today.  
Last checked: 2026-09-13  
Notes: Docker Desktop engine currently cannot start without elevated service on the development Windows host.

### Decision — MediaFacade owns rights-aware delivery

- Date: 2026-09-13
- Summary: `MediaFacade` owns MediaAsset / Quote / RightsGrant / ContentPublication; member today strip is ORIGINAL-only; delivery URLs are fixture/stub labelled.
- Reason: docs/06 rights-aware architecture; never fabricate authentic DBZ quotations.
- Status: Active

## Milestone 7 dependency records

### DEP-M7-001 – Mobile push provider (FCM / APNs)

ID: DEP-M7-001  
Description: Real mobile push configuration (FCM and/or APNs credentials, app identifiers, and delivery verification).  
Status: PENDING  
Affected feature: Production push delivery to devices.  
Current fallback: Worker processes `NotificationIntent` rows in **SIMULATED** delivery mode only — creates `InAppNotification` inbox items and sets intent status `DELIVERED_SIMULATED`. Responses and logs explicitly label SIMULATED. **No claim of real FCM/APNs.**  
Owner action: Configure push provider credentials and platform apps; verify a test device receives a real push.  
Secure configuration location: Secret manager / env (not chat); never commit provider keys.  
Verification required: After CONFIGURED, dispatch path switches from SIMULATED to provider adapter with receipt/unknown semantics documented; invalid tokens deactivated.  
Last checked: 2026-09-13  
Notes: Account security messages remain separate from motivational daily caps. Quiet hours and caps are enforced at dispatch recheck.

### DEP-M7-002 – Postgres + Redis for notification E2E

ID: DEP-M7-002  
Description: Running Postgres and Redis so migrate/seed, API preference/device/inbox routes, and worker SIMULATED intent processing can be exercised end-to-end.  
Status: BLOCKED  
Affected feature: Live notification preference/device/inbox HTTP + worker poll of due intents.  
Current fallback: Prisma models, Nest Notifications module, domain quiet-hours/cap/TZ helpers (+ unit tests), and SIMULATED worker processor are in-repo; **no live E2E claim**.  
Owner action: Healthy Docker Compose (`pnpm docker:up`) with elevated Docker service, or reachable `DATABASE_URL` / `REDIS_URL`.  
Secure configuration location: `.env`.  
Verification required: PUT preferences; POST device; insert due intent → worker creates in-app row with `deliveryMode=SIMULATED`; quiet hours / daily cap suppress correctly.  
Last checked: 2026-09-13  
Notes: Same Docker elevated-service blocker as other DB deps.

### Decision — NotificationsFacade + SIMULATED worker dispatch

- Date: 2026-09-13
- Summary: Preferences/devices/intents/inbox owned by `NotificationsFacade`; worker claims due intents and delivers to in-app inbox only under `deliveryMode=SIMULATED` until DEP-M7-001 is verified.
- Reason: docs/07 delivery semantics; push acceptance is not proof of user visibility; honest fixture mode for development.
- Status: Active

## Milestone 8 dependency records

### DEP-M8-001 – OpenAI (or other) AI coach provider

ID: DEP-M8-001  
Description: Generative coach provider credentials, model selection, budgets, and a production adapter that returns validated structured responses.  
Status: PENDING  
Affected feature: Live LLM coaching beyond deterministic FixtureCoachProvider.  
Current fallback: `COACH_PROVIDER` defaults to `fixture`. If `COACH_PROVIDER=openai` without `OPENAI_API_KEY`, or when the OpenAI adapter is not yet implemented, API uses `FixtureCoachProvider` and labels the response note accordingly. Fixture responses use approved content only; `inventsNutritionNumbers=false`; domain `evaluateCoachProposalSafety` rejects screening/diet hard-rule bypasses. **No fabricated clinical advice.**  
Owner action: Choose provider; configure API key and budget out of band; authorise spend caps.  
Secure configuration location: Secret manager / env `OPENAI_API_KEY` (not chat); never commit keys.  
Verification required: After CONFIGURED, adapter returns schema-valid structured output; invalid model output falls back safely; safety gate still rejects bypass proposals; usage metering visible.  
Last checked: 2026-09-13  
Notes: Other LLM vendors remain PENDING under the same dependency until explicitly chosen.

### DEP-M8-002 – Postgres for coach migrate/seed/E2E

ID: DEP-M8-002  
Description: Running Postgres to apply M8/M9 migration and verify coach HTTP routes.  
Status: BLOCKED  
Affected feature: Live `POST /coach/messages` and proposal confirm/reject E2E.  
Current fallback: Schema, migration, Nest Coaching module, FixtureCoachProvider (+ unit tests), domain safety tests, and contracts are in-repo; **no DB E2E claim** without Postgres.  
Owner action: Healthy Docker Compose (`pnpm docker:up`) or reachable `DATABASE_URL`.  
Secure configuration location: `.env` `DATABASE_URL`.  
Verification required: migrate → post coach message → fixture response with inventsNutritionNumbers=false → confirm/reject proposal with Idempotency-Key.  
Last checked: 2026-09-13  
Notes: Same Docker elevated-service blocker as prior milestones.

### Decision — CoachingFacade + FixtureCoachProvider

- Date: 2026-09-13
- Summary: `CoachingFacade` owns coach entities; fixture provider is default; OpenAI documented PENDING; confirm records proposal only (plan mutations stay in Training/Nutrition façades).
- Reason: docs/10 optional AI; façade boundaries; safety before silent plan changes.
- Status: Active

## Milestone 9 dependency records

### DEP-M9-001 – Object storage for data export archives

ID: DEP-M9-001  
Description: Production object storage for member data-export archive delivery (signed download URLs).  
Status: PENDING  
Affected feature: Real export download beyond FIXTURE_DRY_RUN.  
Current fallback: `DataExportJob` completes as `READY_FIXTURE` with `downloadUrl=fixture://export-dry-run/{id}` and `downloadMode=FIXTURE_DRY_RUN`. Worker processes asynchronously without uploading blobs.  
Owner action: Configure storage credentials out of band (may share DEP-M6-001 bucket with export prefix).  
Secure configuration location: Secret manager / env (not chat).  
Verification required: After CONFIGURED, export job produces time-limited signed URL; expired jobs fail closed.  
Last checked: 2026-09-13  
Notes: Extends storage dependency for privacy exports specifically.

### DEP-M9-002 – Authorised account wipe / deletion fulfilment

ID: DEP-M9-002  
Description: Owner-authorised production path to fulfil account deletion (revoke sessions, erase/anonymise personal data, clear caches) after cooling-off.  
Status: PENDING  
Affected feature: Real account deletion beyond fixture status transitions.  
Current fallback: `AccountDeletionRequest` requires password re-auth; `dryRun=true`; worker advances PENDING → SCHEDULED_FIXTURE → COMPLETED_FIXTURE and **never deletes User rows or related data**. Tests must not wipe the database.  
Owner action: Approve deletion policy, retention windows, and operational runbook; then authorise enabling non-dry-run fulfilment.  
Secure configuration location: Feature flag / env after policy review (not chat).  
Verification required: After authorised, deletion removes/anonymises personal data per policy; audit trail retained; export of residual data documented.  
Last checked: 2026-09-13  
Notes: Offline sync from full M9 scope remains deferred; this slice covers export + deletion request APIs only.

### DEP-M9-003 – Postgres + Redis for privacy E2E

ID: DEP-M9-003  
Description: Running Postgres and Redis so migrate, export/deletion HTTP routes, and worker fixture processors can be exercised end-to-end.  
Status: BLOCKED  
Affected feature: Live `/me/export*` and `/me/deletion-*` + worker privacy poll.  
Current fallback: Prisma models, Nest Privacy module, and worker FIXTURE_DRY_RUN stubs are in-repo; **no live E2E claim**.  
Owner action: Healthy Docker Compose with elevated Docker service, or reachable `DATABASE_URL` / `REDIS_URL`.  
Secure configuration location: `.env`.  
Verification required: POST export with Idempotency-Key → worker READY_FIXTURE; POST deletion-request with password → status SCHEDULED_FIXTURE without User wipe.  
Last checked: 2026-09-13  
Notes: Same Docker blocker as other DB deps.

### Decision — PrivacyFacade + fixture dry-run worker

- Date: 2026-09-13
- Summary: Export and deletion owned by `PrivacyFacade`; worker never wipes DB in fixture mode; password re-auth required for deletion requests.
- Reason: docs/08–09 privacy controls with honest incomplete fulfilment until storage and wipe authorisation.
- Status: Active

## Milestone 11 dependency records

### DEP-M11-001 – Railway project access and deploy authorisation

ID: DEP-M11-001  
Description: Owner Railway project, private networking, and explicit authorisation to deploy staging/production.  
Status: PENDING  
Affected feature: Hosted web/api/worker + managed Postgres/Redis.  
Current fallback: In-repo Dockerfiles and `railway.toml` templates only — **NOT DEPLOYED**. Local Docker Compose remains the development path when the engine is healthy.  
Owner action: Create/link Railway project; authorise staging; provide service variable mapping without pasting secrets into chat.  
Secure configuration location: Railway dashboard / secret manager.  
Verification required: Staging health checks pass; controlled `migrate:deploy`; smoke register → onboarding → train → fuel → progress; worker SIMULATED path visible; no production publish without separate authorisation.  
Last checked: 2026-09-13  
Notes: Mobile binaries are not Railway web services.

