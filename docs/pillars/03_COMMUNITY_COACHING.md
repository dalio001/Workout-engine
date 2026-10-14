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

| ID | Priority / phase | Task and dependencies | Acceptance criteria |
| --- | --- | --- | --- |
| P3-01 | P2 / C–D | Share routine links before full social feed; P0 identity/versions/P4 audiences | Explicit share preview; private routines remain private; recipient views/copies a versioned snapshot; originals unaffected; revoke/unpublish behavior defined; referral attribution is consent-aware |
| P3-02 | P2 / D | Profile/following/privacy model; P4-02 | Public fields separated from private ones; private-profile requests and removals work; block affects both read and interaction access; no indirect private data leakage through search or notifications |
| P3-03 | P2 / D | Following feed and workout publishing; P2 finalization/P5 summaries | Save succeeds offline without publication; opt-in publish is idempotent; chronological useful feed first; likes/comments respect visibility; edit/delete propagates; no-follows state useful |
| P3-04 | P2 / D | Small accountability groups; P7-04 | Pilot groups of 3–8 users with self-set weekly goals; progress displays adherence rather than unsafe maximal-load contests; invitations/audiences explicit; retained participation measured against nongroup cohorts |
| P3-05 | P2 / D | Notification controls; P4 platform delivery/P6 preferences | Contextual opt-in, quiet hours, per-person/group switches, deduplication and rate limits; deep link works; blocked/private/deleted events cannot leak content |
| P3-06 | P2 / D | Moderation operations; P4-02 | Report/block flows, spam limits, review queue and escalation owner operational before public comments/uploads; abusive content can be removed; action/audit trail with appeal policy documented |
| P3-07 | P3 / E–F | Narrow coach pilot; P2 assignments/P5 summaries | Invite/accept/revoke client access; versioned program assignment; coach sees only granted data; session-linked feedback; permission revocation verified; test with proposed 3 coaches/10–20 clients before broad tooling |
| P3-08 | P3 / F | Program creator discovery and optional integrations | Start only with demonstrated referral/retention value and moderation capacity; quality/content rights and attribution documented; discovery ranking measurable and reversible |

### Behavioral boundaries

Local workout completion is private data storage. Publishing is a separate optional operation and may fail/retry independently. A profile cannot expose body measurements or progress photos merely because it follows a user. Copying a routine copies a snapshot; it does not subscribe the user to silent updates. A coach changing a program creates a proposal/version rather than altering a workout in progress.

The first community experiment is useful accountability and routine sharing. A discovery algorithm, livestreams, general messaging, rankings by maximum load and a trainer marketplace stay outside the initial release scope.

### Evidence gate

Use P7 to compare activation and four-week retention of shared-routine/group cohorts with comparable cohorts. A social feature is successful when it increases repeat training without increasing logging abandonment, privacy incidents or moderation load beyond capacity.

## Video references & Assets

- [Supplied review](https://www.youtube.com/watch?v=8ESngufwx6g): approximately 2:39 sharing celebration; 3:25–3:50 Home/Profile.
- [Hevy social categories](https://www.hevyapp.com/features/): parity reference.
- [Hevy Coach](https://hevycoach.com/): linked official coach product reference; its detailed workflows have not been audited here.
- [../research/HEVY_AUDIT.md](../research/HEVY_AUDIT.md).

## Next Immediate Action

**Deferred for personal use:** no action required. Reopen this pillar only when the user requests sharing, accountability groups or coach collaboration.
