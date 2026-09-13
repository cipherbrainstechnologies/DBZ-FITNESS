# Notifications and Work-Life Support

## Channels

Version 1:

- In-app inbox.
- Mobile push.
- Transactional account email.

Motivational email is separately opt-in.
Web push can be added after capability testing; the inbox remains available.

## Member controls

- Categories enabled.
- Preferred workout reminder time.
- Meal reminders.
- Optional movement breaks.
- Weekly review.
- Tone.
- Quiet hours.
- Sleep window.
- Work and commuting windows.
- Active IANA time zone.
- Daily reminder cap.
- Pause-until date.
- Sensitive lock-screen content preference.

Default motivational cap: three notifications per local day.
The member can reduce the cap or disable notifications entirely.

Account security messages are handled separately from motivational caps.

## Default quiet hours

Use 22:00–08:00 in the member's local time as an editable starting point.

For shift workers, use their chosen sleep window instead.

Quiet hours crossing midnight must work correctly.

## Trigger examples

Workout approaching:
Offer the planned session and a shorter-session action.

Member has not started:
At most one suitable follow-up, if enabled and still useful.

Meal reminder:
Reference the meal type without exposing sensitive nutrition targets
on the lock screen by default.

Recovery day:
Reinforce the planned recovery action.

Missed sessions:
Offer a restart or reschedule after a suitable interval.
Do not send repeated guilt messages.

Weekly review:
Summarise participation and invite the member to adjust next week's plan.

## Priority

After hard eligibility filtering:

1. Member-requested workout reminder.
2. Member-requested weekly review.
3. Member-requested meal reminder.
4. Optional movement break.
5. Generic motivation.

Lower-priority messages are dropped when the daily cap is reached.

Do not send all deferred reminders when quiet hours end.

## Persistence

Store:

NotificationPreference.
DeviceRegistration.
NotificationIntent.
NotificationAttempt.
NotificationInboxItem.
NotificationSuppression.

Intent fields include:
userId, category, sourceEntityId, occurrenceKey, scheduleVersion,
scheduledLocalTime, timeZone, scheduledAtUtc, expiresAt,
contentVersion, status, dedupeKey.

Enforce a unique dedupeKey.

## Scheduling

Use a worker with a durable database schedule and transactional outbox.

Jobs should contain identifiers, not full health profiles or secret tokens.

At dispatch time recheck:

- Current consent.
- Current device registration.
- Quiet hours.
- Paused status.
- Current plan version.
- Whether the activity was already completed.
- Content and rights availability.
- Local-day cap.
- Intent expiry.

Cancel stale intents after rescheduling, completion, or preference changes.

Use atomic claiming and expiring leases so multiple workers cannot
independently process the same due intent.

## Time zones and daylight saving

Store the intended local schedule separately from the UTC execution time.

When a member accepts a new time zone, regenerate only future intents.

Use a defined DST policy:
- Nonexistent local time: move to the next valid local time if still useful.
- Repeated local time: deliver once.

Retain the time zone used for historical activity and XP dates.

Do not rewrite historical streak dates when someone travels.

## Delivery semantics

Push-provider acceptance is not proof the person saw the message.

Track:
queued, claimed, submitted, receipt-confirmed where supported,
failed, expired, suppressed, and delivery-unknown.

Retry transient failures with bounded backoff.
Deactivate invalid device tokens.
Avoid unlimited retries after the message is no longer useful.

External push delivery cannot be guaranteed exactly once.
Maintain application-level idempotency and document uncertain outcomes.

## Device policy

Use the member's preferred active device for motivational push by default.
Allow the member to choose additional devices.

Logout removes that installation's account association.

Do not leak one account's notification through a reused device token.

## Work-life planning

Version 1 uses manually entered availability.
No calendar permission is needed.

Busy-day actions:

- Shorten today's session.
- Move to another available slot.
- Change to an appropriate recovery activity.
- Mark unavailable.
- Adjust next week's schedule.

Do not erase missed history when changing future availability.

Calendar integration is a later adapter using minimum required permissions.
