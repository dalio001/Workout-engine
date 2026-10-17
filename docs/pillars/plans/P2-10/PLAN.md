# P2-10 personal slice — week planner (plan written by DeepSeek V4.1 Flash in plan mode, saved by the supervisor 2026-10-17)


## Today's behaviour, with function names
- `renderTrainingCalendar()` reads `state.plans`; `buildCalendarModel()` is unchanged. Every in-month cell is tappable: trained → `onclick="openCalendarDay(key)"`, else `"openPlanDay(key)"`. The grid now always renders (adds a "No workouts yet" caption when history **and** plans are empty).
- `openPlanDay(key)`: no plan → "Plan this day" editor (routine `<select>` incl. "Rest day" + Save); planned day → plan line (Edit / Delete, plus Move when missed) + any workouts.
- `openCalendarDay(key)`: unchanged for plan-less days (1 workout → `openHistDetail`, 2+ → picker, none → `false`). When a plan exists it delegates to the shared day sheet (`renderDaySheet`) so the plan line + workout list show together.
- `renderRoutines()` (Workout tab) also calls new `renderTodayPlan()` → `#todayPlanCard`: "Today: ‹name› — Start" (`onclick="startTodayPlanWorkout()"` → `startRoutineWorkout(plan.routineId)`), "Today: Rest day", or "Deleted routine"; no plan → empty.
- `switchTab('workout')` re-renders so the card survives an open app across midnight. `finishWorkout()`/`doFinishSave()` are untouched — history is written exactly as today; plan completion is **derived**, never stored.

## Data shape, and why old data/backups keep working
`state.plans = { 'YYYY-MM-DD': { routineId: string|null, kind:'routine'|'rest', createdAt:number } }` — one plan per local day key (`dayKeyLocal`, local phone time). A new optional field, **no `SCHEMA_VERSION` bump** (stays 2). `normalizePlans(src)` is pure + idempotent (valid date keys only; routine→non-empty `routineId`, rest→null; `createdAt` finite else 0; missing/invalid → `{}`), wired into `applySeedDefaults()`, `validateBackupData()` (migrated copy) and `confirmRestore()`. Old state/backups just gain `plans:{}`; a backup without `plans` restores fine, one with `plans` keeps them (invalid entries dropped). History is never rewritten; plans never enter history.
Pure helpers: `getPlan(key)`, `planDoneOn(plan, dayItems)` (same local day AND (kind==='rest' OR workout.routineId===plan.routineId)), `planStatus(plan, items, todayKey)` → none|planned|done|missed, `planLabel(plan, routines)` ("Rest day"/rt.name/"Deleted routine"), `computePlanWeek(plans, history, nowMs, weekStart)` → {planned, done}.

## Each part
1. Plan a day: cell → `openPlanDay` → editor in `#calDayModal`; `savePlanForDay(key)` / `saveRestPlanForDay(key)` write exactly one plan, `saveState()`, re-render.
2. Today card: `renderTodayPlan()` (above).
3. Register: derived `planDoneOn`; done trained day = filled + small "✓". A plan alone never fills a day → never counted as trained.
4. Missed: key < todayKey, plan present, not done → grey dashed cell; tap → sheet offers Move (`<input type="date">` + `movePlan(key)`; refuses an occupied target day) / Delete (`deletePlan(key)`).
5. Plan + workouts: one sheet shows the plan line with Edit/Delete above the existing workout buttons (`openCalDayPick`).
6. `copyWeekToNextWeek()`: **today's** local week (per `getWeekStartDayNum()`) → +7 days; copies a plan only when the target has none (never overwrites); writes `#planCopyMsg` ("Copied N plan(s) to next week." / nothing-to-copy).
7. Consistency line: append " · Planned this week N, done M" from `computePlanWeek` (existing "This week / This month / Streak" text unchanged).

## Rules honoured
Optional+idempotent `state.plans`; deleted-routine plan shows "Deleted routine" and is deletable; no schema bump; restore keeps plans and accepts backups without them; nothing >412px (sheet `max-width:412px`, routine `<select>` capped), cells stay `min-height:40px`; every generated onclick/onchange compiles; `esc()` on names; the `<select>` (change, not typing) never rebuilds the screen; action buttons stay `min-height:44px` and visible; local phone time decides the day.

## Exact tests — new `tests/p2_week_plan.test.mjs`
plan-a-future-day-stores-one-plan · planned-day-is-not-counted-as-trained · finishing-a-routine-on-its-planned-day-marks-it-done · other-routine-same-day-still-counts-when-plan-was-any · missed-past-plan-shows-grey-and-offers-move-delete · move-plan-to-another-day · delete-plan · copy-week-skips-days-that-already-have-a-plan · plan-pointing-at-a-deleted-routine-shows-deleted-routine-and-can-be-deleted · restore-old-backup-without-plans-keeps-working · restore-backup-with-plans-keeps-them · today-plan-card-start-handler-compiles · generated-week-plan-handlers-compile · normalize-plans-is-idempotent.

## Existing tests that may be affected
- `p5_calendar.test.mjs`: `empty-history-shows-no-workouts-yet` (grid always renders — keep the "No workouts yet" caption inside `calendarGrid` so the substring assert passes); `today-…-filled` (trained day still emits `openCalendarDay`, keeps `cal-day-filled`/`cal-day-today`/ring); `calendar-layout-…` (all cells keep `min-height:40px`, `max-width:412px`); `calendar-tap-handlers-compile` (new handlers compile); `week-start-…`, `two-workouts-…` unchanged. No test asserts an exact state key set.
- `restore.test.mjs`: "undo returns the exact previous bytes" — both snapshots carry `plans` consistently (load normalises `plans:{}`), so undo stays byte-exact; LBS-migration and summary tests unaffected.
- `p5_progress.test.mjs` "state unchanged" compares one instance before/after → unaffected. Keep `node --test "tests/*.test.mjs"` green.

## I will NOT do
Programs library, coach assignments, deload, AI/adaptive suggestions, notifications; no backend/accounts/cloud sync; no schema bump; no rewriting history and no stored completion flags; no change to the finish/save path or units; no new dependencies or build step.

## Questions (real decisions only)
1. "Copy this week" = **today's** local week (the only unambiguous reading); OK?
2. A workout on a **Rest** day marks the plan done, per your matching rule "otherwise any workout that day" — confirm that is intended for rest days too?


## Supervisor decisions (2026-10-17)
1. Copy week = today's local week -> next week. Accepted.
2. Rest-day plan is never 'missed' and never 'done'; a workout on a rest day still fills the day (registered) and the plan line reads 'Rest day (trained anyway)'.
3. Routine plan: done only when a finished workout that day has the same routineId. A different workout that day still fills the day; the plan line reads 'Planned <name> - did another workout'. Empty workout (no routine) counts the same way.
4. Planning is allowed for today and future days only; past days only Move/Delete.
