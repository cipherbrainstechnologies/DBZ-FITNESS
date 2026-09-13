# Media and Content

## Requested experience

Support personalised:

- Character images.
- Background illustrations.
- Transformation animations.
- Motivational quotation cards.
- Authentic licensed English dialogue.
- Original motivational copy.
- Music playlists.
- Workout sound effects.
- Optional spoken coaching.

Media selection depends on the member's character, tone, activity,
language, preferences, and current context.

## Rights-aware architecture

Treat rights clearance as content configuration.

Do not assume one agreement covers character artwork, music compositions,
recordings, English dubbing, actor performances, and app-store branding.

Track the specific grant for each intended use.

Development must continue using original content when commercial franchise
assets are unavailable.

An administrator marking an item approved is an internal workflow action,
not evidence that a licence exists. Require the actual grant reference.

## Content entities

ContentPack:
id, name, mode, locale, version, status, supportedTerritories,
rightsGrantIds, fallbackPackId.

MediaAsset:
id, type, storageKey, mimeType, checksum, dimensions, duration,
altText, transcript, characterTags, moodTags, activityTags,
explicitContent, rightsGrantIds, publicationStatus, version.

RightsGrant:
id, rightsHolder, evidenceReference, permittedUses, platforms,
territories, validFrom, validUntil, attributionText,
offlinePermission, derivativePermission, reviewer, reviewedAt.

Quote:
id, text, kind, attribution, characterId, locale, dubVersion,
sourceReference, contextTags, rightsGrantIds, status.

MusicTrack:
id, assetId or externalLink, title, creator, genre, mood,
intensityTag, duration, attribution, rightsGrantIds, status.

## Publication rules

An asset is deliverable only when:

- Its content review is approved.
- Applicable grants cover the requested use.
- Territory and platform are covered.
- Validity dates are current.
- Required attribution can be shown.
- The asset has not been withdrawn.

Check eligibility on the server and when issuing delivery URLs.

Do not rely solely on hiding a client-side button.

When a grant expires:
unpublish affected content, invalidate delivery access, purge relevant
caches, cancel queued notifications using it, and select fallback content.

Licensed offline downloads are disabled by default.
Enable them only when the grant allows caching and the implemented expiry
behaviour meets its requirements.

Do not claim previously delivered files can always be remotely erased.

## Quotes and English dialogue

Support three content kinds:

- ORIGINAL_COPY.
- VERIFIED_LICENSED_QUOTE.
- LICENSED_AUDIO_DIALOGUE.

Original copy must never be presented as a verified line from the show.

For authentic dialogue store:
exact wording, relevant dub, source reference, speaker attribution,
permitted use, and review status.

Do not ask an LLM to invent canonical quotations.

Do not scrape dialogue libraries or download clips from unauthorised uploads.

## Original seed copy

Use original lines such as:

- "Your next level starts with today's small effort."
- "Control the movement. Own the progress."
- "A short session still moves your story forward."
- "Recovery prepares you for the next challenge."
- "Return with a plan, not punishment."
- "Build a routine your real life can support."

These are application copy, not Dragon Ball dialogue.

## Personalisation

Hard-filter by:
publication status, rights, locale, user settings, explicit-content setting,
and context suitability.

Then rank by:
character preference, selected tone, activity, mood, and recent history.

Avoid repeating the same motivational quote within seven days when enough
eligible content exists.

If a member reports distress or pain, use plain supportive wording.

## Music

Implement:

1. In-app playback of original or appropriately licensed tracks.
2. User-initiated external playlist links.

Do not require a streaming-service account for core fitness functions.

A future streaming SDK integration requires a separate review of current
provider capabilities, commercial access, and permitted use.

Do not synchronise third-party streaming tracks with transformation videos,
exported reels, or workout animations unless the relevant permissions
explicitly allow it.

## Player behaviour

- Playback begins only after user interaction.
- Separate controls for music, coaching, and effects.
- Handle calls, audio-focus loss, headphones, and app backgrounding.
- Pause or lower music appropriately for workout instruction.
- Persist preference, not unauthorised audio copies.
- Respect platform background-audio requirements.
- Browser playback limitations must have clear fallbacks.

Do not autoplay loud character dialogue from a notification.

## Images and progress photos

Character art is separate from member photos.

Member photos are private by default, removable, and never included in
public feeds or promotional material without specific consent.

Do not use body photos to infer gender, health conditions, or a guaranteed
future physique.

## Media administration

Provide:
upload, metadata editing, preview, rights attachment, approval,
scheduled publication, withdrawal, expiry alerts, and replacement.

Keep licence documents private to authorised administration roles.
