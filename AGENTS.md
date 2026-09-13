# Implementation Instructions

## Working approach

Inspect the repository, existing instructions, package manager, architecture,
and design conventions first.

If the repository is empty, scaffold the structure defined in README.md.
If an existing implementation is suitable, extend it and document deviations.

Implement one complete vertical slice at a time:
schema -> domain logic -> API -> client -> verification.

Do not finish with a collection of disconnected screens.

## Technical standards

- Use TypeScript with strict checking.
- Validate external input at every trust boundary.
- Keep domain calculations independent of UI and provider SDKs.
- Store canonical values in metric units; convert for display.
- Store timestamps in UTC and retain relevant IANA time zones.
- Version programmes, policies, content, and calculation inputs.
- Use database transactions for related state changes.
- Make retries safe through idempotency and uniqueness constraints.
- Use structured logs with correlation IDs and sensitive-data redaction.
- Use the existing lockfile or create and commit a deterministic lockfile.
- Check current official documentation before adding integrations.
- Pin compatible dependency versions after verifying them.

## Product rules

- Any gender may choose any character or training goal.
- Character selection cannot override safety, recovery, or equipment limits.
- Rest and sustainable consistency contribute to progression.
- Never reward starvation, pain tolerance, or excessive exercise.
- Never fabricate food nutrition values, clinical approval, or media rights.
- Do not attribute original motivational copy to a Dragon Ball character
  as an authentic quotation.
- Distinguish simulated delivery from real push/email delivery.
- Do not generate a fictional body transformation and label it a prediction.

## Interface requirements

Every implemented action must have:

- A real handler.
- Validation.
- Loading or pending feedback.
- A success state.
- A recoverable error state.
- Accessible interaction.
- Correct persistence or an explicit explanation of why it is local.

Avoid placeholder charts presented as a member's real data.

## Missing dependencies

Continue all work that does not depend on the missing item.

Record:
dependency, affected feature, current fallback, exact owner action,
and verification required after configuration.

Ask only for information that materially blocks the next necessary step.
Do not ask the owner to supply secrets in ordinary chat.

## Verification and handover

Test meaningful failure modes and critical business rules.
Do not write large quantities of tests that merely mirror implementation.

After each milestone update docs/BUILD_STATUS.md with:

- Completed behaviour.
- Files or modules changed.
- Commands run and actual results.
- Remaining failures.
- External dependencies.
- Next milestone.

Never overwrite unrelated user changes or reset a production database.

Before publishing externally, prepare the concrete release and follow the
owner's deployment authorisation. Preparing deployment files is part of
the implementation scope.
