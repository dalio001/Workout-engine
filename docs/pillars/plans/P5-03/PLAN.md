# P5-03 PLAN — training calendar, consistency and monthly muscle workload (personal slice)
Build date: 2026-10-17. Branch: codex/p5-03-calendar. Owner scope: personal use, one device, local phone time.

## Today's behaviour (source, names as built)
- `renderProfileStats()` paints the 3 stat cards, `#muscleChart` and calls `renderMyProfile()` + `renderProfileRecords()`. Its muscle map folds 12 primaries into 6 buckets via `MUSCLE_BUCKETS` and counts `item.sets.length` — **all** sets, warm-ups included.
- `renderHistory()` lists history newest-first, grouped by month (`monthCounts` header). Card onclick = `openHistDetail(this.getAttribute('data-wid'))`.
- `openHistDetail(id)` finds via `findHistEntry(id)`, renders, opens `#histDetailModal`; returns false when the id is unknown.
- Units: `toDisplayVolume` / `formatDisplayWeight` for display only; canonical kg in state.
- P5-01: `METRICS_VERSION = 1`, `metricCountingSets(sets)` (drops `W`, keeps `N`/`D`/`F`, reps ≥ 1, weight ≥ 0), `exerciseRecords(exId)`.
- Preferences today: `getPrevScope/setPrevScope` (state field + `saveState()` + re-render) is the pattern to copy. Tests: `tests/harness.mjs` `createApp()` (fake DOM, in-memory localStorage), `tests/p5_progress.test.mjs`.
- Nothing exists for a calendar, streak, weekly counts or a month-scoped workload.

## Design
- New card `#calendarCard` on the Profile tab, above Muscle Group Distribution, and a `Calendar` button in the `#tab-history` header (`goToTrainingCalendar()` → reuses the `switchTab('profile', navs[3])` route, then guards `#calendarCard.scrollIntoView` in try/catch: the harness has no stub for it).
- Pure, testable helpers (no DOM, no writes): `dayKeyLocal(ms)`, `startOfDayMs(ms)`, `weekStartDay()` (0 Sun / 1 Mon), `startOfWeekMs(ms, weekStart)`, `historyByDay(history)`, `buildCalendarModel(history, year, month, weekStart, nowMs)`, `computeConsistency(history, nowMs, weekStart)`, `muscleWorkloadForMonth(history, exercises, year, month)`.
- Calendar: 7-column `grid-template-columns: repeat(7, minmax(0,1fr))`, Monday-first headers by default (Sun-first when the setting says so), 6 rows max incl. padded leading/trailing days. Trained days filled lime/`var(--primary)` with the day number on top; today outlined (`var(--primary)` border); other-month days dimmed. `‹ ›` arrows (`calPrevMonth()`/`calNextMonth()`, session-only `calMonth` cursor defaulting to the current month) with a `#calendarTitle` (e.g. "October 2026") and a `Today` jump. Empty: "No workouts yet" instead of the grid.
- Day tap: `openCalendarDay(key)` from `onclick="openCalendarDay('2026-10-14')"`. 1 workout → `openHistDetail(id)` directly; 2+ → small `#calDayModal` list (time + title) whose rows call `openCalDayPick(id)` (closes the picker, then `openHistDetail(id)`).
- Consistency line under the grid: "This week N · This month M · Streak S weeks". Plain counts, stated as recorded sessions — no readiness, fatigue or recovery claim.
- Month workload inside the same card, driven by the shown month: sets per muscle using **primary muscle only** (`exPrimary(ex)`), counting only `metricCountingSets(...)` (warm-ups excluded), same bar style as today. Label: "Primary muscle, warm-ups not counted". Full body stays uncharted (today's behaviour).
- Sizing: calendar card and picker `max-width: 412px` (repo convention, like `.modal-content.sheet`), day cells `min-height: 40px`, fits 320 px with no horizontal overflow. All generated handlers compile; every generated name/id goes through `esc()`.

## Exact rules
- **Day boundary:** local phone time. `dayKeyLocal` = `getFullYear/getMonth/getDate` of the workout's `Number(w.date)` (the session end timestamp already used by `renderHistory`). Invalid date → not placed on the grid, never counted.
- **Week:** starts Monday by default; `state.weekStart` = `'mon' | 'sun'`, read through `getStartOfWeekSetting()` which returns `'mon'` for anything missing/invalid. Weeks are local calendar weeks, so a Sunday workout falls in the *previous* week when Monday-start is on.
- **This week / this month:** number of history entries whose local day is inside the current week / current calendar month. One workout counts once even if it has many exercises.
- **Streak (weeks):** `S` = length of the run of consecutive weeks ending at the newest week that has a workout, where the **current** week counts as grace: if the current week has no workout yet it is skipped rather than ending the run (so Monday morning does not show 0 after a full previous week). Any *earlier* empty week ends the run. No history → `0`. One workout in the current week → `1`.
- Wrong-direction example to encode in tests: workout in current week, none last week, workouts two and three weeks ago → streak `1` (the current-week grace does not bridge a fully missed week).

## Data changes
- One new optional field only: `state.weekStart` (`'mon' | 'sun'`), written by `setWeekStart(v)`, which normalizes, `saveState()`, then re-renders. No schema bump (`SCHEMA_VERSION` stays 2, `METRICS_VERSION` stays 1), no new stored keys.
- Everything else (fills, day counts, streak, month workload) is recomputed from `state.history` on every render, so history edits/deletes/restores propagate with no extra step and nothing can go stale.
- Old data and backups keep working: a missing `weekStart` reads as `'mon'`; a restore/import that does not carry the field simply falls back to the default. Restore, migration and validation paths (`migrateParsedStateToV2`, `validateBackupData`, `confirmRestore`) are not touched, and no stored set/weight/volume meaning changes.

## Tests to add (`tests/p5_calendar.test.mjs`, harness `createApp()`)
1. `week-start-monday-puts-sunday-workout-in-previous-week`
2. `week-start-sunday-shifts-the-boundary`
3. `two-workouts-one-day-list-then-open-detail` (day tap with 2 entries → picker rows → `openCalDayPick` sets `histDetailId`)
4. `calendar-month-change-shows-the-other-month` (`calNextMonth`/`calPrevMonth` change `#calendarTitle` and the filled days)
5. `current-unfinished-week-does-not-break-streak`
6. `missed-earlier-week-ends-streak` (the example above)
7. `warmups-not-counted-in-month-workload`
8. `workload-uses-primary-muscle-only` (secondary muscles contribute nothing)
9. `month-workload-ignores-other-months`
10. `empty-history-shows-no-workouts-yet`
11. `today-is-outlined-and-trained-days-are-filled`
12. `calendar-tap-handlers-compile` (`[...html.matchAll(/onclick="([^"]+)"/g)]` → `new Function`)
13. `week-start-choice-persists-and-defaults-safely` (invalid/missing → `'mon'`; reload from the same store keeps the choice)
14. `calendar-layout-stays-within-412px-and-40px-cells` (generated grid HTML: 7 columns, `min-height: 40px`, `max-width: 412px`)
15. `history-calendar-button-opens-calendar` (button handler compiles and lands on the Profile tab)
16. Existing suite `node --test "tests/*.test.mjs"` stays green; the all-time behaviour of `renderHistory`/`openHistDetail`/P5-02 is regression-checked.

## Not doing
Body measurements and progress photos (P5-04); AI, chat or progression advice (P5-05/06); planned-vs-actual programs or prescribed work; any recovery/readiness/fatigue score; session-duration or volume charts; schema bump; stored derived data; new library/build step; changing stored kg values or unit meaning; screenshots or browser checks this run.

## Questions for owner
None blocking. One real choice, default taken: month workload keeps today's 6 display buckets (Biceps/Triceps/Forearms → Arms, Quads/Hamstrings/Glutes/Calves → Legs, Full body uncharted) so the card keeps its present shape — say the word if you would rather see all 12 primary muscles broken out.
