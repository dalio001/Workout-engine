# Progress log

Newest first. Product direction: [MASTER_PLAN.md](MASTER_PLAN.md). Governance: [../AGENTS.md](../AGENTS.md).

## 2026-10-14 — Canonical-kg unit fix implemented, awaiting owner phone check

- Fixed the KG/LBS relabel bug in `index.html` on branch `codex/units-preserve-load`: every weight is stored in kilograms; the toggle only changes display (`toDisplayWeight`: kg ≤2 decimals, lb ≤1 decimal) and input reading (`fromInputWeight`: LBS typed values divided by 2.20462, KG saved as is). 100 kg now shows 220.5 lb; typing 225 lb stores 102.06 kg; toggling never rewrites stored kg.
- Routed all weight uses through the same helpers: active inputs, PREVIOUS column, history volume/best set, exercise est. 1RM, profile stats, PR detection (all computed in kg) and plate calculator (bar 20 kg / 45 lb, target normalized via helpers).
- One-time versioned migration to `state.schemaVersion = 2`: untouched old state backed up to `hevy_clone_state_backup_v1` (never overwritten); legacy weights interpreted in the saved `state.unit` (default KG); live draft migrated the same way; keys unchanged; export includes `schemaVersion`, old imports migrate identically.
- Checks: extracted `<script>` → `node --check` passed with no output; new `tools/units-check.mjs` (no dependencies) passes all 19 assertions (100→220.5, 225lb→102.06kg, 10 toggles identical, LBS/KG/default-unit migration, backup create/keep); `git diff --stat` shows `index.html` + 2 pillar docs plus new `tools/units-check.mjs`. No browser run here (supervisor tests on phone); P6-01 unit part stays `[ ] in progress, awaiting owner phone check`, canonical-kg decision recorded in Pillar 0.

## 2026-10-14 — Renamed to PLZ FitZone and made installable, awaiting owner phone check

- Renamed every visible product name in `index.html` (`<title>`, two-tone header logo now `PLZ` blue + `FitZone` white, backup prefix `PLZ_FitZone_Backup_...`, `HEVY STYLE` comment) and `README.md` title/first line. localStorage keys `hevy_clone_state` / `hevy_clone_active_session` intentionally unchanged (code comment explains renaming would delete saved workouts).
- Installability: `tools/make_icons.py` (Python + Pillow, original navy/FZ/blue-accent mark) generated `icons/` (192, 512, maskable-512 with central-80% safe zone, apple-touch 180); `manifest.webmanifest` (name PLZ FitZone, short FitZone, standalone, `#0f172a`); `sw.js` (NETWORK-FIRST page with cache fallback, versioned cache, old caches deleted on activate); head links (`manifest`, `theme-color`, `apple-touch-icon`, `apple-mobile-web-app-title`) and silent-fail SW registration. No workout logic changed.
- Checks: extracted `<script>` → `node --check` exit 0; `node --check sw.js` exit 0; manifest JSON loads; Pillow sizes 192/512/512/180; `grep -n -i hevy index.html README.md` shows only the two storage keys and their comments; `git diff --stat` shows only `index.html` + `README.md` modified plus new `icons/`, `manifest.webmanifest`, `sw.js`, `tools/make_icons.py`.
- Noted in owning pillars as `[ ] in progress, awaiting owner phone check` (Pillar 1 identity, Pillar 0 delivery).

## 2026-10-14 — P0-02 live-session recovery implemented, awaiting owner device check

- Implemented P0-02 exactly as `docs/pillars/plans/P0-02/PLAN.md` in `index.html` only: live workout persisted to `hevy_clone_active_session` on every change (start, set edit, tick, add/remove set or exercise, set type, title edit, rest start/stop/adjust); rest stored as end-timestamp `restDeadline`.
- Added Resume/Discard modal reusing `.modal` style on page load and for start-new conflicts (Resume current / Discard and start new); Discard removes the draft with no further prompt and no history entry. Finish and Discard both clear the draft; double-Finish guarded by a `finishing` flag so exactly one history entry is created. Storage-save failure shows a visible `#draftSaveWarning` banner in the workout drawer. `hevy_clone_state` key and history format unchanged.
- Checks: `node --check` on extracted `<script>` passed with no output; `git diff --stat` shows only `index.html` and docs. No browser run here (supervisor tests on device); P0-02 stays `[ ] in progress`, not `[x]`.

## 2026-10-14 — Feature-level video handoff and second review

- Watched V2 through full captions and 48 overview frames, then inspected 44 focused timestamps; checked 20 additional V1 timestamps, including the resume/replace prompt. Recorded source metadata and feature-level scene links in the video index.
- Added per-task/sub-feature references across all eight pillars, with direct timestamp links, ranges, inspection notes and explicit limits for settings, narrated features and behavior not demonstrated. Updated AGENTS.md and workflow so the next agent reads only the relevant clips first.
- Added six focused unimplemented tasks within existing pillars: previous-value scope, inline timers/superset advancement, personal custom demos, keep-awake, separate sounds and optional strength comparison. Personal-first order 0 → 2 → 1 → 5 remains; public/community/billing/growth scope stays deferred.
- Verified 76 task rows against 76 reference sections, local links/table columns and 195 timestamp URLs/ranges; documentation checks passed and no app/README diff was present.
- Prepared the user-authorized documentation merge; no app source/README changes, new dependencies, implemented features or redistributed video media.

## 2026-10-14 — Explicit owner preferences in the agent contract

- Added a durable AGENTS.md preference section: personal use first; default next-task order 0 → 2 → 1 → 5; basic protections/settings from 4/6; community, coaching, billing and public growth deferred.
- Recorded that the owner's latest direction can change these defaults, including a future public release, with matching updates to governance and the master plan. Documentation changes do not authorize app implementation.
- Synchronized Pillar 0's governance record and prepared the user-authorized GitHub merge. Application code and README remain unchanged.

## 2026-10-14 — Personal-use priorities and authorized GitHub integration

- Updated the active roadmap to prioritize personal use: pillars 0/2/1/5, with minimum trust and settings from 4/6. Community/coaching, public growth, billing and unnecessary accounts/sync are deferred; the larger public vision is retained as optional reference.
- Prepared the documentation for a user-authorized branch, commit, push and pull-request merge into GitHub `main`. Publishing documents does not authorize feature implementation. Final publication status is recorded on the associated GitHub pull request.
- Revalidated documentation references and preserved the application source/README; no app features changed.

## 2026-10-14 — Repository audit, Hevy research, roadmap and pillars

- Inspected the complete 1,262-line single-file prototype and README on `main`; the initial working tree was clean. No manifests, lint rules, automated tests, or build tooling exist.
- Watched the supplied 4:35 review through native captions and 32 chronological video frames. Recorded timestamped findings and verified current Hevy features against its official pages; the review was uploaded on 2024-12-04.
- Exercised a routine, set logging, rest display, unit changes, workout completion, previous values, saved history, and reload in an isolated browser context. Confirmed active-session loss on reload and unit relabeling without numeric conversion. This was a local audit, not a production acceptance run.
- An optional browser-storage overwrite test was rejected by automatic approval review and was not executed. Empty-library reseeding and import risks are documented from source inspection instead.
- Created eight tailored pillar files, a master plan, audit/reference report, workflow, shared AGENTS.md, and four IDE pointers. All future application work remains unchecked and explicitly gated.
- Verified all local Markdown links, code fences, required pillar sections and 70 future task IDs; no unresolved scaffold placeholders. Confirmed no diff to `index.html` or `README.md`.
- Application source and the existing README were preserved. No dependencies installed, features implemented, services provisioned, commits created, or deployment performed.
