# AeroComms Phase 7 - Persistence Design

## Purpose and scope

This is the design reference for Phase 7 before migrations or application code are
created. It adds account-owned AeroComms progress persistence without changing Free
access, requiring an account, adding Stripe, or introducing AeroComms Pro.

The model is hybrid: durable state for product reads plus a minimal history of real
learning activity. Audio, recordings, transcripts, raw STT output, mission descriptors,
prompts, UI state, and the local `subscription` field are never persisted remotely.

Fixed decisions:

- Anonymous users continue using `aerocomms.v2` in localStorage.
- Progress is owned by `auth.users`, never by leads, products, or subscriptions.
- `ready-for-radio` is the canonical level ID; `rfr` is a legacy alias.
- Sync payloads declare `schema_version` and `content_version`.
- Progress never grants access. Future Pro access belongs to a separate entitlement
  system.

## Architecture

```
Anonymous:     AeroComms UI -> aerocomms.v2 localStorage
Authenticated: AeroComms UI -> local cache -> validated sync batch
                                      -> transactional Supabase RPC
                                      -> canonical remote snapshot
```

Local state remains responsive and a sync failure never blocks training. The browser
does not coordinate table writes itself: one authenticated RPC or server action applies
a complete, bounded batch transactionally. This is the authority for validation, alias
normalization, merge rules, and retry idempotency.

## Canonical tables

### `public.aerocomms_progress`

One row per user, used for current summary values.

| Field | Rules | Purpose |
| --- | --- | --- |
| `user_id` | UUID PK, FK `auth.users(id)` | Owner. |
| `schema_version` | smallint, not null | Sync contract version. |
| `content_version` | text, not null | Catalog version of last accepted batch. |
| `accuracy` | smallint nullable, check 0-100 | Current real rolling accuracy; null means no scored data. |
| `session_count` | integer >= 0 | All learning sessions. |
| `scored_session_count` | integer >= 0 | Genuinely scored sessions. |
| `streak_days` | integer >= 0 | Cached display streak. |
| `last_activity_at` | timestamptz nullable | Latest accepted activity. |
| `last_activity_date` | date nullable | Date used by streak policy. |
| `activity_timezone` | text nullable | IANA zone for the latest activity date. |
| `legacy_imported_at` | timestamptz nullable | First successful local legacy import. |
| `created_at`, `updated_at` | timestamptz, default now() | Audit timestamps. |

Primary key: `user_id`. No progress field represents plan, product, entitlement, or
payment status.

### `public.aerocomms_exercise_progress`

One row per completed or attempted exercise.

| Field | Rules |
| --- | --- |
| `user_id` | UUID, FK `auth.users(id)` |
| `exercise_id` | text, stable catalog ID |
| `content_version` | text, not null |
| `completed_at` | timestamptz nullable; null is valid for legacy completion with unknown time |
| `last_attempt_at` | timestamptz nullable |
| `best_score` | smallint nullable, check 0-100 |
| `attempt_count` | integer nullable, check >= 0; null means unknown legacy count, not zero |
| `updated_at` | timestamptz, default now() |

Primary key: `(user_id, exercise_id, content_version)`.

Index: `(user_id, updated_at DESC)`.

### `public.aerocomms_mission_progress`

One row per Guided ATC Sim mission.

| Field | Rules |
| --- | --- |
| `user_id` | UUID, FK `auth.users(id)` |
| `mission_id` | text, stable mission ID |
| `content_version` | text, not null |
| `level_id` | text, canonical normalized level ID |
| `best_score`, `last_score` | smallint, nullable where appropriate, check 0-100 |
| `best_stars`, `last_stars` | smallint, nullable where appropriate, check 0-3 |
| `attempt_count` | integer >= 1 |
| `completed_at` | timestamptz nullable, first completion |
| `last_attempt_at` | timestamptz, not null |
| `updated_at` | timestamptz, default now() |

Primary key: `(user_id, mission_id, content_version)`.

Index: `(user_id, level_id, updated_at DESC)`.

### `public.aerocomms_skill_stats`

The current app tracks running score totals and sample counts, not literal correct
answers. Preserve that meaning.

| Field | Rules |
| --- | --- |
| `user_id` | UUID, FK `auth.users(id)` |
| `skill_id` | closed check: listening, readbacks, phraseology, speaking, confidence |
| `score_sum` | integer >= 0 |
| `scored_count` | integer >= 0 |
| `content_version` | text, not null |
| `updated_at` | timestamptz, default now() |

Primary key: `(user_id, skill_id, content_version)`.

### `public.aerocomms_sessions`

Append-only minimal history of real learning activities. It is not a transcript or
telemetry table.

| Field | Rules |
| --- | --- |
| `id` | server UUID PK |
| `user_id` | UUID, FK `auth.users(id)` |
| `client_session_id` | UUID, not null |
| `activity_type` | closed check: exercise or mission |
| `exercise_id`, `mission_id` | exactly one according to `activity_type` |
| `source` | closed check: train or atc-mission |
| `level_id` | text nullable, canonical ID |
| `score` | smallint nullable, check 0-100; required only when `is_scored` |
| `stars` | smallint nullable, check 0-3; mission only |
| `is_scored` | boolean, not null |
| `duration_sec` | integer nullable, check >= 0 |
| `occurred_at` | timestamptz, not null |
| `activity_date` | date, not null |
| `activity_timezone` | IANA timezone text, not null |
| `content_version` | text, not null |
| `created_at` | timestamptz, default now() |

Unique constraint: `(user_id, client_session_id)`.

Indexes:

- `(user_id, occurred_at DESC)` for recent activity;
- `(user_id, exercise_id, occurred_at DESC)` for exercise recommendations;
- `(user_id, mission_id, occurred_at DESC)` for mission history.

### `public.aerocomms_sync_receipts`

Operational idempotency only; it is not product progress.

| Field | Rules |
| --- | --- |
| `user_id` | UUID, FK `auth.users(id)` |
| `operation_id` | UUID, not null |
| `payload_hash` | text, not null |
| `schema_version` | smallint, not null |
| `applied_at` | timestamptz, default now() |

Primary key: `(user_id, operation_id)`. Add an `applied_at` index only if a documented
receipt-retention job requires it.

## Relationships and RLS

All tables are children of `auth.users` through `user_id`. No table references leads,
products, subscriptions, Warhome, or Stripe. Content remains a versioned code catalog;
there is no database foreign key to static exercise or mission definitions.

RLS is enabled on every table:

- `anon`: no access.
- `authenticated`: read only rows with `user_id = auth.uid()`.
- `authenticated`: no unrestricted direct insert/update on state tables; writes use the
  validated sync boundary.
- `service_role`: server-only operational access, never exposed to the browser.
- Future Warhome reporting uses explicit server-side authorization, not a public policy.

The preferred sync RPC runs as `SECURITY INVOKER`. If `SECURITY DEFINER` is necessary,
it requires a fixed search path, revoked `PUBLIC` execution, and only the intended
server-only `service_role` grant.

## Sync, idempotency, and merge

Every batch contains an `operation_id`, `schema_version`, `content_version`, and a
bounded list of state changes and session facts. The transactional boundary:

1. Validates the authenticated user, payload size, field ranges, versions, and catalog IDs.
2. Normalizes aliases before persistence.
3. Returns the prior result only if `(user_id, operation_id)` and its payload hash match; a hash mismatch is rejected.
4. Inserts only missing sessions by `(user_id, client_session_id)`.
5. Merges state and updates summary data.
6. Stores a receipt and returns the canonical snapshot.

| Data | Merge rule |
| --- | --- |
| Completed exercises | Set union; completion never regresses. |
| Exercise completion time | Earliest known real time wins; unknown legacy time stays null. |
| Exercise best score | Maximum genuine score. |
| Exercise attempts | Only newly accepted session facts increase it; unknown legacy count stays null. |
| Mission best score/stars | Maximum per field. |
| Mission latest score/stars | Latest accepted attempt wins. |
| Mission attempts | Seed once from a legacy import, then count only new idempotent mission activities. |
| Skill totals | Add deltas from newly inserted scored sessions; never average averages. |
| Session history | Append-only, deduplicated by client session ID. |
| Last activity | Latest accepted `occurred_at`. |
| Streak | Derived from accepted activity dates, never blindly replaced by the client. |

Remote state is never wholesale-overwritten by a local blob. A retry must not increase
attempts, counts, or skill totals twice.

An authenticated reset is an idempotent server operation. It deletes durable learning
rows, stores `reset_at`, and ignores subsequently received sessions at or before that
cutoff so a stale device cannot restore deleted history.

## Migration from `aerocomms.v2`

Anonymous use is unchanged. On first authenticated sync:

1. Read and validate the existing local blob through the versioned progress contract.
2. Discard invalid entries rather than creating fake scores, stars, attempts, or dates.
3. Send a bounded idempotent batch.
4. Merge with remote progress and retain the local blob until the response succeeds.
5. Cache the returned canonical snapshot locally.

Legacy migration preserves:

- completed exercise IDs, with null completion times when history does not provide one;
- mission best results, stars, attempts, and real timestamps;
- available recent scored sessions only;
- existing accuracy, session counts, and per-skill score totals as legitimate legacy
  aggregates, without pretending they can be rebuilt from the bounded 20-session history.

It excludes local name/detail strings, subscription, notifications, UI preferences,
audio, transcripts, blobs, voice state, and ATC session descriptors.

If sync fails, training continues locally. Signing out never deletes local progress. A
shared browser must never silently import an anonymous blob into a different account;
that ownership decision requires explicit product UX. The Profile screen presents the
choice to import the local blob or start the account from zero.

## Content IDs and versioning

`ready-for-radio` is persisted as the canonical level ID. Incoming `rfr` is translated
before validation and new clients never write it.

Persisted exercise and mission IDs are immutable. Title, ordering, translation, and copy
changes must not change IDs. New content receives new IDs. `content_version` is an
explicit catalog release identifier, for example `2026.07`, and the server-side catalog
map defines valid IDs, canonical levels, aliases, and deprecations for every supported
version. Unknown IDs or versions are rejected; their meaning is never inferred from a
title-derived string.

Snapshots aggregate compatible historic content versions so a catalog release does not
hide previously persisted progress.

## Streak policy

The streak is a cache derived from accepted session facts.

- `activity_date` is calculated from `occurred_at` using the supplied IANA timezone.
- Multiple activities on one date count once.
- Consecutive activity dates extend the streak; a gap starts a new streak at one.
- Future timezone changes affect only future activities; historical activity dates remain
  immutable.
- A legitimate legacy `streakDays` value is retained as the first-import baseline; later
  streaks are derived from accepted activity dates.

## Session policy and future compatibility

Persist only real completed learning activity: stable client session ID, exercise or
mission identity, genuine score/stars, source, level, duration, timestamp, and content
version. Never persist raw speech, transcripts, recording data, temporary choices,
retries, or arbitrary metadata.

This supports later recommendations, adaptive learning, and progress analytics through
validated learning facts. It does not require transcripts by default.

Future Pro and Stripe work stays separate: entitlement checks must use a dedicated
product/entitlement model, never `aerocomms_progress` or local `subscription`.

## Remaining operational decisions

1. Session retention, export, and deletion policy.
2. Backoff timing after repeated unavailable responses.
3. Supported score sources in future versions; no synthetic score may be generated.

## Explicit exclusions

- No account requirement for AeroComms Free.
- No Free unlock or content change.
- No Stripe, checkout, purchase, entitlement, or Pro implementation.
- No remote transcript, audio, recording, STT payload, or AI prompt persistence.
- No local subscription migration into access rights.
- No lead creation, CRM integration, or Warhome expansion.
