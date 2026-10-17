# P5-01 + P5-02 PLAN — metric dictionary and exercise progress page (personal slice)
Build date: 2026-10-17. Branch: codex/p5-progress.

## Before -> target
Today: `getBest1RM` counts all reps (incl >12) and warm-ups; no progress sheet, no profile records, no chart, no history link to progress.
Target: pure dictionary (`METRICS_VERSION = 1`), exercise progress sheet (chart, records, timeline), linked from catalogue/history/live-workout/profile.

## Metric dictionary (pure, one block)
- `metricCountingSets`: `normSetType !== 'W'`, `reps >= 1`, `weight >= 0`. Drop (`D`) and failure (`F`) count; weight 0 = no load records.
- `epley1RMKg`: `reps` 1..12 only; `>12` = `null`. `weight * (1 + reps/30)`. Reps 1 = weight.
- `exerciseRecords`: heaviest weight, best e1RM, best set volume, best session volume, most reps, rep records (1..12). Tie = earliest date (first `>` only, iterate oldest->newest).
- `usesLoadMetrics`: `ex.type === 'weight_reps'`. Bodyweight/duration: reps only, never kg.
- `exerciseSessions`: per session points (`e1rm`, `heaviest`, `volume`, `bestReps`), `isPR` flags, oldest->newest.

## Page (sheet, max-width 412px)
New modal `#exProgressModal`. Inline SVG chart (`viewBox 0 0 360 160`). Metric buttons: Best set/e1RM, Heaviest weight, Session volume, Best reps. Range: 1M/3M/1Y/All. Empty: "No sessions yet"; 1 session: "1 session: do another to see a line". Records card with dates (tap -> `openHistDetail`). History timeline newest-first with PR badges.

## Links
(1) Catalogue `renderExerciseDetail`: 📈 Progress button. (2) History `renderHistDetail`: exercise name button. (3) Live workout `.ex-name`: button opens overlay without touching `activeWorkout`. (4) Profile: Records list (8 most-recent by last-done) links to page. Back/close remembers origin (catalogue/history/workout/profile).

## Data changes
None. No schema bump (`SCHEMA_VERSION` 2 unchanged). No stored derived data. Everything recomputed from `state.history`. Old backups keep working.

## Tests (`tests/p5_progress.test.mjs`)
warmups-excluded, epley-1-12-only, tie-earliest, edit-delete-reflects-records, LBS-render, bodyweight-no-kg, live-workout-typed-values-kept, link-handlers-compile, chart-empty-single-point.

## Not doing
Calendar (P5-03), measurements/photos (P5-04), AI/progression suggestions (P5-05/06), live PR alerts during workout, stored records, schema bump, build step, screenshots.

## Questions for owner
None blocking. Default: profile totals keep today's stored meaning; first-ever best = PR; load metrics only for `weight_reps` type; records list = 8 most-recently-done exercises.
