# P2-07/P2-11 PLAN — previous-performance matching

## 1. Today's behaviour (bug)
- `getPreviousSet(exId, setIndex)` (`index.html:1430`) scans `state.history`
  from `[0]` (latest, `unshift` at `:2016`) and returns `sets[setIndex]`
  positionally, ignoring `s.type` (`N/W/D/F` from `cycleSetType`).
- `doStartRoutineWorkout` (`:1612`) prefills each new set from that positional
  hit; `renderActiveWorkout` (`:1681`) shows the same hit as PREVIOUS via
  `formatDisplayWeight`. `selectExercise` (`:2107`) uses index `0` likewise.
- Bug: Push `W:40x10, N:80x8, 80x8, 80x7` reopens as `40x10, 80x8, 80x8`
  on working sets; last `80x7` lost (shift-by-one).

## 2. Matching policy (P2-07)
- Match SAME TYPE in order: `W→W`, `N→N`, `D→D`, `F→F` (legacy sets without
  `type` count as `N`, per P5-01 working-set rule).
- Source: latest finished workout in `state.history` containing `exId`
  (skip current draft; unfinished sets never count).
- Exercise twice in one workout: Nth instance matches Nth instance.
- No history / no same-type hit: display `–`, prefill empty.

## 3. Scope preference (P2-11)
- Profile setting `Previous values from: any workout / same routine only`,
  stored as `state.prevScope` (`any` default); filter candidate workouts by
  `routineId` when `same`. Changing it re-renders only, never rewrites history.

## 4. Prefill and copy
- `doStartRoutineWorkout` (routine prefill): explicit P2-04
  `targetWeightKg/targetReps` wins; else prefill from matched previous set.
- Tapping PREVIOUS text copies that row's weight+reps into the set inputs
  (`updateSetVal` path, validation as today); never ticks `done`.

## 5. Units
- History stays canonical kg; PREVIOUS and prefilled inputs render through
  existing `toDisplayWeight`/`formatDisplayWeight` + `state.unit` (as today);
  `toggleUnit` re-renders with no data rewrite.

## 6. Tests (`node --test "tests/*.test.mjs"`, via `tests/harness.mjs`)
- New `tests/p2_previous.test.mjs`: `same-type-order-skips-warmup`,
  `drop-failure-own-lanes`, `repeated-exercise-instance-match`,
  `missing-history-dash-no-prefill`, `scope-same-routine-only`,
  `scope-change-keeps-history`, `routine-target-wins-over-previous`,
  `tap-previous-copies-without-tick`, `previous-renders-in-lbs`.
- May be affected: `p2_logger_core`, `p2_routine_editor` (prefill asserts),
  `units`, `session` (draft), `harness.mjs` export list (new helpers).

## 7. NOT doing
- No charts, records/1RM changes, volume redefinition, or P5-01/02/03 work;
  no catalogue, program, coaching, billing, or migration changes.
