# Pillar 2 — Workout engine, routines and exercise catalogue

> **Role:** Own the actual training workflow: reusable prescriptions, correct performed sets, accurate timers and useful movement selection. Keep domain behavior independent of a particular UI or cloud vendor.
>
> **Depends on:** Pillar 0 durable entities/migration; Pillar 1 shared controls; Pillar 4 input and platform boundaries.
> **Used by:** Pillars 3 coaching/sharing, 5 records/recommendations, 7 product measures.
> **Cross-pillar impacts:** Units, modality, record eligibility, routine versions, exercise snapshots and session finalization.

**Current mode — personal use:** this is a core pillar. Prioritize P2-01/02/03/04, needed set actions from P2-05, and previous performance from P2-07. Add only the movements/program details you actually need; a large public catalogue, coach assignments and adaptive programs are optional later scope. Public phase letters below are future reference.

## Trigger keywords

`Pillar 2`, workout, routine, exercise, sets, reps, superset, rest timer, program, plate calculator.

## Scope

- Session lifecycle, ordered exercise instances, performed sets and explicit completion.
- Routine prescriptions, folders, duplication, editing, program scheduling and optional template updates.
- Typed exercises, equipment and muscle metadata, search and owned/licensed instruction media.
- Timer deadlines, previous-performance selection and utilities.
- Execute accepted progression prescriptions; pillar 5 owns recommendation/analytics policy.

## UI components used from Pillar 1

Set row, type menu, numeric input, rest controls, exercise picker/detail, reorder controls, routine editor, active-session recovery bar, finish review and template-update choice.

## What is built and verified `[x]`

- [x] **Runtime/source checked:** Three seed PPL routines and 15 seed movements; create/start/delete routines; start empty workout.
- [x] **Runtime/source checked:** Weight/reps, previous values, normal/warm-up/drop/failure types, complete/uncomplete, add set and remove exercise.
- [x] **Runtime checked:** Rest bar and adjustments exist; finish retains completed positive-rep sets and moves to history.
- [x] **Source inspected:** Fixed barbell/plate calculator and global rest/unit preferences. No edit-routine flow, typed duration/distance or persistent draft.

## What is left to do `[ ]`

| ID | Priority / phase | Task and dependencies | Acceptance criteria |
| --- | --- | --- | --- |
| P2-01 | P0 / B | Durable session lifecycle; P0-02/03 | Explicit resume/replace choice when a session exists; stable draft/session IDs; finish atomic/idempotent; uncompleted sets reviewed; discard confirmation/recovery policy; no silent overwrite |
| P2-02 | P0 / A–B | Units, modalities and set validation; P0-01/P5-01 | Canonical load and input provenance; unit toggle preserves physical load; integer positive reps when required; finite bounded values; bodyweight/assisted/weighted/time/distance semantics explicit; unsupported types cannot produce fake 1RM |
| P2-03 | P0 / B | Deadline-based rest and elapsed timing; P4-03 | Per-exercise rest including Off; completion starts intended timer; skip/±time/undo behavior defined; reload/suspension recomputes from deadline; platform notification limitations explicit |
| P2-04 | P1 / B–C | Full routine editor and prescription model; P0 versions/P1 controls | Edit/duplicate/reorder/delete, sets/types, load/reps or ranges, notes and rest; folders by C; update-from-session is optional and preserves prior versions and past performance |
| P2-05 | P1 / B–C | Advanced set/exercise actions and utilities | Add/remove/edit sets, reorder/swap exercise, supersets/circuits, RPE/RIR fields and notes; configurable equipment increments/bar/plates; show achievable plate load and remainder rather than pretending an impossible target is loaded |
| P2-06 | P1 / B–C | Curated exercise catalogue; P1-04/P4 content rights | Stable IDs, movement type, equipment, primary/secondary muscles, substitutions, custom movement editing, recent/favorite search and multi-select; launch with a proposed 80–120 high-coverage reviewed entries, not an unreviewed bulk scrape |
| P2-07 | P1 / C | Previous-performance and repeated-exercise policy; P5-01 | Latest eligible previous session identified by timestamp/instance; warm-ups and repeated exercises handled explicitly; missing history and substituted exercises do not misalign positional sets; displays correct units |
| P2-08 | P1 / C | History operations and curated program library | Repeat/edit/delete session with P5 recalculation; convert completed session to routine; program filters by goal/experience/equipment/days; initial 8–12 expert-reviewed programs proposed, each with versioned prescriptions |
| P2-09 | P2 / E | Equipment/time-aware training adaptations; P5-05 | User selects constraint, previews alternatives and changed prescription, understands rationale and confirms; replacement preserves training intent as a reviewed rule, not a medical claim; original plan recoverable |
| P2-10 | P2 / E–F | Program assignment/schedule runtime; P3 coaching/P5 guidance | Planned versus actual work separate; missed-day/reorder and deload behavior specified; recommendation acceptance creates a new version; coach assignments cannot rewrite a live session silently |

### Domain policies to decide early

- Is dumbbell weight per hand or total? Store that convention per exercise and expose it in instructions.
- How do added bodyweight and assistance loads affect volume and records? Keep raw performance separate from computed estimates.
- Are warm-ups excluded from “working sets” and record checks? Which drop/failure sets qualify? Pillar 5 owns the dictionary; this engine applies it.
- How do repetitions to failure, timed holds, distance and zero external load complete a valid set?
- Does undo completion cancel only the timer it started? What happens when a different exercise starts another timer?
- Does finish review remove incomplete sets, retain them as planned-only data, or request confirmation? No hidden data transformation.

### Concrete future regression examples

100 KG ↔ equivalent LBS retains the same canonical load; a timed plank finishes without reps; assisted pull-up metrics remain distinct from positive external load; duplicate finish creates one session; warm-up insertion does not misalign previous working sets; editing a routine does not mutate old sessions; app suspension does not extend rest by callback drift. Define fixtures before implementing.

## Video references & Assets

- [Supplied review](https://www.youtube.com/watch?v=8ESngufwx6g): 0:43–1:33 selection/detail; 1:33–2:16 routine; 2:16–2:51 logging/rest/save; 4:09–4:29 programs.
- [Routine behaviors](https://www.hevyapp.com/features/gym-routines/), [superset reference](https://www.hevyapp.com/features/what-are-supersets/), [catalogue reference](https://www.hevyapp.com/features/exercise-library/).
- Catalogue instruction/demo production and expert review are planned work; no new assets created.

## Next Immediate Action

**Planning only:** write P2-02's modality/unit/set contract with P5-01, then specify P2-01's start/resume/finish/discard state transitions. Do not change the prototype yet.
