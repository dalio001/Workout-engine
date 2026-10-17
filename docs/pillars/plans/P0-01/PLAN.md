# P0-01 offline plan (written by DeepSeek V4.1 Flash in plan mode, saved by the supervisor 2026-10-17)


## 1. What exists today (audit)

- **Network surface is 100% local.** No CDN, no `@font-face`, no Google Fonts — CSS uses only the system stack (`index.html:36`). External-looking hits are SVG `xmlns` namespaces (`:3844`, `:3878`) only.
- **Assets the page loads:** `./manifest.webmanifest` (`:10`), `./icons/apple-touch-icon.png` (`:11`), `./icons/favicon-48.png` (`:12`), `./icons/mascot-96.png` (`:555` logo + onerror fallback `:5890`,`:5948`), `./assets/brand/plz-fitzone-mascot.jpg` (onboarding mascot, `:5890`,`:5948`, **NOT precached**). `assets/brand/plz-fitzone-logo-wide.jpg` is unreferenced — leave it out.
- **SW (`sw.js`)**: `CACHE_VERSION='plz-fitzone-v2'`; `CORE_ASSETS` has `./`, `./index.html`, manifest + 6 icons; install `addAll`+`skipWaiting`; activate deletes other caches + `claim`.
- **Page requests**: NETWORK-FIRST, plain `fetch` with cache fallback (`sw.js:54-69`) — **no timeout**, so a weak gym signal can hang → white screen. **Static assets**: cache-first + cache-on-miss.
- **Update check** (`index.html:6536-6562`): `showUpdateBar()` button; `checkForUpdate()` guards `fetch`/`location.protocol==='http'`, HEADs `./index.html`, compares ETag/Last-Modified, `.catch()` swallows errors; runs at load and on `visibilitychange`.
- **Storage**: `saveState()` writes `hevy_clone_state` (`:1960`); draft `hevy_clone_active_session` (`ACTIVE_SESSION_KEY`, `:1719`); `hevy_clone_state_backup_v1` (`:1560`); `hevy_clone_state_before_restore` (`:6103`). `exportData()`/`importData()` JSON (`:6479`,`:6487`). **No `navigator.storage.persist()`** anywhere.
- **Tests**: `tests/harness.mjs` runs the real script in `node:vm` (`navigator: {}`, `window.addEventListener` no-op, no `location`/`fetch`). `tests/static.test.mjs` parses `index.html`+`sw.js`, validates manifest icons, restore wiring. Suite = **171 pass / 0 fail** (verified).

## 2. Changes

**`sw.js`** — bump `CACHE_VERSION` to `'plz-fitzone-v3'`; add `./assets/brand/plz-fitzone-mascot.jpg` to `CORE_ASSETS` (keeps the offline onboarding mascot identical); add `NETWORK_TIMEOUT_MS = 3000` + `fetchWithTimeout(request,ms)` using `AbortController`+`setTimeout` (SW `timeout` is `Promise.race`-style, timer cleared on settle); page branch uses `fetchWithTimeout` then existing cache-fallback `caches.match('./index.html')`→`'./'`; keep cache-first static branch.

**`index.html`** — static `<div id="offlinePill" style="display:none;…">Offline — your workouts are saved on this phone</div>` (own fixed pill, ≤412 px, `pointer-events:none`, no blocker); `updateOfflinePill()` reads `navigator.onLine===false` (undefined ⇒ hidden); wired to `window.addEventListener('online'|'offline')` + one call, all inside `try/catch`. Add `requestPersistentStorage()` calling `navigator.storage.persist().catch(()=>{})` guarded by `navigator.storage && typeof navigator.storage.persist==='function'`, called once after `init()`. No change to `checkForUpdate` logic (already offline-safe); no change to `saveState`, keys, schema, or restore.

**Docs** — new `docs/architecture/P0-01_DECISION_RECORD.md` (<60 lines): target Pixel 8 / Android Chrome installed PWA; keep single-file web app (no backend/native); domain contracts (schemaVersion 2, stable session/exercise/set ids, canonical kg); storage (localStorage keys above + persist() best-effort + JSON export/import); migration/rollback (P0-03 v1→v2, preserved backup, restore undo); offline strategy (SW v3, 3 s timeout, precache-all, pill, system fonts); update strategy (network-first page + ETag bar, online only); triggers for future backend/native (multi-device sync, accounts/public, server backups, iOS quota, health/watch, media storage), all otherwise optional. Then flip P0-01 `[x]`-ready note + `Next Immediate Action` in `00_CORE_ARCHITECTURE.md`, add `PROGRESS_LOG.md` entry, write `CHECKPOINT.md`.

## 3. Tests (exact names)

`tests/offline.test.mjs` (new) via extended `harness.mjs` options (`options.navigator`, `options.listeners`/`app.fire`, `options.location`, `options.fetch`; all optional, defaults keep today's behavior):
- `offline pill shows when navigator.onLine is false and hides when true`
- `online and offline window events toggle the pill`
- `persist() rejection is ignored and nothing scary is shown`
- `update check does nothing offline when fetch rejects (no updateBar, no throw)`
- `update check shows the bar when the ETag changes while online`

`tests/static.test.mjs` (added):
- `sw.js CACHE_VERSION is bumped to v3`
- `sw.js precaches every local asset referenced by index.html`
- `sw.js page fetch uses a network timeout before cache fallback`
- `index.html includes the offline pill markup`

## 4. Existing tests possibly affected

- `sw.js parses` / manifest checks — unaffected; the new precache assertion is the only new coupling, and the jpg exists.
- Harness change is additive (no `options` ⇒ today's stubs); no test uses `document.body` or global element counts, so the static pill and `window.addEventListener` recording are inert for the 171.
- `persist()`/`online` handlers only run inside `try/catch` + guarded feature checks, so no existing path can throw.

## 5. What I will NOT do

No backend, accounts, cloud sync, native app, new dependencies, build step, schema bump, storage-key rename, or changes to save/restore/units semantics. Only `sw.js`, `index.html`, the decision record, pillar/progress/checkpoint docs, and tests.

## 6. Questions

None blocking.


## Supervisor additions (2026-10-17, from the emulator offline test)
- Verified today on Pixel 8 emulator in airplane mode: installed app cold-starts offline, a routine can be started and sets ticked offline, and after a force-close the 'Unfinished workout found' prompt appears.
- FOUND: a tick made a few seconds before Android kills the app can be lost (draft was written to localStorage but not yet flushed to disk; a tick 10 s before the kill survived). FIX in this job: mirror the active-session draft into IndexedDB (one object store, one key, durability 'strict' when supported) on every saveActiveSession, with savedAt; on start, resume whichever of localStorage/IndexedDB has the newer savedAt; clear both on finish/discard. Also flush on 'pagehide' and 'visibilitychange' hidden. Fail silently when IndexedDB is missing (tests/harness).
- Tests to add: draft-mirror-written-on-save, resume-picks-newer-of-two-copies, finish-and-discard-clear-both, missing-indexeddb-is-ignored.
