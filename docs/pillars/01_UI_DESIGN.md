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

| ID | Priority / phase | Task and dependencies | Acceptance criteria |
| --- | --- | --- | --- |
| P1-01 | P1 / A | Journey maps and screen specification; P7-01/P0-01 | Map first workout, returning routine, interrupted session, import, history correction and optional sharing; each screen has explicit states and primary action |
| P1-02 | P0 / B | Logging interaction specification; P2-01/02/03 | Previous/target/actual values distinguishable; numeric input and focus survive adding/completing sets; no horizontal overflow at chosen phone widths; proposed ≤5s median prefilled-set task and ≥90% unaided completion |
| P1-03 | P1 / B | Reusable design tokens and accessible primitives | Original identity, light/dark support, focus styles, dialog labeling/trap/return, usable zoom, adequate contrast, large touch targets and reduced-motion behavior documented and verified |
| P1-04 | P1 / B–C | Picker and exercise-detail journeys; P2-06 | Search + equipment/muscle filters + multi-select; no-result reset; summary/history/how-to detail; returning preserves session input and scroll/focus |
| P1-05 | P1 / C | Onboarding and migration; P0-03/04/P7-02 | New user reaches first routine/session without mandatory social setup; returning user sees import/recovery clearly; storage/account errors are actionable; permission requests appear in context |
| P1-06 | P1 / C | Profile/history/progress layouts; P5-02/03 | Detailed session drilldown, calendar, date range, units, record definition, empty data and accessible chart alternatives; measurements clearly private |
| P1-07 | P2 / D | Community/share/coach interactions; P3/P4-02 | Preview audience and content before publishing; private data excluded; no-friends Home has a useful state; errors and blocked/reported-user states specified |
| P1-08 | P2 / E | Guidance and premium experience; P5-05/P6-03 | Suggested versus observed values clear; rationale/accept/undo available; paywall never interrupts active set completion; cancellation/restore affordances accessible |
| P1-09 | P3 / F | Desktop, localization and device adaptation | Wide-screen planner and keyboard flow; locale decimals/text expansion/units; platform-specific watch/widget designs owned with P4; verified against chosen devices |

### Logging acceptance journey

Open a routine → inspect/choose movement → enter a set → complete it → adjust rest → change an exercise → hide/resume → interrupt/recover → finish → confirm locally saved summary → inspect history. Every transition preserves acknowledged data. This is a future acceptance journey, not an implemented redesign.

Usability testing must use physical target phones, their numeric keyboards, large text, weak connections and tired-hand scenarios. The audit's resized desktop browser is insufficient evidence for mobile readiness.

## Video references & Assets

- [Supplied review](https://www.youtube.com/watch?v=8ESngufwx6g): 0:15 entry, 0:43 picker, 1:12 detail, 1:33 routine editor, 2:16 logger, 2:39 finish, 3:25 Home/Profile.
- [Hevy tutorial](https://www.hevyapp.com/hevy-tutorial/): current illustrated workflow reference.
- [../research/HEVY_AUDIT.md](../research/HEVY_AUDIT.md): original UI audit and reference boundaries.
- Create original icons/demonstrations or obtain licenses; no competitor asset pack is part of this repository.

## Next Immediate Action

**Planning only:** produce P1-01's connected logger journey and state map, then define P1-02's observable usability criteria for the first launch platform.
