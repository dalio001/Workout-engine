# P2-05 PLAN — set actions, workout notes, plate calculator + input-focus fix

## 1. Today's behaviour (function names)
- `renderActiveWorkout` (`index.html:1771`) rebuilds `activeExercisesContainer.innerHTML` on every change; `updateSetVal` (`:1844`) calls it on every keystroke, so the focused KG/REPS box (`oninput`, `:1808-1809`) is destroyed after one digit (confirmed V4 recording).
- `setFieldError/clearSetError` (`:1553/:1559`) only write `setInputErrors`; visible only after full re-render. `toggleSetDone` (`:1896`), `cycleSetType` (`:1835`), `addSetToActive` (`:1925`), `removeActiveEx` (`:1933`) all full re-render (correct for structural changes).
- No single-set delete; no workout reorder/replace; workout note shown (`:1821`) but not editable in workout and dropped by `doFinishSave` (`:2048`, saves only `exId+sets`); builder note uses `onchange` (`:1300`, safe).
- `calculatePlates` (`:2346`): fixed bar 20kg/45lb, fixed plates, no remainder, no settings; `plateTargetInput oninput` (`:591`) only rewrites `plateResult` (safe).
- Other `oninput`: `exSearchInput→renderExercisesTab`, `pickerSearch→renderPickerList` (both rewrite only the result list, search box survives — safe); `activeWorkoutTitle→onWorkoutTitleInput` (`:1063`, model+`saveActiveSession` only — safe). Builder sets/reps/weight/note use `onchange` (`:1293-1300`, safe).

## 2. Design
- **BUG1 fix:** split `updateSetVal` into `saveSetField` (model + `setFieldError/clearSetError` + `saveActiveSession` every keystroke, P0-02) and `paintSetRowError` (toggles that row's `.invalid` + `.set-error` text in place, no `innerHTML` rebuild). Full `renderActiveWorkout` only on structural events (add/remove/reorder/replace/type/tick/unit/prev-copy) or `change`/blur normalisation (e.g. `22.5`, display rounding via `formatDisplayWeight`). Never rewrite the focused input's `value` mid-typing.
- **Remove set:** `removeActiveSet(exIdx,sIdx)` + in-memory `deletedSetBackup` + 5s Undo banner (`undoRemoveSet`, `expireDeletedSet`); shift `setInputErrors` keys; labels auto-renumber (`normalCounter`); `saveActiveSession`. P2-07 lane matching (`getSetLaneIndex`) keeps working (fewer same-type lanes).
- **Reorder/replace:** `moveActiveEx(exIdx,±1)` thumb buttons (min-height 44px, reuse builder pattern); `replaceActiveEx(exIdx,newExId,keepValues=false)` keeps set count, resets types to N, empty values by default, clears note, keeps `restSec`. Picker reuse via `pickerTarget='replace'`.
- **Workout note:** `updateActiveNote(exIdx,val)` (`onchange`, no re-render; ≤140ch) persisted in draft and copied into history by `doFinishSave`; rendered in history detail.
- **Plate calc:** `state.plateSettings={barKg:20,barLb:45,platesKg:[25,20,15,10,5,2.5,1.25],platesLb:[45,35,25,10,5,2.5]}` editable in Profile; `calculatePlates(target,unit)` greedy largest-first per side in canonical kg, displays per-side plates + loadable total + remainder (`target-loadable`, never round up; "exact" vs "closest below"); entry button per exercise prefills that set's weight.

## 3. Data changes & back-compat
- Add `exercises[].note` (string, default `''`) in draft + history; add `state.plateSettings` with defaults. Migration fills missing fields only, never rewrites existing weights/history/drafts; old drafts without `note`/settings load with defaults. No schema-version bump beyond existing P0 path.

## 4. New tests (`node --test "tests/*.test.mjs"` via `tests/harness.mjs`)
- `multidigit-keeps-same-element-and-saves-10` (type "1" then "0" in same box: same element focused, draft weight 10).
- `decimal-22-5-keeps-focus-and-saves`.
- `invalid-shows-row-error-without-rerendering-focused-box`.
- `reload-after-keystrokes-restores-draft`.
- `remove-set-renumbers-and-undo-restores-5s`.
- `removed-set-previous-lanes-still-match` (P2-07).
- `move-exercise-up-down-keeps-sets-and-draft`.
- `replace-default-empties-keep-values-option`.
- `workout-note-saved-to-history-and-reload`.
- `plates-exact-per-side-kg-and-lb`.
- `plates-remainder-never-pretends`.
- `plates-custom-bar-and-inventory`.

## 5. Possibly affected
- `p2_logger_core` (updateSetVal/render asserts), `p2_previous` (lane/prefill), `session` (draft shape), `units` (display), `static` (if plate markup asserted); extend `harness.mjs` exports (new helpers).

## 6. NOT doing
- Supersets/circuits, RPE/RIR, catalogue P2-06, charts/records, program/coaching/billing/sync, builder `onchange→oninput` changes, CSS redesign.

## 7. Questions
- None — defaults above apply (replace defaults to empty sets; collars ignored; plates equal per side). Correct during review if unwanted.
