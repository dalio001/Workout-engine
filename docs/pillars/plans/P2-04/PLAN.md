# P2-04 — Routine editor plan (personal use)

## 1. What exists today
- `renderRoutines`: card per routine (`{id,name,exercises:[{exId,sets,restSec?}]}`), Start + delete-✕ only.
- `openRoutineBuilder` / `renderRoutineBuilderList` / `saveRoutine`: always new (`rt_"+Date.now()`), name + sets count only; no edit.
- `deleteRoutine`: `confirm()` then immediate remove, no undo.
- `startRoutineWorkout` / `doStartRoutineWorkout`: expands `item.sets` into N empty sets, inherits `item.restSec` else Profile default (P2-03).
- Seeds: `DEFAULT_ROUTINES` entries are `{exId, sets:3}` with no targets/notes.

## 2. Design (reuse builder modal + P2-03 rest chip)
- Edit: "Edit" button per card opens builder with `editingRoutineId` set; rename field, per-exercise rows: sets stepper, target reps (`8` or range `8-12`), optional target weight, rest chip (reuse `REST_OPTIONS`: Off,0:30–5:00), short note (≤140ch), remove-✕; up/down thumb buttons (min 44px) to reorder; add-exercise picker unchanged.
- Duplicate: "Duplicate" per card clones with new id, name `"Push (copy)"` (increment `(copy 2)` if clash), inserted after source.
- Delete: `confirm()` stays, then banner "Routine deleted — Undo (10s)"; Undo restores at same index; expiry drops snapshot.
- Reorder routines on Workout tab: same up/down thumb buttons on cards, persisted order.
- Optional update-from-workout: after finishing a workout with `routineId`, modal offers "Update routine from this workout?" (Yes/No). Default No. Yes writes back sets count/targets/rest only.

## 3. Data + compatibility
- New per-exercise fields: `targetRepsMin, targetRepsMax (nullable ints 1–1000, min≤max)`, `targetWeightKg (nullable finite 0–1000)`, `restSec (existing, default Profile)`, `note (string, default "")`.
- No migration: normalize on load/edit (`normalizeRoutineItem()` fills defaults); old routines render/start unchanged. `SCHEMA_VERSION` unchanged.
- History immutable: `doFinishSave` snapshots performed values; editing a routine never touches `state.history`.

## 4. Workout uses new fields
- `doStartRoutineWorkout`: N sets from `sets`; reps box placeholder = `"8"` or `"8-12"`; weight prefilled from `targetWeightKg` (display unit via `toDisplayWeight`); note shown under exercise name; `restSec` carried as today.
- Actual logged sets still validate per P2-02; targets are hints, never auto-tick.

## 5. Tests (`node --test "tests/*.test.mjs"`, via `tests/harness.mjs`)
- New `tests/p2_routine_editor.test.mjs`: `edit-rename-keeps-id-and-history`, `edit-targets-note-rest-roundtrip`, `reorder-exercises-up-down`, `reorder-routines-persists`, `duplicate-names-copy-and-clones-targets`, `delete-undo-within-10s-restores-index`, `delete-expiry-purges`, `legacy-routine-defaults-apply`, `start-prefills-targets-and-note`, `update-from-workout-no-means-unchanged`, `update-from-workout-yes-writes-back`.
- Affected: `p2_logger_core.test.mjs` (rest write-back, seed `restSec` assumptions), `restore/session/units.test.mjs` (routine shape fixtures) — add optional fields to fixtures, keep assertions green.

## 6. Will NOT do
- No folders/programs, no catalogue changes (P2-06), no supersets/circuits or RPE/RIR (P2-05), no charts/records (P5), no cloud/sync.

## 7. Question for owner
- Undo window: default 10s — keep, or 30s? Default: keep 10s, no setting.
