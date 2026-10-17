# P0-01 — Personal architecture decision record (offline first)

- **Date:** 2026-10-17. **Status:** implemented in `index.html` + `sw.js` on branch
  `codex/p0-01-offline`, `[ ] in progress` until the owner checks it on the phone.
- **Scope:** personal use on one phone. Nothing here provisions a vendor, account,
  backend or native build.

## Target platform

- **Primary:** Pixel 8, Android Chrome, installed as a PWA (standalone, `viewport-fit=cover`).
- **Design width:** 412 px; every overlay/pill is capped at 412 px and text uses the
  system font stack, so there is no font download and no CDN dependency at all.
- **Secondary:** any desktop browser on the same committed `index.html`; `file://`
  stays usable (service worker and IndexedDB failures are swallowed).

## Choice kept: one self-contained web app

- One `index.html` (markup, CSS, one `<script>`), `sw.js`, `manifest.webmanifest`,
  `icons/`, `assets/brand/`. No build step, no package manager, no framework.
- Storage is `localStorage` (state + draft) plus **IndexedDB as a mirror** of the live
  draft only. No server, no cloud sync, no accounts.
- A native rewrite or a backend is **not** justified by today's needs; see triggers below.

## Domain contracts (stable)

- `SCHEMA_VERSION = 2`; weights are canonical **kg** (`1 kg = 2.20462 lb`), display
  preference (`state.unit`) never rewrites stored values.
- Stable ids: session `id`, `exId` per exercise entry, ordered exercise instances and
  ordered sets. History ids are backfilled idempotently (`ensureHistoryIds`).
- Prescription (routine) and performed (history) data stay separate; derived numbers
  (volume, records, 1RM, streaks) are recomputed from history and never stored as truth.

## Storage keys (unchanged, never renamed)

- `hevy_clone_state` — saved state (`schemaVersion` 2).
- `hevy_clone_active_session` — live draft, JSON with `savedAt` stamp.
- `hevy_clone_state_backup_v1` — untouched pre-migration copy (kept forever).
- `hevy_clone_state_before_restore` — undo snapshot of the last restore.
- **IndexedDB `plz_fitzone_draft` → store `drafts` → key `active_session`** — the same
  draft object, written on every save with `durability: 'strict'` when the engine
  supports it. It exists because a tick made seconds before Android killed the app
  could be lost with the localStorage write still in flight (verified on device).
- Resume rule: of the two copies, the one with the newer `savedAt` wins; finish and
  discard clear both; `pagehide` and `visibilitychange` (hidden) flush both.
- `navigator.storage.persist()` is requested once (best effort, silent on refusal).

## Migration and rollback

- v1 → v2 runs once (`migrateParsedStateToV2`), keyed on `schemaVersion`, after copying
  the original string to `hevy_clone_state_backup_v1`; a v1 draft is migrated with the
  saved unit and re-stamped. Invalid/legacy drafts are dropped, never guessed.
- Imports/restores are validated on a copy first; the pre-restore state is snapshotted
  and "Undo last restore" restores those exact bytes. Schema changes require a
  versioned migration + old-data fixtures (AGENTS.md rule); this job added none.

## Offline strategy (what changed here)

- `sw.js` v3: precache `./`, `./index.html`, manifest, all icons and the onboarding
  mascot `./assets/brand/plz-fitzone-mascot.jpg`; cache-first for static assets.
- Page requests are **network-first with a 3 s `AbortController` timeout**, then the
  cached page — a weak gym signal can no longer hang the app on a white screen.
- A fixed, non-blocking "Offline — your workouts are saved on this phone" pill appears
  only while `navigator.onLine === false`.
- Training never needs the network: logging, ticking and finishing are local.

## Update strategy

- Installed app resumes the old page: on load and on `visibilitychange` (visible) the
  page HEADs `./index.html` and compares ETag/Last-Modified; a change shows the
  "New version ready — tap to update" bar. Failures are silent, so it is inert offline.
- Reloading is safe at any point because the live draft is saved (and now mirrored).

## Triggers that would reopen this decision

Multi-device sync; accounts/public beta; server-side backups or coaches; iOS storage
eviction/quotas; Health Connect or watch adapters; workout media storage. Until one of
these is actually required, backend, native, cloud sync and billing stay optional.
