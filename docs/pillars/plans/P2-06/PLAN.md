# P2-06 PLAN — Personal exercise catalogue (plan only, no code changed)

## 1. Today (seen on phone simulator + source)
- `DEFAULT_EXERCISES`: 15 entries `ex1..ex15`, shape `{id,name,muscle}` only (index.html:711).
- `renderExercisesTab`: name/muscle search, card per exercise + `getBest1RM` est. 1RM; names interpolated raw into `innerHTML` (no escaping).
- `openExercisePicker` / `renderPickerList`: search name/muscle, one row per exercise, `＋` tap.
- `selectExercise`: single add only — workout appends 1 set w/ previous values; routine pushes `normalizeRoutineItem`; replace path (`P2-05`) stays single.
- `openCustomExModal` / `saveCustomExercise`: name + muscle select only, `unshift({id:'ex_'+Date.now(),name,muscle})`; no edit/delete.
- Seeding `applySeedDefaults` (first run only); migration `migrateParsedStateToV2` knows weights/units/plates, nothing about exercise fields.

## 2. Design
- **Catalogue:** ~100 own-written names; `ex1..ex15` keep ids+names. New ids `ex16..ex~100`. Fields: `id,name,equipment,primary,secondary[],type,custom?,fav?`.
  Vocabs — equipment: `Barbell|Dumbbell|Machine|Cable|Bodyweight|Kettlebell|Band|Other`; type: `weight_reps|bodyweight_reps|assisted|duration`; muscles reuse current 6 + `Glutes,Calves` only if needed.
- **Filters:** Exercises tab + picker share `getFilteredExercises(q,muscle,equip)`; muscle chips + equipment chips (single-select each, toggle off), rows show `name + equipment · primary`.
- **Favourites/Recent:** `fav` bool on exercise, star toggle in both lists. `getRecentExerciseIds()` derives last 10 exIds from finished `state.history` (newest first, deduped); picker shows Recent section only when no search/filter active.
- **Multi-select:** picker gets checkbox state `pickerSelected:Set`; footer `Add N` appends in listed order to workout (`pickerTarget==='workout'`) or builder (`'routine'`); `Replace` path keeps single-tap `selectExercise` behaviour.
- **Custom CRUD:** modal gains equipment/primary/secondary/type; `editExercise(id)`, `save` validates non-empty name; `deleteExercise(id)` blocked when id appears in `history` or `routines` — then it hides (`hidden:true`, stays resolvable) and the notice names where used (e.g. "used in 3 workouts, routine Push").
- **Detail sheet:** tap in Exercises tab opens `openExerciseDetail(id)`: muscles, equipment, type, best set + est. 1RM via `getBest1RM`, last 5 sessions (date, best set) — numbers only.
- **Safety:** all custom/built-in names render through new `esc()` (textContent or escape `&<>"'`); picker/detail/tab/custom flows covered.

## 3. Data shape & migration
- New shape: `{id,name,equipment,primary,secondary:[],type,custom:bool,fav:bool,hidden:bool}`. `muscle` dropped after migration (read fallback `primary||muscle`).
- `migrateExercises(state)`: fill defaults (`Other/Chest/[]/weight_reps`, `custom = id startsWith 'ex_'`, `fav=false,hidden=false`); merge built-ins by id, skip id match; skip name match case-insensitive (owner's custom wins, no duplicate); never touch `history`/`routines` refs. Bump `SCHEMA_VERSION` 2→3, reuse `backupV1Once` pattern.
- **Small file:** store as compact rows `["ex16","Goblet Squat","Dumbbell","Legs",["Glutes"],"weight_reps"]` + `expandExercises()` at load; ~100 rows ≈ 8–10 KB, one const.

## 4. Tests (new `tests/p2_catalogue.test.mjs`, via `tests/harness.mjs`, `node --test "tests/*.test.mjs"`)
1. `migration fills defaults and keeps ex1..ex15 stable`
2. `migration merges built-ins without duplicating owner name`
3. `filter by muscle+equipment+search returns equipment/muscle rows`
4. `recent returns last 10 exIds from history, deduped`
5. `multi-add appends N in order to workout and builder; replace stays single`
6. `delete used exercise hides with usage message; unused deletes`
7. `custom names render escaped in tab, picker and detail`
- Existing risk: `static.test.mjs` (script count/size), `migration.test.mjs` + `restore.test.mjs` (SCHEMA_VERSION bump, seed expectations) — update fixtures, keep green.

## 5. NOT doing
No images/video demos, no charts (P2-13 media stays out), no public-catalogue review/rights work, no substitution engine (P2-09), no program library (P2-08), no record-policy changes (P5).

## 6. Decisions (defaults picked; one real question)
- Defaults: single-select chips; Recent hidden during search; delete→hide with reason; `duration` logs seconds-only sets.
- Q: cap custom secondary muscles at 2? Default yes unless owner objects.
