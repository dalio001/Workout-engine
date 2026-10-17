# P5-01 + P5-02 PLAN — metric dictionary and exercise progress page (personal slice)

Plan only: `index.html` and `tests/` are NOT touched in this run. Line numbers are today's `index.html`.

## 1. Today (source inspection)
- Canonical storage is kg; `toDisplayWeight` (`:1256`) / `toDisplayVolume` (`:1280`) convert, `toggleUnit` (`:1669`) re-renders every view. `state.unit` is a label; history sets carry no unit.
- Saved history (`doFinishSave` `:2862`) = `{id,title,routineId,date,durationSec,totalVolume,totalSets,prCount,exercises:[{exId,note,sets:[{type,weight(kg),reps,done:true}],isPR}]}`, newest-first; sets keep `type` (`N/W/D/F`, legacy missing = `N` via `normSetType` `:2034`).
- Records today: `getBest1RM` (`:2973`) uses `w*(1+r/30)` for **every** rep count and every set, warm-ups included; `getBestSet` (`:3386`) scores `weight*reps`; `scoreHistExercises` (`:3578`) writes stored `totalVolume/totalSets/prCount/isPR`; `renderProfileStats` (`:4137`) sums **stored** `w.totalVolume/w.totalSets`; `getExerciseHistory` (`:3401`) shows the last 5 sessions.
- Entry points today: catalogue sheet `openExerciseDetail`/`renderExerciseDetail` (`:3413`/`:3419`, name is static text `:3437`), history sheet `renderHistDetail` (`:3623`, exercise name static `:3650`), live workout `renderActiveWorkout` (`:2375`, `.ex-name` static `:2438`). No charts anywhere (`:29-31` of Pillar 5). Modals: `.modal` z-index 200 (`:331`), `.modal-content` max-width 460 (`:338`), live drawer z-index 100.
- Harness (`tests/harness.mjs:118`) exports app globals through `__app`; no DOM beyond element stubs.

## 2. Part A — metric dictionary (pure functions, one block, `METRICS_VERSION = 1`)
One place in the script, no DOM, no `state` writes; everything recomputed from `state.history` on every render (so P2-08 edits/deletes are always reflected).
- `metricCountingSets(sets)` → sets that count: `normSetType(type) !== 'W'` (warm-ups never count for records or volume), `reps >= 1`, `weight` finite and `>= 0`. `D` (drop) and `F` (failure) count. Reps 0/blank never count. Weight 0 counts for reps, never for load.
- `isLoadSet(s)` → counting set with `weight > 0`. Set volume = `weight × reps` (kg). Session volume per exercise = Σ counting-set volume.
- `epley1RMKg(weight, reps)` → `reps` 1..12 only: reps 1 = the weight itself, else `weight × (1 + reps/30)`; fewer than 1 or more than 12 reps → `null` ("not estimated above 12 reps"); `weight <= 0` → `null`.
- `exerciseRecords(exId)` → `heaviestWeight`, `bestE1RM`, `bestSetVolume`, `bestSessionVolume`, `mostRepsInSet`, `repRecords` (heaviest weight for each rep count 1..12) — each `{valueKg|weightKg, reps, dateMs, histId, setIdx}`. Ties: iterate sessions oldest→newest, sets in order, keep the first (`>` only) so the **earliest date** keeps the record.
- `usesLoadMetrics(ex)` → only `ex.type === 'weight_reps'` (legacy/missing normalizes to it). `bodyweight_reps`, `assisted` and `duration` show reps records only and never show an invented kg value; a weight_reps exercise whose counting sets are all weight 0 also falls back to "no weight recorded".
- `exerciseSessions(exId)` → per history entry holding it: `{histId, dateMs, sets[{index,type,weightKg,reps,counts,isPR}], points:{e1rm,heaviest,volume,bestReps}}`, oldest→newest. `isPR` = the set beats the running best of any of the four record kinds at that moment (first-ever best counts, like a first session).
- `exerciseSeries(points, metric, range)` → in-range points (1M/3M/1Y/All = 30/90/365/∞ days back from now) for one metric; `exerciseProgressModel(exId)` bundles sessions + records + series for the renderer.

## 3. Part B — page design
- New last-in-DOM sheet `<div class="modal" id="exProgressModal">` with header (exercise `esc(name)` + primary muscle badge) and `#exProgressBody`; `.modal-content.sheet { max-width: 412px; }` (new class only, existing 460 modals unchanged).
- Chart: inline `<svg viewBox="0 0 360 160">` polyline + point dots + min/max labels, built from `exerciseSeries`; no library, no network, no canvas. Metric buttons `Best set (e1RM) / Heaviest weight / Session volume / Best reps` (`setProgressMetric`) and ranges `1M / 3M / 1Y / All` (`setProgressRange`) re-render only `#exProgressBody`. Empty: `No sessions yet`; one point: `1 session: do another to see a line`. LBS: weights via `toDisplayWeight`, volumes via `toDisplayVolume`; e1RM always labelled "(est.)" and the reps>12 case says `not estimated above 12 reps`.
- Records card: one row per record with its date; row onclick = `openHistDetail('<histId>')` (closes this sheet first, remembers it as the return target, so closing the history sheet reopens this page).
- History timeline: every past session of the exercise, newest first, with each set (type marked) and a `PR` badge on sets flagged `isPR` by the dictionary.
- Functions: `openExerciseProgress(exId, origin)`, `closeExerciseProgress()`, `renderExerciseProgress()`, plus the `setProgress*` handlers; the exercise catalog `state.exercises` is read-only here.
- LINKING: (1) catalogue sheet — add a `📈 Progress` button in `renderExerciseDetail`; (2) history sheet — `renderHistDetail` exercise name becomes a button (`openExerciseProgress(exId,'hist')`); (3) live workout — `.ex-name` becomes a button (`openExerciseProgress(exId,'workout')`) that only opens the overlay: it never calls `renderActiveWorkout`, `saveActiveSession` or touches `activeWorkout`, so no typed value, tick or timer is lost; closing removes the overlay and the drawer stays open as it was. (4) Profile — new `Records` card (`#profileRecords`, between the muscle card and Settings) filled by `renderProfileStats` → `renderProfileRecords()`: the 8 exercises you have done most recently (name, record value, last-done date) linking to the page. Add `renderExerciseProgress()` to the open-sheet path of `toggleUnit`. Back/close always returns to the origin view, which stayed open underneath.

## 4. Data changes: none
No new `state` field, no schema bump (`SCHEMA_VERSION` stays 2), no stored records, no per-set unit, no derived cache. History sets already hold `type`/`weight`/`reps`; the dictionary treats a missing `type` as `N`, so v1 migrations, old backups, legacy id-less entries and P2-08 edits/deletes keep working unchanged. Backup, export, import, restore, draft persistence and profile totals are untouched.
- **Chosen default (documented, not hidden):** the Profile totals/`prCount` stay the stored values shown today, so they still count warm-up sets and >12-rep estimates until a later task aligns them; the new page is dictionary-exact. This is the only place the two definitions differ.

## 5. Tests to add (`tests/p5_progress.test.mjs`, real script via `tests/harness.mjs`)
Harness will export: `METRICS_VERSION, metricCountingSets, isLoadSet, epley1RMKg, exerciseRecords, exerciseSessions, exerciseSeries, exerciseProgressModel, openExerciseProgress, closeExerciseProgress, renderExerciseProgress, renderProfileRecords, usesLoadMetrics`, `progressExId`, `progressOrigin`.
- `warmups-and-empty-sets-excluded` — W set of `40×10` + `N 100×5`: volume 500, heaviest 100, no warm-up in any record.
- `epley-limited-to-1-to-12-reps` — `100×1` → 100; `100×5` → 116.667; `100×20` → `null` and the page shows `not estimated above 12 reps`.
- `record-tie-keeps-earliest-date` — two sessions, same `100×5`: record date/histId is the older one.
- `records-follow-history-edit-and-delete` — raise a weight via `saveHistEdit` → record moves; delete that entry (`askDeleteHist`/`confirmDeleteHist`) → record falls back to the older session.
- `progress-page-renders-in-lbs` — `toggleUnit()` with the sheet open shows `LBS` and converted numbers, kg unchanged in `state`.
- `bodyweight-exercise-shows-reps-only` — bodyweight ex: reps records present, no `kg`/`LBS` weight string, empty load sections say so.
- `open-from-live-workout-keeps-typed-values` — typed weight/reps, open + close progress: `activeWorkout` deep-equal before/after, drawer still `open`, `state` JSON unchanged.
- `link-points-and-generated-handlers-compile` — catalogue/history/live/profile markup contains the four link handlers; every `onclick` in `exProgressBody` + `profileRecords` + `exDetailBody` builds with `new Function(...)`.
- `chart-empty-and-single-point-states` — 0 sessions → `No sessions yet`; 1 → `1 session: do another to see a line`; range buttons filter the series.

## 6. Existing tests that may be affected
`p2_catalogue` compile test (extra `onclick`s in `exDetailBody` must compile), `p2_history_ops` (history sheet name becomes a button; it asserts content, not tags), `units.test.mjs`, `static.test.mjs` syntax. Profile/detail/history numbers are unchanged for stored values, so no assertion should need editing — the full suite must stay green.

## 7. Not doing
No calendar/consistency (P5-03), no measurements/photos/reports (P5-04), no AI or progression suggestions (P5-05/06/09), no live PR alerts or notifications during a workout, no per-set unit storage, no machine-learning or "strength level" comparison, no schema bump, no stored records, no new dependency, no build step, no screenshot/browser tooling in this run.

## 8. Questions
None blocking. Defaults chosen and stated: (a) Profile totals keep today's stored meaning (§4); (b) a first-ever best shows as a PR badge; (c) load metrics only for `weight_reps`-type exercises; (d) the Records list is the 8 most recently done exercises. Say the word to change any of these.

**Next:** implement §2–§5 on a `codex/p5-progress` commit, then update Pillar 5 (P5-01/P5-02 rows, references, Next Immediate Action) and `docs/PROGRESS_LOG.md`.
