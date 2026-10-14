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

| ID | Priority / phase | Task and dependencies | Acceptance criteria | Feature references |
| --- | --- | --- | --- | --- |
| P2-01 | P0 / B | Durable session lifecycle; P0-02/03 | Explicit resume/replace choice when a session exists; stable draft/session IDs; finish atomic/idempotent; uncompleted sets reviewed; discard confirmation/recovery policy; no silent overwrite | [Clips / evidence](#p2-01-reference) |
| P2-02 | P0 / A–B | Units, modalities and set validation; P0-01/P5-01 | Canonical load and input provenance; unit toggle preserves physical load; integer positive reps when required; finite bounded values; bodyweight/assisted/weighted/time/distance semantics explicit; unsupported types cannot produce fake 1RM | [Clips / evidence](#p2-02-reference) |
| P2-03 | P0 / B | Deadline-based rest and elapsed timing; P4-03 | Per-exercise rest including Off; completion starts intended timer; skip/±time/undo behavior defined; reload/suspension recomputes from deadline; platform notification limitations explicit | [Clips / evidence](#p2-03-reference) |
| P2-04 | P1 / B–C | Full routine editor and prescription model; P0 versions/P1 controls | Edit/duplicate/reorder/delete, sets/types, load/reps or ranges, notes and rest; folders by C; update-from-session is optional and preserves prior versions and past performance | [Clips / evidence](#p2-04-reference) |
| P2-05 | P1 / B–C | Advanced set/exercise actions and utilities | Add/remove/edit sets, reorder/swap exercise, supersets/circuits, RPE/RIR fields and notes; configurable equipment increments/bar/plates; show achievable plate load and remainder rather than pretending an impossible target is loaded | [Clips / evidence](#p2-05-reference) |
| P2-06 | P1 / B–C | Curated exercise catalogue; P1-04/P4 content rights | Stable IDs, movement type, equipment, primary/secondary muscles, substitutions, custom movement editing, recent/favorite search and multi-select; launch with a proposed 80–120 high-coverage reviewed entries, not an unreviewed bulk scrape | [Clips / evidence](#p2-06-reference) |
| P2-07 | P1 / C | Previous-performance and repeated-exercise policy; P5-01 | Latest eligible previous session identified by timestamp/instance; warm-ups and repeated exercises handled explicitly; missing history and substituted exercises do not misalign positional sets; displays correct units | [Clips / evidence](#p2-07-reference) |
| P2-08 | P1 / C | History operations and curated program library | Repeat/edit/delete session with P5 recalculation; convert completed session to routine; program filters by goal/experience/equipment/days; initial 8–12 expert-reviewed programs proposed, each with versioned prescriptions | [Clips / evidence](#p2-08-reference) |
| P2-09 | P2 / E | Equipment/time-aware training adaptations; P5-05 | User selects constraint, previews alternatives and changed prescription, understands rationale and confirms; replacement preserves training intent as a reviewed rule, not a medical claim; original plan recoverable | [Clips / evidence](#p2-09-reference) |
| P2-10 | P2 / E–F | Program assignment/schedule runtime; P3 coaching/P5 guidance | Planned versus actual work separate; missed-day/reorder and deload behavior specified; recommendation acceptance creates a new version; coach assignments cannot rewrite a live session silently | [Clips / evidence](#p2-10-reference) |
| P2-11 | P1 / personal after core logger | Previous-values scope preference; refines P2-07, settings in P6-01 | Select latest eligible performance from any workout or the same routine; explain missing history; preference changes do not modify stored sessions; repeated exercise/set-type policy preserved | [Clips / evidence](#p2-11-reference) |
| P2-12 | P2 / personal optional | Inline duration-set timer and optional superset advancement; P2-02/03/05 and P1-02 | Duration sets have explicit start/stop and persisted elapsed data; optional group advancement preserves keyboard/focus and can be disabled; rest-versus-exercise timers distinct; test actual behavior because video shows settings only | [Clips / evidence](#p2-12-reference) |
| P2-13 | P1 / personal when needed | Custom exercise instruction media and muscle metadata; refines P2-06, P4-05 | Own demonstration link/media, primary/secondary muscles and equipment attached to stable custom exercise ID; private by default; old sessions preserved; broken/offline media never blocks logging | [Clips / evidence](#p2-13-reference) |

### Domain policies to decide early

- Is dumbbell weight per hand or total? Store that convention per exercise and expose it in instructions.
- How do added bodyweight and assistance loads affect volume and records? Keep raw performance separate from computed estimates.
- Are warm-ups excluded from “working sets” and record checks? Which drop/failure sets qualify? Pillar 5 owns the dictionary; this engine applies it.
- How do repetitions to failure, timed holds, distance and zero external load complete a valid set?
- Does undo completion cancel only the timer it started? What happens when a different exercise starts another timer?
- Does finish review remove incomplete sets, retain them as planned-only data, or request confirmation? No hidden data transformation.

### Concrete future regression examples

100 KG ↔ equivalent LBS retains the same canonical load; a timed plank finishes without reps; assisted pull-up metrics remain distinct from positive external load; duplicate finish creates one session; warm-up insertion does not misalign previous working sets; editing a routine does not mutate old sessions; app suspension does not extend rest by callback drift. Define fixtures before implementing.

## Feature reference map

Use the [video index](../research/VIDEO_REFERENCE_INDEX.md) for source/evidence definitions. The exact sub-feature links below are the starting points; unspecified acceptance criteria remain our planned behavior.

### P2-01 reference

- **Empty/routine start and resume bar — Shown:** [V1 0:15–0:43](https://www.youtube.com/watch?v=8ESngufwx6g&t=15s).
- **Resume versus replacing an existing session — Shown:** [V1 2:12–2:18](https://www.youtube.com/watch?v=8ESngufwx6g&t=132s).
- **Finish/save review — Shown:** [V1 2:40–2:49](https://www.youtube.com/watch?v=8ESngufwx6g&t=160s).
- **Durable recovery, atomic save, repeated finish and undo-discard recovery — Not demonstrated.** Use the [session-loss audit](../research/HEVY_AUDIT.md) and our lifecycle criteria.

### P2-02 reference

- **Weight/reps logging — Shown:** [V1 2:18–2:39](https://www.youtube.com/watch?v=8ESngufwx6g&t=138s).
- **Unit choices — Shown:** [V2 3:34–3:42](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=214s); no conversion-correctness trial.
- **Rep count/range — Shown:** [V2 7:13–7:27](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=433s).
- **Bodyweight pull-up prescription — Shown:** [V2 8:17–8:38](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=497s).
- **Timed sets — Setting only:** [V2 5:35–6:12](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=335s), via Inline Timer. Assisted/distance logging, validation bounds and canonical conversion are not demonstrated; use the modality contract.

### P2-03 reference

- **Per-exercise rest configuration — Shown:** [V1 1:56–2:06](https://www.youtube.com/watch?v=8ESngufwx6g&t=116s) and [V2 7:48–8:00](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=468s).
- **Live countdown/±15s/Skip — Shown:** [V1 2:24–2:39](https://www.youtube.com/watch?v=8ESngufwx6g&t=144s).
- **Sound controls — Settings only:** [V2 4:15–4:48](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=255s); implementation owner P6-08.
- **Deadlines, suspension/reload, undo and grouped timer semantics — Not demonstrated.** Specify and test these separately.

### P2-04 reference

- **New routine/title — Shown:** [V1 0:44–0:52](https://www.youtube.com/watch?v=8ESngufwx6g&t=44s).
- **Existing editor/Update — Screen shown:** [V2 1:00–1:04](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=60s).
- **Sets and save — Shown:** [V1 1:42–2:06](https://www.youtube.com/watch?v=8ESngufwx6g&t=102s).
- **Rep-range prescription — Shown:** [V2 7:13–7:27](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=433s).
- **Exercise notes — Shown:** [V2 8:00–8:17](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=480s).
- **Folders, duplicate flow and optional template update/versioning — Not demonstrated.** Reference [official routine behavior](https://www.hevyapp.com/features/gym-routines/) and our versioning contract.

### P2-05 reference

- **Add set — Shown:** [V1 1:42–1:58](https://www.youtube.com/watch?v=8ESngufwx6g&t=102s).
- **Warm-up/normal/failure/drop and removal/help — Shown menu:** [V2 7:22–7:49](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=442s); inspect labels/help, not just a set-number cycle.
- **Exercise notes — Shown:** [V2 8:00–8:17](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=480s).
- **Reorder/replace menu and superset pairing — Shown:** [V2 8:17–8:38](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=497s); drag completion and live grouped rest are not proven.
- **RPE — Setting/explanation only:** [V2 5:20–6:15](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=320s); no actual RPE logging, no RIR field demonstrated. Keep RIR an explicitly proposed option.
- **Plate/warm-up calculators — Settings only:** [V2 5:18–5:35](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=318s); no result/inventory/remainder behavior. Use the [prototype plate audit](../research/HEVY_AUDIT.md) for our improvements.

### P2-06 reference

- **Equipment/muscle filters — Shown:** [V1 0:50–1:13](https://www.youtube.com/watch?v=8ESngufwx6g&t=50s).
- **Exercise demo/detail tabs — Shown:** [V1 1:14–1:34](https://www.youtube.com/watch?v=8ESngufwx6g&t=74s).
- **Multi-add — Shown:** [V1 1:30–1:42](https://www.youtube.com/watch?v=8ESngufwx6g&t=90s).
- **Recent exercises — Shown:** [V2 6:50–7:14](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=410s).
- **Custom media/muscle metadata — Shown result:** [V2 9:58–10:44](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=598s), expanded in P2-13. Favourites, stable-ID policy, catalogue review and media rights are not demonstrated.

### P2-07 reference

- **Previous-values scope — Shown setting:** [V2 5:04–5:15](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=304s); see P2-11.
- **Prior weights/sets recalled next week — Narrated only:** [V2 9:20–9:31](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=560s).
- **Previous column — UI shown:** [V1 2:18–2:39](https://www.youtube.com/watch?v=8ESngufwx6g&t=138s); it is empty for that first exercise session. Warm-up/repeated-instance matching requires our policy, not positional assumptions.

### P2-08 reference

- **Saved workout detail — Shown:** [V2 2:35–2:56](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=155s).
- **Duration correction — Narrated only:** [V2 9:20–9:31](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=560s).
- **Curated programs/filters/previews — Shown:** [V1 4:13–4:29](https://www.youtube.com/watch?v=8ESngufwx6g&t=253s).
- **History repeat/edit/delete and workout-to-routine conversion — Not demonstrated.** Use [official routine reference](https://www.hevyapp.com/features/gym-routines/) and our correction/rebuild specifications.

### P2-09 reference

- **Manual replacement entry — Menu shown:** [V2 8:17–8:38](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=497s).
- **Equipment/time-aware recommendations, preview/undo and training-intent preservation — Not demonstrated.** Use [official Trainer description](https://www.hevyapp.com/features/workout-plan-generator/) as product context and our P2-09/P5-05 contracts; do not infer smart adaptation from a replace menu.

### P2-10 reference

- **Program exploration — Shown:** [V1 4:13–4:29](https://www.youtube.com/watch?v=8ESngufwx6g&t=253s).
- **AI-generated programs — Narrated only:** [V2 11:45–12:00](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=705s).
- **Coach assignments, schedule execution, missed-day changes and adaptive versioning — Not demonstrated.** Keep deferred; use the P2-10/P3/P5 specifications if requested.

### P2-11 reference

- **Any workout / Same Routine — Shown setting:** [V2 5:04–5:15](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=304s); both choices and their explanation are visible around 5:12.
- **Actual result after changing scope — Not demonstrated.** Specify lookup eligibility/missing history and verify fixtures; P6-01 presents the preference.

### P2-12 reference

- **Inline Timer — Setting only:** [V2 5:35–6:12](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=335s); visible text describes a duration-set stopwatch.
- **Smart Superset Scrolling — Setting only:** same [V2 5:35–6:12](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=335s); automatic advancement is not exercised.
- **Superset group — Shown:** [V2 8:17–8:38](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=497s). Group-rest expectation is narrated, not proven. Define timed-set persistence and advancement with P1-02/P2-03.

### P2-13 reference

- **Existing custom exercise/demo — Shown:** [V2 9:58–10:29](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=598s).
- **Primary/secondary muscles + chart/records — Shown:** [V2 10:29–10:44](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=629s).
- **Creation form, upload versus external-link mechanism, editing and privacy enforcement — Not demonstrated.** Choose and document our mechanism; do not assume other people can access the demo. P4-05 owns media protections.

## Video references & Assets

- [V1 review](https://www.youtube.com/watch?v=8ESngufwx6g); use the task-specific timestamp links above. Broad initial-review ranges are superseded by the verified feature index.
- [Routine behaviors](https://www.hevyapp.com/features/gym-routines/), [superset reference](https://www.hevyapp.com/features/what-are-supersets/), [catalogue reference](https://www.hevyapp.com/features/exercise-library/).
- Catalogue instruction/demo production and expert review are planned work; no new assets created.
- [V2 review](https://www.youtube.com/watch?v=CkYBAlBrAAw); exact task/sub-feature scenes above. [Video index](../research/VIDEO_REFERENCE_INDEX.md) records the complete source ledger.

## Next Immediate Action

**Planning only:** write P2-02's modality/unit/set contract with P5-01, then specify P2-01's start/resume/finish/discard state transitions. Do not change the prototype yet.
