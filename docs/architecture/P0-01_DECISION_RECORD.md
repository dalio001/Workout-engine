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
- Storage is `localStorage` (state + draft) plus **IndexedDB as a write-through mirror**
  of the live draft **and of the main state** (history, routines, profile, plans). No
  server, no cloud sync, no accounts.
- A native rewrite or a backend is **not** justified by today's needs; see triggers below.

## Domain contracts (stable)

- `SCHEMA_VERSION = 2`; weights are canonical **kg** (`1 kg = 2.20462 lb`), display
  preference (`state.unit`) never rewrites stored values.
- Stable ids: session `id`, `exId` per exercise entry, ordered exercise instances and
  ordered sets. History ids are backfilled idempotently (`ensureHistoryIds`).
- Prescription (routine) and performed (history) data stay separate; derived numbers
  (volume, records, 1RM, streaks) are recomputed from history and never stored as truth.

## Storage keys (unchanged, never renamed)

- `hevy_clone_state` — saved state (`schemaVersion` 2). Since this job the state also
  carries a `savedAt` stamp (metadata only; nothing reads it as product data).
- `hevy_clone_active_session` — live draft, JSON with `savedAt` stamp.
- `hevy_clone_state_backup_v1` — untouched pre-migration copy (kept forever).
- `hevy_clone_state_before_restore` — undo snapshot of the last restore.
- **IndexedDB `plz_fitzone_draft` → store `drafts`** — two keys, each written on every
  save with `durability: 'strict'` when the engine supports it:
  - `active_session` — the same draft object;
  - `main_state` — `{ savedAt, json }` where `json` is the **exact string** localStorage
    holds, so adopting it is lossless.
  The mirror exists because a tick (and, worse, a finished workout's history entry) made
  seconds before Android killed the app could be lost with the localStorage write still
  in flight (both verified on the emulator 2026-10-17).
- **Start-up rule (main state):** the mirror is read *before* `init()` renders or saves
  (capped at 500 ms; without IndexedDB start-up stays synchronous). A mirror that is
  newer than localStorage, or any missing/empty/corrupt localStorage copy, is adopted and
  written back to localStorage; a fresh default state can therefore never overwrite a
  newer mirror. Restore/import and "Undo last restore" write both copies.
- **Resume rule (draft):** of the two copies, the one with the newer `savedAt` wins;
  finish and discard clear both; `pagehide` and `visibilitychange` (hidden) flush the
  draft *and* the state into both stores.
- `navigator.storage.persist()` is requested once (best effort, silent on refusal).

## Durability window (explicit trade-off)

- The main-state mirror read is capped at **500 ms**: a hung or blocked database must
  never keep the app closed. If the cap wins, the app starts on localStorage and the
  late mirror answer is ignored — on a healthy device the read takes ~10–50 ms, so this
  is a dead-database path, not a normal one. Mirror writes are also suppressed until
  that read settles (and until `init()` has run), so nothing this build writes can
  overwrite a newer mirror while the app is still starting.
- `saveState()` is now called from `pagehide`/hidden-`visibilitychange` as well, so the
  window between "the value changed" and "a crash" is one event, not one write.

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
- A non-blocking "Offline — your workouts are saved on this phone" strip sits in normal
  flow **under the header** (≤ 36 px high, `pointer-events:none`) and shows only while
  `navigator.onLine === false`; because it is not an overlay it can never cover the
  Continue or bottom-nav buttons.
- Training never needs the network: logging, ticking and finishing are local.

## Update strategy

- Installed app resumes the old page: on load and on `visibilitychange` (visible) the
  page HEADs `./index.html` and compares ETag/Last-Modified; a change shows the
  "New version ready — tap to update" bar. Failures are silent, so it is inert offline.
- Reloading is safe at any point because the live draft and the main state are saved
  (and now mirrored).

## Triggers that would reopen this decision

Multi-device sync; accounts/public beta; server-side backups or coaches; iOS storage
eviction/quotas; Health Connect or watch adapters; workout media storage. Until one of
these is actually required, backend, native, cloud sync and billing stay optional.
