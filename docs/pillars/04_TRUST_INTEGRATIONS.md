# Pillar 4 — Trust, privacy and platform integrations

> **Role:** Protect private training data and make external/device capabilities predictable. Own security policy, consent, moderation boundaries and adapter verification.
>
> **Depends on:** Pillar 0 data contracts and Pillar 2 session/modality contracts; your device requirements. Identity and Pillar 7 launch-market decisions apply to public expansion only.
> **Used by:** Every pillar; especially 3 social/coach access, 5 private insights and 6 account/payment controls.
> **Cross-pillar impacts:** Data visibility, rendering, deletion, media permissions, notifications, account linking, external scopes and reconciliation.

**Current mode — personal basics:** prioritize P4-01 safe imports/rendering and P4-03 timer behavior, plus your export/retention choices. Social moderation, public access controls, launch compliance work and integrations are deferred. Health/watch adapters are optional if useful to you; public phase letters below are future reference.

## Trigger keywords

`Pillar 4`, security, privacy, consent, permissions, moderation, import validation, health, watch, integration.

## Scope

- Safe rendering of local/imported/shared content, strict validation and accountable access control.
- Data inventory, private defaults, exports/deletion and market-specific release review.
- Social/coach permissions, abuse controls and media rights/access lifecycle.
- Mobile background timers/notifications, health adapters, watch clients and later external APIs.
- Define safeguards as product behavior and acceptance criteria, without assuming a particular jurisdiction or claiming legal compliance has been certified.

## UI components used from Pillar 1

Import error/preview; audience selector; permission rationale; consent settings; account deletion; report/block; notification controls; integration status and conflict recovery.

## What is built and verified `[x]`

- [x] **Source inspected:** User and imported names enter string-built `innerHTML`; import trusts parsed JSON before validation. No exploit was run.
- [x] **Absence verified:** No server authorization, consent model, moderation system, OAuth integration, native health or watch project.
- [x] **Source/runtime inspected:** Foreground browser audio beep and interval timer exist; background/native delivery is not established.
- [x] **Reference checked:** Hevy advertises Apple Watch/WearOS and desktop access. This is a product reference, not proof of easy adapter implementation. [Official overview](https://www.hevyapp.com/).

## What is left to do `[ ]`

| ID | Priority / phase | Task and dependencies | Acceptance criteria |
| --- | --- | --- | --- |
| P4-01 | P0 / B | Safe rendering and validation; P0 migration/P2 types | Names/notes rendered as data; strict import schemas, bounds and ID/reference checks before mutation; rejected input leaves original intact; URI/content boundaries documented; meaningful regression fixtures |
| P4-02 | P0 / C–D | Privacy/access model, account and social threat review | Account isolation and private/public/followers/group/coach audiences tested at server/object boundaries; revocation/deletion propagated; default-private measurements/photos; block/report policies enforced beyond UI |
| P4-03 | P1 / B–C | Timer/notification capability matrix | Document foreground, background, locked-screen, killed-process and offline behavior for supported platforms; deadlines remain correct; notification permission refusal does not break logging; no promise of guaranteed background web audio |
| P4-04 | P1 / C | Data governance and launch review; P6 account controls | Data/processor inventory, minimal permissions, retention/export/deletion procedures, launch-market privacy review and incident owner; analytics excludes raw notes/photos/measurements; no compliance claim without review |
| P4-05 | P2 / D | Media permissions and moderation operations; P3 | Owned/licensed exercise assets; private upload/download authorization; size/type checks; sharing strips unintended metadata; deletion/revocation verified; operational report response owner |
| P4-06 | P3 / F | Apple Health / Health Connect pilot | Explicit scopes/consent, availability matrix, disconnect/delete semantics and correct unit mapping; deduplicate source sessions; no inferred medical conclusions; denied permissions handled gracefully |
| P4-07 | P3 / F | Apple Watch then WearOS, ordered by user demand | Versioned offline session/routine payloads; phone/watch concurrent edits and finalization reconcile to one logical workout; locks/permissions/background timing tested on real devices; staged release and rollback |
| P4-08 | P3 / F | Widgets/live activities and optional external adapters | Capability-specific platform review; minimum OAuth scopes, token handling, revocation, rate limits, retries and deduplication; integrations do not become prerequisites to logging |
| P4-09 | P1 / C–F | Release trust review and recovery drills | Access/export/deletion/restore regressions pass; secret/dependency review appropriate to implemented stack; incident triage and user communication procedure; monitor failures without logging sensitive content |

### Threat and failure scenarios to cover

Malformed/oversized backup; stored markup in an exercise name; unauthorized object download; account switch retaining a previous user's data; public summary exposing private notes/photos; repeated publish/payment callback; coach access after revocation; notification revealing a private workout; duplicate phone/watch session; deleted data reappearing through sync.

These are design and verification requirements. No penetration test, jurisdiction-specific compliance assessment or native device trial has already been completed.

### Platform expansion policy

Begin with reliable core data and physical-phone acceptance. Health integration is its own adapter, watch logging is a separate client, and widgets/live activities are separate surfaces. Prioritize by measured device demand and team capacity. A static HTML file with mobile meta tags does not establish native background support.

## Video references & Assets

- [Supplied review](https://www.youtube.com/watch?v=8ESngufwx6g): logger/rest at 2:16–2:39 and optional save/share around 2:39–2:51. It does not demonstrate native watch reconciliation.
- [Hevy platform overview](https://www.hevyapp.com/), [feature index](https://www.hevyapp.com/features/).
- [../research/HEVY_AUDIT.md](../research/HEVY_AUDIT.md): inspected source risks and runtime limits.

## Next Immediate Action

**Planning only:** define P4-01's safe import/rendering contract and P4-02's data audiences with Pillar 0. Defer health/watch implementation until the core acceptance gates pass.
