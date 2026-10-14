# P2-08 PLAN — history detail, edit, delete, repeat, save as routine (personal slice)

## 1. Today (owner phone + source)
- `renderHistory` (`index.html:3219`) renders one non-clickable card per
  `state.history` entry: title, date, `durationSec`, `totalVolume` (via
  `toDisplayVolume`), `totalSets`, best set per exercise + `isPR` badge, note.
- `doFinishSave` (`:2634`) `unshift`s newest-first:
  `{id:'wk_'+Date.now(), title, routineId, date, durationSec, totalVolume,
  totalSets, prCount, exercises:[{exId, note, sets:[{type,weight(kg),reps,done}],
  isPR}]}`; volume `w*r` clamped `>=0`; only valid ticked sets saved (P2-02).
- All derived views recompute live from `state.history`: `getBest1RM` (`:2754`),
  `getBestSet` (`:3150`), `getExerciseHistory` (`:3165`) + `renderExerciseDetail`
  (`:3183`), `findPreviousExercise`/`getPreviousSet` (`:1849/:1869`),
  `renderProfileStats` totals + 6-bucket muscle chart (`:3263`).
- Routine start `startRoutineWorkout`/`doStartRoutineWorkout` (`:2057/:2067`)
  is P0-02-blocked (`pendingStartFn` + resume modal); `saveRoutine` (`:1754`) +
  `normalizeRoutineItem` (`:1537`) own the routine shape; `deleteRoutine` /
  `undoDeleteRoutine` / `expireDeletedRoutine` (`:1569/:1585/:1595`) own the
  confirm + 10s in-memory Undo pattern to copy.

## 2. Design
- Detail: tap card -> modal/sheet (existing modal pattern, reuse `esc()`):
  date + start time, duration, total volume (current unit via `toDisplay*`),
  every exercise with every set (type badge W/N/D/F, weight, reps), notes.
  Buttons: Edit, Delete, Start this workout again, Save as routine, Close.
- Edit: in-memory `editingHistoryId` + deep-copy draft; fields title, date/time,
  duration; add/remove/edit sets + add/remove exercises (existing picker);
  set type via `normSetType`; validation identical to live logger
  (`getWeightErrorKg`/`getRepsError`/`isSetTickable`, P2-02). Save recomputes
  `totalVolume`/`totalSets`/`prCount`/`isPR` via a shared helper extracted from
  `doFinishSave`; Cancel discards. Nothing else is stored: best set, est 1RM,
  previous values, volume, Profile charts, exercise-detail last-5 all re-render
  from history, so they reflect the edit with no extra recalculation step.
- Delete: `confirm()` + 10s Undo banner like routines (in-memory
  `{workout, index, expiresAt}`; reload drops it, same as routines); then
  `renderHistory` + `renderProfileStats`.
- Repeat: `startHistoryWorkout(id)` builds `activeWorkout` exactly like
  `doStartRoutineWorkout` (same exercises, set count, `restSec`, note; sets
  prefilled from previous values, unticked) and goes through the same P0-02
  resume block. Routine link is not carried (`routineId: null`).
- Save as routine: new `rt_Date.now()` routine named
  `"<title> (from history)"`; items via `normalizeRoutineItem` carrying set
  count + `restSec` + note, targets empty (prefill happens at start); history
  entry untouched.
- List: sort newest-first by `date` (not array order); group by month
  (`YYYY-MM`) with header `Month YYYY (N workouts)`; count per month.

## 3. Data + ids + restore/backup (P0-03)
- No edit-history log; the edited entry is overwritten in place (same `id`).
- New `ensureHistoryIds(history)`: idempotent, no schema bump (P2-06 pattern):
  runs on `init`, after restore-apply, and inside `validateBackupData` on the
  migrated COPY. Only fills missing/blank/duplicate ids
  (`'wk_'+date+'_'+(index)` + counter on collision); existing ids untouched,
  second run is a no-op.
- `validateBackupData` (`:3487`) currently rejects id-less workouts; change to
  backfill on the copy instead, keep rejecting bad dates/empty exercises.
  Per-set weight/reps bounds, unknown-exercise refs, min/max-date summary
  unchanged. Exported backup is just serialized state, so ids persist.

## 4. Tests (`node --test "tests/*.test.mjs"` via `tests/harness.mjs`)
- New `tests/p2_history_ops.test.mjs`: `detail-renders-all-sets-in-current-unit`,
  `edit-set-recomputes-volume-and-profile`, `edit-invalid-set-blocked-p202`,
  `edit-previous-and-records-follow`, `delete-confirm-undo-10s`,
  `delete-expiry-keeps-deletion`, `repeat-prefills-like-routine-start`,
  `repeat-blocked-by-active-draft-p002`, `save-as-routine-default-name`,
  `save-as-routine-leaves-history-untouched`, `list-newest-first-month-groups`,
  `ids-backfilled-idempotently`, `restore-backfills-missing-ids`.
- May be affected: `restore` (id rule relaxes), `migration`, `session`
  (resume-block reuse), `static` (history markup), `harness.mjs` export list.

## 5. NOT doing
- No program library/filters/previews, sharing, new charts, P5 record-policy
  changes, billing/coaching/sync, schema bump, or key renames.

## 6. Questions
- None blocking. Defaults taken: edit allows any date up to now (future
  clamped to now); delete-Undo is in-memory only like routines; repeat never
  inherits `routineId`. Overrule in review if wanted.
