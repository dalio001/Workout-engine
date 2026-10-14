# Pillar 0 — Core architecture and durable data

> **Role:** Keep every workout accurate, recoverable and available on the user's chosen devices. Own architecture contracts, persistence, migration, identity, sync and engineering delivery.
>
> **Depends on:** Pillar 4 input/privacy policy; your device/workflow needs. Pillar 7 research applies only to future public expansion.
> **Used by:** Pillars 1–6; Pillar 7 measurement and release operations.
> **Cross-pillar impacts:** Unit schema, session lifecycle, exercise snapshots, account permissions, media access, metrics and entitlements.

Phase order and gates: [../MASTER_PLAN.md](../MASTER_PLAN.md). Current evidence: [../research/HEVY_AUDIT.md](../research/HEVY_AUDIT.md).

**Current mode — personal use:** prioritize P0-01/02/03 and focused checks from P0-06. Keep the existing web app as the default route. Accounts, backend, cloud sync, media infrastructure and public release operations are deferred unless your own needs justify them. Public phase letters below are future reference.

## Trigger keywords

`Pillar 0`, architecture, storage, database, migration, offline, auth, sync, API, CI.

## Scope

- Separate domain rules, persistence, synchronization, presentation and platform adapters when implementation is authorized.
- Own versioned exercise/routine/session/set contracts, local drafts and portable backups.
- Own identity, guest-to-account migration, conflict detection and relational access boundaries.
- Own observability, release delivery, incident recovery and executable quality gates.
- Keep personal workout data separate from public workout publications; pillar 3 owns social behavior.

## UI components used from Pillar 1

Recovery/resume prompt, save/sync indicator, import preview, conflict-resolution sheet, account sign-in and storage-error states. UI must tell the truth about local durability separately from cloud sync.

## What is built and verified `[x]`

- [x] **Source inspected:** `init()`/`saveState()` serialize global state under `hevy_clone_state` in browser localStorage (`index.html:635`, `:653`). There is no schema version or backend.
- [x] **Runtime checked:** Completed history survives reload in an isolated context; unfinished session does not.
- [x] **Source inspected:** JSON export/import exists; import replaces state before validation and has no preview or transactional rollback.
- [x] **Environment audited:** `main`; no package manifest, linter, test runner, build step or CI. This does not establish production readiness.
- [x] **Documentation updated:** Personal-first priorities and publication checks prepared for the user-authorized GitHub integration; app source preserved.
- [x] **Agent preferences recorded:** AGENTS.md explicitly sets the default pillar order to 0 → 2 → 1 → 5, supporting basics from 4/6, and allows the user's later direction to activate public-product scope.

## What is left to do `[ ]`

| ID | Priority / phase | Task and dependencies | Acceptance criteria |
| --- | --- | --- | --- |
| P0-01 | P0 / personal first; public A later | Personal architecture decision record; retain/harden the web app by default, compare native only if device needs justify it; consult P1/P4 | Target phone/browser, durable local storage, domain contracts, migration/rollback and offline strategy documented; backend/native/public options explicitly optional; no vendor provisioned merely to decide |
| P0-02 | P0 / B | Durable session journal and recovery; depends on P0-01/P2-02 | Every acknowledged set edit is recoverable after reload/process termination; storage failure is visible; no misleading saved state; original session and rest deadline restored without duplicate sets |
| P0-03 | P0 / B | Versioned legacy migration and validated backup/import; depends on P2-02/P5-01/P4-01 | Preserve original backup; preview counts, mappings, units and errors; invalid file changes nothing; intentional empty arrays remain empty; rollback available; unresolved legacy units explicitly reviewed |
| P0-04 | P1 / C | Optional identity and local-to-account ownership | Guest can train; linking never discards local data; account switch/sign-out isolates private history; duplicate import/linking is safe; recovery and deletion workflows documented with P4/P6 |
| P0-05 | P1 / C | Local mutation queue and cross-device sync; depends on P0-02/03/04 | Stable operation IDs, revisions, retry/backoff, acknowledgements and tombstones; repeated finish produces one session; conflicting live sessions require explicit selection; failures do not block local logging |
| P0-06 | P0 / B–C | Establish engineering tooling and delivery | Actual lint/typecheck/test/build commands recorded in AGENTS.md; CI checks domain fixtures, migration, offline recovery, units, finalization and authorization; staging/rollback and error monitoring defined |
| P0-07 | P1 / C | Historical snapshots and derived-data rebuild | Routine/exercise renames preserve historical meaning; history edits/deletes deterministically rebuild records and charts; policy versions traceable through P5 |
| P0-08 | P2 / D–F | Media/storage operations and scale budget; consult P3/P4/P6 | Private object access, bounded uploads, deletion lifecycle, backup restore drill and operational cost thresholds; realistic load scenario and measured capacity before scale claims |
| P0-09 | P2 / C–F | Web planning client and public integration contracts | Uses the same entity and unit contracts; no independent source of truth; API scopes/rate limits/export rules explicit; web capability gaps documented |

### Proposed core contract

- Stable session/exercise/set IDs and schema versions.
- Canonical load plus original unit/value; duration/distance typed separately.
- Routine prescription versus performed data, ordered exercise instances, set/group identity and historical snapshots.
- Session status (`draft`, `finished`, `discarded`), revision and finalization identity.
- Timestamps stored consistently with timezone context for calendars.
- Sync mutation status and tombstones; no “last write wins” policy that silently loses a live workout.

Legacy data has only a global unit preference. Past mixed-unit entries cannot be restored exactly by assuming that preference applied to every old set. Preserve the raw value, disclose ambiguity, and resolve it through reviewed migration rather than guessing.

### Verification scenarios to specify before implementation

Reload after an edit; terminate/reopen; storage quota/error; multiple tabs; finish double-tap; repeated network delivery; offline sign-in/linking; account switching; device conflict; migrated empty library; malformed file; restore rollback; history correction across timezones. These are planned tests, not tests already passed.

## Video references & Assets

- [Supplied review](https://www.youtube.com/watch?v=8ESngufwx6g): resume bar at roughly 0:15–0:43; save/history at 2:39–3:10.
- [Hevy desktop/watch overview](https://www.hevyapp.com/): reference for cross-device continuity, not an API specification.
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/): candidate durable native storage; sync and notification behavior require separate decisions.
- Audit: [../research/HEVY_AUDIT.md](../research/HEVY_AUDIT.md).

## Next Immediate Action

**Planning only:** draft P0-01 for your current personal app: reliable local drafts, safe backups, unresolved legacy-unit cases and a durable-save contract. Do not require cloud identity or a native rewrite. Implementation waits for a later user request.
