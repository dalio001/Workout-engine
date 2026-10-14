# Pillar 5 — Progress, records and explainable intelligence

> **Role:** Turn trustworthy performance data into understandable progress and useful optional next actions. Own metric definitions, charts, record policies, recommendation rules and their evaluation.
>
> **Depends on:** Pillar 0 canonical historical data; Pillar 2 modality/set contracts; Pillar 1 visualization controls; Pillar 4 consent/privacy.
> **Used by:** Pillar 2 accepted prescriptions, Pillar 3 summaries/coach feedback, Pillar 6 premium value, Pillar 7 retention measures.
> **Cross-pillar impacts:** Working-set definition, estimated records, normalization, history edits, program versions, private inputs and costs.

**Current mode — personal progress:** prioritize P5-01/02/03: correct records, detailed history, simple trends and calendar. Private measurements are optional. AI, paid guidance, cohort evaluation and hosted inference are deferred; public phase letters below are future reference.

## Trigger keywords

`Pillar 5`, progress, PR, 1RM, charts, analytics, calendar, measurements, insights, progression, AI.

## Scope

- Movement-specific records, session/exercise trends and consistency.
- Private body metrics/photos and periodic reports.
- Transparent rule-based progression before conversational assistance.
- Equipment/time adaptation recommendations with Pillar 2.
- Offline deterministic summaries; optional hosted inference cannot block logging.

## UI components used from Pillar 1

Date-range selector, accessible charts/tables, record detail, calendar, measurement entry, private photo view, weekly insight card, recommendation comparison/rationale/accept/undo.

## What is built and verified `[x]`

- [x] **Source inspected:** Epley estimate `weight × (1 + reps/30)` used for stored-session record comparison and best exercise estimate (`index.html:975`, `:1022`). No explicit modality/eligibility policy.
- [x] **Runtime checked:** All-time session/volume/set totals and six muscle-group bars render after a synthetic saved set.
- [x] **Absence verified:** No time-range charts, detailed exercise timeline, calendar, body measurements, photos, periodic report or adaptive recommendation engine.

## What is left to do `[ ]`

| ID | Priority / phase | Task and dependencies | Acceptance criteria |
| --- | --- | --- | --- |
| P5-01 | P0 / A–B | Metric dictionary and versioned fixtures; P2-02 | Define valid/working sets, warm-up/drop/failure treatment, canonical volume, per-hand conventions, PR baselines/ties and estimated 1RM eligibility; duration/distance/bodyweight handled separately; high-rep estimates labeled/limited |
| P5-02 | P1 / C | Personal/exercise history and records; P0-07 | Heaviest load, rep-based records, estimated 1RM and set/session volume differentiated; complete timeline and date ranges; corrections/deletes rebuild deterministically; input/display units remain meaningful |
| P5-03 | P1 / C | Calendar, consistency and muscle workload | User timezone/week boundaries explicit; prescribed versus completed work separate; primary/secondary muscle attribution documented; no double-counted totals or claims that set distribution proves recovery |
| P5-04 | P2 / C–D | Private measurements/photos and weekly/monthly reports; P4 privacy | Optional entries with unit/time context; private media access; missing-data states; report values trace to source sets; no fat-loss/health-outcome inference beyond entered data |
| P5-05 | P2 / E | Reviewed progression and constraint rules; P2-09 | Next target cites relevant history/program rule; respect equipment increments and user constraints; no history → ask/offer conservative manual baseline; accept/override/undo; original program recoverable; expert-reviewed cases |
| P5-06 | P2 / E | Conversational analysis as optional interface | Reads authorized structured history; retrieves only permitted records; shows evidence dates/units; generated plan schema validated; proposal preview before application; no invented workout facts or silent writes |
| P5-07 | P0 / before guidance release | Evaluation, rollout and operating costs | Golden cases for missing/conflicting data, unit changes, plateaus, fatigue signals, substitutions and adversarial notes; unsafe/out-of-scope advice rejected; no unauthorized writes; user control, latency/cost limits and rollback flag |
| P5-08 | P2 / E–F | Guidance-value experiment with P7 | Compare transparent rules against manual baseline; helpfulness/acceptance/override and retention measured; report sample size and confounding; don't attribute training outcomes causally without suitable study |

### Recommendation contract

Inputs: selected goals, routine version, eligible recent performance, available equipment/increments, time constraint and voluntarily entered effort/context. Output: suggested target or substitution, evidence, rule/version, uncertainty and an explicit proposed program change.

The engine must not assume that every plateau needs more weight, every missed session needs compensation, or a muscle heat map certifies readiness. Reports distinguish recorded facts from estimates. Pain/injury/medical questions stay outside automated training adjustment and route to appropriate human guidance without diagnosis.

Start with reviewed deterministic progression rules and explain their conditions. An LLM can explain/search/format suggestions after structured validation; it must not own canonical workout calculations or silently modify prescriptions.

### Differentiation boundary

Hevy already describes adaptive programming and conversational training analysis. Our hypothesis is a better combined flow for migrating history, understanding a target and adapting it at the gym. Validate that preference before expanding hosted AI spend. [Hevy Trainer](https://www.hevyapp.com/features/workout-plan-generator/), [Hevy on ChatGPT](https://www.hevyapp.com/features/hevy-chatgpt/).

## Video references & Assets

- [Supplied review](https://www.youtube.com/watch?v=8ESngufwx6g): routine charts at 2:51–3:10; profile duration/volume/reps, measures and calendar at 3:34–4:04.
- [Exercise-performance reference](https://www.hevyapp.com/features/exercise-performance/), [progress reference](https://www.hevyapp.com/features/gym-progress/).
- [../research/HEVY_AUDIT.md](../research/HEVY_AUDIT.md).

## Next Immediate Action

**Planning only:** write P5-01's metric dictionary and example fixtures with Pillar 2. Resolve unit and movement semantics before planning advanced charts or recommendations.
