# Administration and Analytics

## Administration sections

1. Overview.
2. Members and support.
3. Characters and content packs.
4. Exercise library.
5. Programme templates.
6. Food data and recipes.
7. Nutrition policies.
8. Media and rights.
9. Notification operations.
10. AI operations.
11. Feature configuration.
12. Audit and privacy jobs.

## Content workflow

DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED -> WITHDRAWN.

Updates create a new version.

Review records contain:
reviewer identity, role, relevant credential reference where applicable,
review date, notes, and approved scope.

Do not auto-approve content during production seeding.

## Programme management

Administrators can:

- Create templates.
- Inspect eligibility rules.
- Preview against synthetic profiles.
- Review exercise substitutions.
- Inspect duration calculations.
- Publish versions.
- Withdraw unsafe or obsolete versions.
- See affected future plans.

Withdrawal must not erase historical session records.

## Recipe and food management

- Import traceable food records.
- Map aliases.
- Review raw/cooked state.
- Verify gram conversions.
- Inspect allergens and ingredient chains.
- Calculate recipe yield and portions.
- Preview diet eligibility.
- Publish recipe versions.
- Flag incomplete data.

Show why a recipe is excluded from a particular synthetic profile.

## Media management

- Upload and preview.
- Manage original/licensed classification.
- Attach rights evidence.
- Configure territories, platforms, and expiry.
- Show attribution.
- Withdraw assets.
- Inspect fallback coverage.

Show assets expiring within configurable periods.

## Notification operations

Inspect:

- Pending intents.
- Suppression reasons.
- Provider submission outcomes.
- Invalid tokens.
- Queue lag.
- Dead-letter jobs.

A test-send action must be explicitly triggered by an authorised operator
and target an identified test account.

Avoid a one-click broadcast to all members.
Campaigns require a concrete preview, audience definition, consent filters,
and confirmation.

## Support access

Support can inspect account state, app version, sync errors,
and integration status.

Sensitive member content requires a specific authorised support workflow
and audited access.

Do not provide unrestricted impersonation.

## Analytics definitions

Activation:
onboarding complete plus first eligible mission completed.

Weekly active member:
at least one meaningful training, meal, recovery, or planning action.

Training adherence:
completed planned training dose divided by the applicable scheduled dose,
with shortened sessions separately visible.

Retention:
returning cohort members performing a meaningful action.

Notification effectiveness:
interaction where observable, paired with opt-out and suppression rates.

Never treat provider acceptance as confirmed notification viewing.

## Privacy

Use pseudonymous analytics identifiers.
Exclude sensitive free text, photos, screening answers, and exact diet logs.

Corporate wellness dashboards are deferred.
If introduced, they must not expose individual employee health information.

## Operational configuration

Expose only safe configuration values.

Secrets belong in the deployment secret manager.
The admin portal can show configured/missing status, not secret values.

Audit configuration changes and permit rollback to a previous version.
