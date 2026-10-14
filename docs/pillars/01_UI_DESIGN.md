# Pillar 1 — Product journeys and UI foundations

> **Role:** Deliver the clarity and logging speed of the Hevy reference with an original design system. Own screen structure, reusable controls, accessibility and interaction acceptance.
>
> **Depends on:** Your personal phone/workflow needs; Pillars 0/2 state and modality contracts; Pillar 4 privacy boundaries. Pillar 7 customer evidence is deferred.
> **Used by:** Pillars 2, 3, 5 and 6; Pillar 4 device experiences.
> **Cross-pillar impacts:** Navigation, focus, validation, save feedback, sharing confirmation, charts and account controls.

**Current mode — personal use:** prioritize P1-01/02/03/04 and personal history layouts from P1-06. Keep Workout/History/Exercises/Profile useful; social Home, public onboarding, premium flows and broad localization are deferred. Public phase letters below are future reference.

## Trigger keywords

`Pillar 1`, UI, UX, navigation, screens, design system, accessibility, onboarding, logger.

## Scope

- Hevy-familiar journeys: quick start → routine/picker → logging → rest → finish → progress.
- Proposed destination navigation: Home / Workout / Profile; Workout is the useful initial entry before community.
- Original brand, tokens, typography, icons, themes and responsive web planning layouts.
- Complete loading, empty, offline, error, unsaved, conflict, recovery and success states.
- Accessibility and physical-device usability; restrained motion and optional feedback.

## Shared UI components owned here

Workout/routine card; exercise row and multi-select picker; equipment/muscle filter; modality-aware set row; set-type menu; numeric entry; rest control; active-session bar; bottom sheet/dialog; import preview; chart with text alternative; privacy/audience selector; summary card; account/settings rows; premium offer.

Keep the logger free of social/premium interruptions. Advanced fields appear when useful, without hiding basic values or making completion unclear.

## What is built and verified `[x]`

- [x] **Source inspected:** CSS variables, dark card layout, four tabs, active drawer, minimized bar and four modal containers.
- [x] **Runtime checked:** Routine cards and active set-table controls render in Chromium; logging and finish/history flow exercised.
- [x] **Read-only inspection:** Viewport disables user zoom; modal containers lack dialog semantics. Phone keyboard/focus and screen-reader behavior remain untested.
- [x] **Reference reviewed:** Supplied video shows three-tab navigation and connected exercise/routine/logging/progress workflows. No redesign implemented.

## What is left to do `[ ]`

| ID | Priority / phase | Task and dependencies | Acceptance criteria | Feature references |
| --- | --- | --- | --- | --- |
| P1-01 | P1 / A | Journey maps and screen specification; P7-01/P0-01 | Map first workout, returning routine, interrupted session, import, history correction and optional sharing; each screen has explicit states and primary action | [Clips / evidence](#p1-01-reference) |
| P1-02 | P0 / B | Logging interaction specification; P2-01/02/03 | Previous/target/actual values distinguishable; numeric input and focus survive adding/completing sets; no horizontal overflow at chosen phone widths; proposed ≤5s median prefilled-set task and ≥90% unaided completion | [Clips / evidence](#p1-02-reference) |
| P1-03 | P1 / B | Reusable design tokens and accessible primitives | Original identity, light/dark support, focus styles, dialog labeling/trap/return, usable zoom, adequate contrast, large touch targets and reduced-motion behavior documented and verified | [Clips / evidence](#p1-03-reference) |
| P1-04 | P1 / B–C | Picker and exercise-detail journeys; P2-06 | Search + equipment/muscle filters + multi-select; no-result reset; summary/history/how-to detail; returning preserves session input and scroll/focus | [Clips / evidence](#p1-04-reference) |
| P1-05 | P1 / C | Onboarding and migration; P0-03/04/P7-02 | New user reaches first routine/session without mandatory social setup; returning user sees import/recovery clearly; storage/account errors are actionable; permission requests appear in context | [Clips / evidence](#p1-05-reference) |
| P1-06 | P1 / C | Profile/history/progress layouts; P5-02/03 | Detailed session drilldown, calendar, date range, units, record definition, empty data and accessible chart alternatives; measurements clearly private | [Clips / evidence](#p1-06-reference) |
| P1-07 | P2 / D | Community/share/coach interactions; P3/P4-02 | Preview audience and content before publishing; private data excluded; no-friends Home has a useful state; errors and blocked/reported-user states specified | [Clips / evidence](#p1-07-reference) |
| P1-08 | P2 / E | Guidance and premium experience; P5-05/P6-03 | Suggested versus observed values clear; rationale/accept/undo available; paywall never interrupts active set completion; cancellation/restore affordances accessible | [Clips / evidence](#p1-08-reference) |
| P1-09 | P3 / F | Desktop, localization and device adaptation | Wide-screen planner and keyboard flow; locale decimals/text expansion/units; platform-specific watch/widget designs owned with P4; verified against chosen devices | [Clips / evidence](#p1-09-reference) |

### PLZ FitZone rename + installability (2026-10-14)

- [ ] in progress, awaiting owner phone check — PLZ FitZone identity (supports P1-03 original identity): header logo is two-tone `PLZ` (accent blue) + `FitZone` (white), `<title>`/README/backup prefix renamed, original navy/FZ/blue-accent icons in `icons/`. No workout logic changed. Owner to verify on Android Chrome: header renders two-tone, install prompt/icon look right.

### Logging acceptance journey

Open a routine → inspect/choose movement → enter a set → complete it → adjust rest → change an exercise → hide/resume → interrupt/recover → finish → confirm locally saved summary → inspect history. Every transition preserves acknowledged data. This is a future acceptance journey, not an implemented redesign.

Usability testing must use physical target phones, their numeric keyboards, large text, weak connections and tired-hand scenarios. The audit's resized desktop browser is insufficient evidence for mobile readiness.

## Feature reference map

See the [video index](../research/VIDEO_REFERENCE_INDEX.md) for source IDs and evidence labels. A visual example does not verify accessibility, performance or recovery criteria.

### P1-01 reference

- **Workout entry/routine cards — Shown:** [V1 0:15–0:43](https://www.youtube.com/watch?v=8ESngufwx6g&t=15s).
- **New routine — Shown:** [V1 0:44–0:52](https://www.youtube.com/watch?v=8ESngufwx6g&t=44s).
- **Resume conflict — Shown:** [V1 2:12–2:18](https://www.youtube.com/watch?v=8ESngufwx6g&t=132s).
- **Finish review — Shown:** [V1 2:40–2:49](https://www.youtube.com/watch?v=8ESngufwx6g&t=160s). First-run onboarding, recovery after process loss and import journeys are not demonstrated; specify from the audit.

### P1-02 reference

- **Numeric entry/checkmarks — Shown:** [V1 2:18–2:39](https://www.youtube.com/watch?v=8ESngufwx6g&t=138s).
- **Foreground rest/adjust/skip — Shown:** [V1 2:24–2:39](https://www.youtube.com/watch?v=8ESngufwx6g&t=144s).
- **Check-set feedback — Setting only:** [V2 4:24–4:40](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=264s).
- **Keep-awake — Setting only:** [V2 5:15–5:21](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=315s); P4-10 owns capability behavior.
- **Smart superset scrolling/inline timer — Settings only:** [V2 5:35–6:12](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=335s); runtime belongs to P2-12. Focus retention, target-device usability and timing goals are our requirements, not measured video results.

### P1-03 reference

- **Theme selection — Shown:** [V2 3:40–3:49](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=220s).
- **Set-type help sheet — Shown:** [V2 7:22–7:49](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=442s).
- **Original tokens/branding, screen-reader semantics, zoom/focus/reduced motion — Not demonstrated.** Use the [accessibility/source audit](../research/HEVY_AUDIT.md) and P1-03 acceptance criteria.

### P1-04 reference

- **Equipment/muscle filtering — Shown:** [V1 0:50–1:13](https://www.youtube.com/watch?v=8ESngufwx6g&t=50s).
- **Summary/history/how-to/demo detail — Shown:** [V1 1:14–1:34](https://www.youtube.com/watch?v=8ESngufwx6g&t=74s).
- **Multi-add — Shown:** [V1 1:30–1:42](https://www.youtube.com/watch?v=8ESngufwx6g&t=90s).
- **Recent exercises — Shown:** [V2 6:50–7:14](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=410s). No-result recovery and returning focus/data retention need our specification.

### P1-05 reference

- **First-run onboarding/import/recovery — Not demonstrated in V1/V2.** Both recordings use existing accounts. Use the [personal milestones](../MASTER_PLAN.md) and P0-03/04 criteria.
- **Related workout start affordance only:** [V1 0:15–0:43](https://www.youtube.com/watch?v=8ESngufwx6g&t=15s); this is not evidence of an onboarding flow.

### P1-06 reference

- **Routine progress chart — Shown:** [V1 2:51–3:10](https://www.youtube.com/watch?v=8ESngufwx6g&t=171s).
- **Workout detail — Shown:** [V2 2:35–2:56](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=155s).
- **Exercise records — Shown:** [V2 2:52–3:12](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=172s).
- **Profile chart + Measures/Calendar buttons — Mixed:** [V1 3:38–3:53](https://www.youtube.com/watch?v=8ESngufwx6g&t=218s); charts shown, measurement/calendar interiors not opened. Accessible alternatives and correction flows need our design.

### P1-07 reference

- **Private-profile/default-audience controls — Shown settings:** [V2 3:14–3:34](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=194s).
- **Feed/likes/comments — Shown:** [V2 8:42–9:10](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=522s).
- **Coach UI, report/block and error states — Not demonstrated.** Specify through P3/P4; all remain deferred for personal use.

### P1-08 reference

- **Premium offer UI — Shown:** [V2 10:46–11:44](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=646s); recorded offer only.
- **AI connection — Entry point only:** [V2 3:54–4:08](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=234s).
- **Suggested-target rationale/accept/undo, purchase restoration and cancellation flows — Not demonstrated.** Use P5-05/P6 contracts; no paywall needed for personal use.

### P1-09 reference

- **Desktop planner/localization/watch/widget layouts — Not demonstrated in V1/V2.** Product context: [official platform overview](https://www.hevyapp.com/). Design only when the owner requests the corresponding platform.

## Video references & Assets

- [V1 review](https://www.youtube.com/watch?v=8ESngufwx6g); use the task-specific timestamp links above. Broad initial-review ranges are superseded by the verified feature index.
- [Hevy tutorial](https://www.hevyapp.com/hevy-tutorial/): current illustrated workflow reference.
- [../research/HEVY_AUDIT.md](../research/HEVY_AUDIT.md): original UI audit and reference boundaries.
- Create original icons/demonstrations or obtain licenses; no competitor asset pack is part of this repository.
- [V2 review](https://www.youtube.com/watch?v=CkYBAlBrAAw); use the task-specific scene links above and [video index](../research/VIDEO_REFERENCE_INDEX.md).

## Next Immediate Action

**Planning only:** produce P1-01's connected logger journey and state map, then define P1-02's observable usability criteria for the first launch platform.
