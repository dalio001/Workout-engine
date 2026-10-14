# Pillar 3 — Community, accountability and coaching

> **Role:** Help people return to training through useful relationships. Own deliberate workout/routine sharing, community entities and coach collaboration without coupling them to local session saving.
>
> **Depends on:** Pillar 0 identity/sync; Pillar 1 shared UI; Pillar 2 reliable workouts; Pillar 4 privacy/moderation; Pillar 5 trusted summaries.
> **Used by:** Pillar 7 referrals/retention and Pillar 6 future coach entitlements.
> **Cross-pillar impacts:** Publication visibility, consent, notifications, program assignment versions and media lifecycle.

**Current mode — deferred:** personal use requires none of this pillar. Keep the task list as future reference; no feed, public profiles, groups, coach tooling or sharing infrastructure is a current dependency.

## Trigger keywords

`Pillar 3`, feed, friends, follow, share, groups, accountability, coach, trainer, comments.

## Scope

- Public profile and social graph separate from private account/workout data.
- Shareable routine/program snapshots, optional workout publications and copying with attribution/versioning.
- Following feed, reactions/comments, small groups and user-controlled notifications.
- Later coach invitations, assignments and session-linked feedback.
- No enterprise CRM, generic inbox, chat platform or marketplace required for early releases.

## UI components used from Pillar 1

Profile card, workout publication card, routine preview/copy, audience confirmation, reactions/comments, group progress, report/block flow and assignment comparison.

## What is built and verified `[x]`

- [x] **Absence verified from repository:** No account, social graph, publication, feed, messaging, groups or coach tools exist.
- [x] **Reference reviewed:** The supplied video's Home/Profile portions show social context; official Hevy material also includes coaching. This is research completion, not a built community feature.

## What is left to do `[ ]`

| ID | Priority / phase | Task and dependencies | Acceptance criteria | Feature references |
| --- | --- | --- | --- | --- |
| P3-01 | P2 / C–D | Share routine links before full social feed; P0 identity/versions/P4 audiences | Explicit share preview; private routines remain private; recipient views/copies a versioned snapshot; originals unaffected; revoke/unpublish behavior defined; referral attribution is consent-aware | [Clips / evidence](#p3-01-reference) |
| P3-02 | P2 / D | Profile/following/privacy model; P4-02 | Public fields separated from private ones; private-profile requests and removals work; block affects both read and interaction access; no indirect private data leakage through search or notifications | [Clips / evidence](#p3-02-reference) |
| P3-03 | P2 / D | Following feed and workout publishing; P2 finalization/P5 summaries | Save succeeds offline without publication; opt-in publish is idempotent; chronological useful feed first; likes/comments respect visibility; edit/delete propagates; no-follows state useful | [Clips / evidence](#p3-03-reference) |
| P3-04 | P2 / D | Small accountability groups; P7-04 | Pilot groups of 3–8 users with self-set weekly goals; progress displays adherence rather than unsafe maximal-load contests; invitations/audiences explicit; retained participation measured against nongroup cohorts | [Clips / evidence](#p3-04-reference) |
| P3-05 | P2 / D | Notification controls; P4 platform delivery/P6 preferences | Contextual opt-in, quiet hours, per-person/group switches, deduplication and rate limits; deep link works; blocked/private/deleted events cannot leak content | [Clips / evidence](#p3-05-reference) |
| P3-06 | P2 / D | Moderation operations; P4-02 | Report/block flows, spam limits, review queue and escalation owner operational before public comments/uploads; abusive content can be removed; action/audit trail with appeal policy documented | [Clips / evidence](#p3-06-reference) |
| P3-07 | P3 / E–F | Narrow coach pilot; P2 assignments/P5 summaries | Invite/accept/revoke client access; versioned program assignment; coach sees only granted data; session-linked feedback; permission revocation verified; test with proposed 3 coaches/10–20 clients before broad tooling | [Clips / evidence](#p3-07-reference) |
| P3-08 | P3 / F | Program creator discovery and optional integrations | Start only with demonstrated referral/retention value and moderation capacity; quality/content rights and attribution documented; discovery ranking measurable and reversible | [Clips / evidence](#p3-08-reference) |

### Behavioral boundaries

Local workout completion is private data storage. Publishing is a separate optional operation and may fail/retry independently. A profile cannot expose body measurements or progress photos merely because it follows a user. Copying a routine copies a snapshot; it does not subscribe the user to silent updates. A coach changing a program creates a proposal/version rather than altering a workout in progress.

The first community experiment is useful accountability and routine sharing. A discovery algorithm, livestreams, general messaging, rankings by maximum load and a trainer marketplace stay outside the initial release scope.

### Evidence gate

Use P7 to compare activation and four-week retention of shared-routine/group cohorts with comparable cohorts. A social feature is successful when it increases repeat training without increasing logging abandonment, privacy incidents or moderation load beyond capacity.

## Feature reference map

This pillar remains deferred for personal use. Source IDs and evidence labels: [video index](../research/VIDEO_REFERENCE_INDEX.md).

### P3-01 reference

- **Routine share icon — Entry point only:** [V1 2:51–3:10](https://www.youtube.com/watch?v=8ESngufwx6g&t=171s), top-right of the routine screen.
- **Routine link delivery, recipient copy, attribution, revocation and versioning — Not demonstrated.** Use [official routine-sharing context](https://www.hevyapp.com/features/gym-routines/) and P3-01's proposed contract.

### P3-02 reference

- **Profile editing/public versus private fields — Shown:** [V2 6:18–6:35](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=378s).
- **Private profile/default visibility/Hide Suggested Users — Settings shown:** [V2 3:14–3:34](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=194s).
- **Suggested athletes/following context — Shown:** [V2 8:42–9:10](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=522s). Requests, block/revoke and backend access enforcement are not exercised.

### P3-03 reference

- **Save-review description/media/audience entry — Shown screen:** [V1 2:40–2:49](https://www.youtube.com/watch?v=8ESngufwx6g&t=160s).
- **Feed, likes/comments — Shown:** [V2 8:42–9:10](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=522s).
- **Posted workout photo — Shown:** [V2 9:06–9:20](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=546s).
- **Offline publication queue, edit/delete propagation and private-save separation — Not demonstrated.** Use our publication/data contracts.

### P3-04 reference

- **Accountability groups and shared weekly goals — Not demonstrated in V1/V2.** These are our proposed experiments in P3-04/P7-04, not a feature evidenced by a friends feed.

### P3-05 reference

- **Notifications settings and Home bell — Entry points only:** [V2 3:51–3:56](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=231s) and [V2 8:42–9:10](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=522s).
- **Quiet hours, per-person/group controls, delivery/deduplication and privacy — Not demonstrated.** Use P3-05/P4/P6 specifications.

### P3-06 reference

- **Report/block/moderation operations — Not demonstrated in V1/V2.** Use P3-06/P4-02 criteria. Visible comments at [V2 8:42–9:10](https://www.youtube.com/watch?v=CkYBAlBrAAw&t=522s) are content context only, not moderation evidence.

### P3-07 reference

- **Coach invitations, assignments, permissions and feedback — Not demonstrated in V1/V2.** Reviewer references to clients do not show a coach product. [Hevy Coach](https://hevycoach.com/) is official product context whose detailed workflow still needs a separate audit if requested.

### P3-08 reference

- **Curated program catalogue — Shown:** [V1 4:13–4:29](https://www.youtube.com/watch?v=8ESngufwx6g&t=253s).
- **Creator publishing/discovery rankings/licensing/marketplace — Not demonstrated.** Do not infer creator infrastructure from a curated list; use P3-08/P7 experiment decisions.

## Video references & Assets

- [V1 review](https://www.youtube.com/watch?v=8ESngufwx6g); use the task-specific timestamp links above. Broad initial-review ranges are superseded by the verified feature index.
- [Hevy social categories](https://www.hevyapp.com/features/): parity reference.
- [Hevy Coach](https://hevycoach.com/): linked official coach product reference; its detailed workflows have not been audited here.
- [../research/HEVY_AUDIT.md](../research/HEVY_AUDIT.md).
- [V2 review](https://www.youtube.com/watch?v=CkYBAlBrAAw) and [video index](../research/VIDEO_REFERENCE_INDEX.md); use the task-specific links above.

## Next Immediate Action

**Deferred for personal use:** no action required. Reopen this pillar only when the user requests sharing, accountability groups or coach collaboration.
