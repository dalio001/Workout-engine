# P0-02 Plan: Durable Live Session and Recovery

## What goes wrong today
A live workout exists only in the in-memory variable `activeWorkout` (line 627). The functions that create it — `startEmptyWorkout()` (763–770) and `startRoutineWorkout()` (772–794) — populate this variable but never persist it. `saveState()` (653–655) serializes only `state` (history, routines, exercises, preferences) under `hevy_clone_state`. `init()` (635–651) restores `state` on load but never checks for an unfinished session. Reloading the page, closing the tab, or the phone suspending the browser discards every set the user has already ticked.

## Design
- **Persist on every change:** Write the active workout to localStorage under its own key `hevy_clone_active_session` inside `renderActiveWorkout()` (828–877), `updateSetVal()` (887–889), `toggleSetDone()` (891–896), `addSetToActive()` (898–903), `removeActiveEx()` (905–908), `cycleSetType()` (879–885), and when the rest timer starts/stops.
- **Stored fields:** `title`, `startTime`, `exercises[]` (each with `exId`, `sets[]` containing `type`, `weight`, `reps`, `done`), and `restDeadline` (wall-clock timestamp in ms when the current rest ends, or `null`).
- **Resume prompt on load:** In `init()` after restoring `state`, read `hevy_clone_active_session`. If present, show a modal: "Resume workout / Discard". Matching V1 0:15–0:43 and 2:12–2:18.
- **Resume path:** Populate `activeWorkout` from the saved draft, recompute `restRemaining = max(0, restDeadline - Date.now())`, restart `workoutInterval` and (if `restRemaining > 0`) `restInterval`.
- **Discard path:** Delete `hevy_clone_active_session` and clear `activeWorkout`.
- **Finish path:** `finishWorkout()` (958–1007) builds the history entry, calls `saveState()`, then calls `cleanupActiveWorkout()` (1014–1020) which must also `localStorage.removeItem('hevy_clone_active_session')`. Guard against double-finish with a `finishing` flag on `activeWorkout`.
- **Storage failure:** Wrap `localStorage.setItem` in try/catch; on `QuotaExceededError` or any exception, show a visible red banner ("⚠️ Could not save draft — storage full") instead of silently pretending it saved.

## Manual verification checks (run next session)
1. Start a routine workout, tick 3 sets → reload → all 3 sets still ticked.
2. Start rest timer (e.g., 90s), wait 10s, reload → rest banner shows ~80s remaining and continues counting down.
3. With a live draft present, choose "Discard" → draft gone, no history entry created.
4. Finish a workout, immediately tap Finish again (double-tap) → exactly one history entry appears.
5. Open History tab → previously saved workouts still load and display correctly.

## Out of scope (NOT done in this task)
- Unit conversion / canonical load semantics (P0-03, P5-01)
- Import/export preview, validation, rollback (P0-03)
- Per-exercise rest defaults or timer sounds (P2-03, P6-08)
- Routine editing/duplication (P2-04)
- Any backend, accounts, sync, or native platform work