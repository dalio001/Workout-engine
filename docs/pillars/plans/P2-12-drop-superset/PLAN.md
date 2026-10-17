# P2-12 part 2 — one-tap drop sets and supersets (plan by the supervisor, 2026-10-17)

Owner's words: "make me something I can do the drop set easily with an exceptional user experience. Very simple." Research: Hevy labels drop sets and groups supersets well; no app found that lowers the weight for you. Our signature: **one tap = next drop already loaded.**

## A. Drop sets — "Drop it" (the signature)
1. When a normal/failure/drop set of a weight exercise is ticked, a small lime chip **"⬇ Drop"** appears at the right end of that row's line just below it (not a modal, not in the way). Hidden for warm-ups, bodyweight and duration exercises.
2. Tap "⬇ Drop" → a new set is inserted **directly under** it: type 'D', weight = previous weight minus the drop step, rounded DOWN to the nearest loadable step (kg 2.5, lb 5; never below 0; if the result would be 0 or less, keep the chip but show "Too light to drop"), reps = empty with the previous reps as placeholder. The rest timer is **NOT** started for a drop (drop sets have no rest) — if a rest timer was started by the tick, tapping Drop cancels it.
3. The new drop row is visually nested: indented 16 px, a thin lime line on the left, label **"↳ 1"**, **"↳ 2"** (drops of the same set), lime "DROP" tag. Set numbering of normal sets does not count drops (3, ↳1, ↳2, 4).
4. Ticking a drop row shows "⬇ Drop" again on it → chains (3 → ↳1 → ↳2 ...). Each drop again lowers from the drop's own weight.
5. Drop step: **chip long-press OR a small "−20%" text next to the chip** opens 3 choices: −10% / −20% / −30% (default −20%, saved in Profile settings as `dropStepPct`, values 10|20|30). The choice applies to the next drops.
6. Typing in the drop row works like any row (no rebuild while typing). Removing the parent set removes its drops too (with the existing 5 s Undo, restoring all).
7. Routine editor: per exercise an optional "Drops after last set: 0/1/2" (`dropsAfterLast`) — at workout start the last set gets that many pre-made drop rows (weights from previous performance minus the step when available, else empty).

## B. Supersets
1. Exercise menu in the live workout and in the routine editor: **"Superset with…"** → opens the picker filtered to the exercises already in this workout/routine (single choice). Both exercises get the same `supersetId` (short random id) and are moved next to each other.
2. Look: grouped exercises share a coloured left bar (palette of 4 colours by group) and labels **A1 / A2** (B1/B2 for a second group) before the name. A small "Superset" pill. "Remove from superset" in the menu.
3. Smart advance (default ON, Profile toggle `supersetAdvance`): ticking set N of A1 scrolls smoothly to set N of A2 (no focus steal, no keyboard). After the LAST exercise of the round is ticked, the rest timer starts (once per round), and the view scrolls back to set N+1 of A1. Ticking inside A1 does **not** start rest when a superset partner follows.
4. More than 2 exercises in one superset allowed (A1/A2/A3).
5. Previous performance, history detail, repeat/as-routine keep `supersetId` (history detail shows A1/A2 labels).

## Data (no schema bump)
- Exercise item (workout, routine, history): optional `supersetId: string|null`.
- Routine item: optional `dropsAfterLast: 0|1|2`.
- Set: drops are ordinary sets with `type:'D'` placed after their parent; optional `dropOf: <parent set index at creation>` only for display grouping (renumbering uses order, not this field).
- Settings: `state.dropStepPct` (10|20|30, default 20), `state.supersetAdvance` (bool, default true).
- All optional and normalized idempotently; old data/backups without them work unchanged; restore keeps them.

## Rules
Typing never rebuilds the screen; every generated handler compiles; nothing wider than 412 px; buttons ≥ 44 px (the Drop chip ≥ 40 px tall); esc() on names; P5-01 metrics already count 'D' sets (keep); draft mirror (P0-01) persists everything automatically; KG and LBS both work (lb step 5, kg step 2.5).

## Tests (new tests/p2_drop_superset.test.mjs)
drop-chip-shows-only-after-ticking-a-weight-set · drop-inserts-below-with-20pct-rounded-down-kg · drop-in-lbs-rounds-to-5 · drop-never-below-zero-shows-too-light · drop-cancels-rest-timer · chained-drops-lower-from-drop-weight · drop-numbering-3-then-arrow1-arrow2-then-4 · drop-step-choice-10-20-30-saved · removing-parent-removes-drops-and-undo-restores · routine-drops-after-last-premade-at-start · superset-with-groups-two-exercises-and-moves-them-adjacent · superset-labels-A1-A2-B1 · smart-advance-scrolls-to-partner-and-rest-only-after-round · advance-off-starts-rest-as-before · remove-from-superset · history-keeps-supersetId-and-labels · old-backup-without-fields-restores · handlers-compile · no-rebuild-while-typing-in-drop-row.
All 218 existing tests stay green.

## Not doing
Rest-pause / myo-reps, giant-set timers, AI suggestions, coach features.
