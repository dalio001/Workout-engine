# Pillar 6 — Preferences, account controls and premium value

> **Role:** Let users control their experience and fund the product through tested optional value. Own settings, commercial packaging, subscription state and entitlement behavior.
>
> **Depends on:** Pillar 2 unit/timer contracts, Pillar 1 controls and Pillar 4 input/privacy boundaries for personal preferences. Identity/sync, payments and Pillar 7 price evidence apply to future commercial scope only.
> **Used by:** Pillars 3 coach access, 5 optional premium guidance, 7 business measures.
> **Cross-pillar impacts:** Display units, account switching, consent, deletion/export, paid feature access and platform purchase policies.

**Current mode — preferences only:** P6-01 unit/rest/display preferences is relevant. Personal backups are owned by Pillar 0. Accounts, subscriptions, entitlements, paywalls and coach packages are deferred; public phase letters below are future reference.

## Trigger keywords

`Pillar 6`, settings, units, account, subscription, billing, premium, entitlements, restore purchase.

## Scope

- Display units, theme, timer/audio/haptic preferences, timezone/week start and accessibility choices.
- Identity/profile controls, exports/deletion and integration/notification preferences with Pillar 4.
- Freemium packaging, subscription lifecycle and server-side entitlements.
- Later coach package where pilot evidence warrants it; enterprise multi-tenancy is not initial scope.

## UI components used from Pillar 1

Settings row, preference selector, account linking/recovery, consent/audience controls, export/delete confirmation, premium offer, purchase/restore status and accessible error feedback.

## What is built and verified `[x]`

- [x] **Runtime/source checked:** KG/LBS button, one default-rest setting and JSON backup/restore buttons.
- [x] **Runtime checked:** Unit preference changes labels while retaining the same numeric load; correction belongs to Pillars 0/2 before polished settings.
- [x] **Absence verified:** No account, subscription, paywall, purchase provider or paid entitlement system.

## What is left to do `[ ]`

| ID | Priority / phase | Task and dependencies | Acceptance criteria |
| --- | --- | --- | --- |
| P6-01 | P1 / B–C | Versioned preferences; P2 unit/timer policy | Unit changes only presentation/input interpretation, never historical meaning; timer Off supported; validated bounds; locale decimals/week start; audio/haptics/theme/large-text compatibility; preference sync conflict rule explicit |
| P6-02 | P1 / C | Account/data controls; P0-04/P4-04 | Export and deletion discoverable; guest/account switching safe; permissions/integrations revocable; account recovery verified; deletion retention exceptions disclosed after launch-market review |
| P6-03 | P2 / E | Package and price research; P7-05 | Proposed free reliable logging/history/basic progress/export versus paid guidance/planning tested with retained users; exact prices/limits backed by evidence; recurring service cost model; no retroactive lock of owned data |
| P6-04 | P0 / before paid release | Billing/entitlement architecture; P0 identity/P4 review | Provider/store decisions appropriate to distribution; server validates entitlement; idempotent purchase/callback handling; renewal/expiry/grace/refund/restore cases specified; offline access policy bounded and honest |
| P6-05 | P1 / E | Purchase, restoration and downgrade experience | Duplicate callbacks cannot double grant/charge; device switch restores eligible access; expiry leaves core logger/history/export usable; active workout unaffected; clear retry/status/support paths |
| P6-06 | P2 / E–F | Revenue/cost reporting and offer experiments | Gross-to-net reconciliation; cost by storage/media/AI/support; package cohort analysis; cancellation/refund and purchase failure reported; lifetime offers gated on sustainable economics |
| P6-07 | P3 / F | Coach package and client permission boundaries; P3 pilot | Coach/client relationship permission separated from payment; access revocation works; no pooled user data by default; scope grounded in pilot needs |

### Proposed packaging, still unvalidated

| Layer | Proposed value | Evidence needed |
| --- | --- | --- |
| Free core | Reliable sessions, usable history/basic progress, recovery and export | Activation/retention and sustainable baseline cost |
| Premium | Deeper programming/reporting and useful explainable adaptation | Retained users pay for a real offer; measurable helpfulness |
| Coach pilot | Versioned client programs and session-linked feedback | Coaches/clients use it repeatedly and accept an appropriate price |

Do not choose a price because the reference video shows one. It was uploaded in 2024 and reflects a historical regional offer. Avoid lifetime commitments before recurring costs and support expectations are understood.

### Ownership boundaries

Pillar 0 stores identity and entitlement records; Pillar 4 reviews access/security; this pillar owns the purchase/expiry semantics. UI toggles never grant paid access. Settings do not own workout unit conversion or metric calculations; they invoke the domain contracts.

## Video references & Assets

- [Supplied review](https://www.youtube.com/watch?v=8ESngufwx6g): roughly 3:10–3:25 historical Pro offer; product-value reference only.
- [../MASTER_PLAN.md](../MASTER_PLAN.md): business gates and proposed packaging.
- [../research/HEVY_AUDIT.md](../research/HEVY_AUDIT.md): current preferences and dated pricing boundary.

## Next Immediate Action

**Planning only:** specify P6-01 preferences against the corrected domain unit/timer contract. Keep billing deferred until a retained beta cohort establishes paid value.
