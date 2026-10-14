# Current app and Hevy reference audit

Audit date: **2026-10-14**, Europe/Berlin. This report separates repository evidence, video observations, official product descriptions, and product hypotheses. It supports [../MASTER_PLAN.md](../MASTER_PLAN.md).

## What exists here

The repository starts with `README.md` and a 45,198-byte, 1,262-line `index.html`. The audited branch is `main`; latest commit at inspection was `9fa9955`. There is no frontend framework, backend, package manifest, test runner, linter, CI configuration, service worker, or native app project.

The README names the app **HevyLog Pro**. This is a useful local workout-tracking prototype, not a production competitor yet.

| Capability | Evidence | Status and limit |
| --- | --- | --- |
| Push/Pull/Legs and custom routines | `index.html:565`, `:583`, `:733` | 15 seed exercises, three seed routines; create/delete/start, but no edit, duplicate, folders, targets or scheduling |
| Active logging | `:763`, `:828`, `:879`, `:891`, `:898` | Weight/reps, set types, completion, add set, remove exercise; no set deletion, supersets, per-exercise notes or rest configuration |
| Previous performance | `:750`, `:772` | History lookup by exercise ID and positional set index; needs defined behavior for warm-ups, repeats, substitutions and reordered sets |
| Rest timer | `:911`, `:943` | Interval countdown and audio beep; not a durable deadline or guaranteed background notification |
| Completion/history | `:958`, `:1113` | Completed sets with positive reps become history; summary cards only, no detailed edit/delete/repeat screen |
| Personal records | `:975`, `:1022` | Epley estimated 1RM comparison; no explicit movement-type or set-eligibility policies |
| Stats | `:1153` | All-time counts and six muscle-group bars; no dates, calendar, charts, measurements or photos |
| Units/plates | `:669`, `:1200` | Label toggle and fixed bar/plate lists; units are not attached to historical sets |
| Persistence/backup | `:635`, `:653`, `:1234`, `:1242` | Global browser-local JSON snapshot; no schema version, recovery journal, validated import preview or cross-device sync |

These line references describe the unchanged audited file. Recheck them after implementation moves code.

## Confirmed local runtime findings

An isolated browser context was used, separate from the user's normal app storage. Synthetic workout values were used.

1. Three routines and 15 exercises rendered; routine start displayed the expected set rows.
2. A 100 KG × 5 set was entered and checked. Toggling units displayed **100 LBS**, with the number still 100. The save contained no workout/set unit provenance. Switching back likewise relabeled history. This proves a meaning error, not a rounding issue.
3. Finishing saved one completed set and a volume summary of 500, and previous performance returned the saved weight/reps.
4. Starting another workout and reloading reset `activeWorkout` to `null`, while the completed history remained. This confirms that drafts are not persisted.
5. Read-only DOM inspection found a viewport disabling user zoom and modal containers without dialog roles or `aria-modal`. Accessibility needs design and interaction testing.

Desktop Chromium inspection does not verify physical-phone keyboards, screen-reader behavior, background execution, notifications, native watches, or production performance. The browser's minimum window width also prevented a true 390px device test; mobile acceptance testing remains planned.

## Source-inspected risks, not exercised exploits

| Priority | Finding | Why it matters | Owner |
| --- | --- | --- | --- |
| Critical | `activeWorkout` is outside saved state | Reload/tab termination loses the session | P0-02, P2-01 |
| Critical | Global unit label; no per-set units | Mixed-unit historical meaning is ambiguous | P0-03, P2-02 |
| High | Import replaces `state` before validating, then saves before `init()` completes | A malformed backup can overwrite a valid state; no rollback preview | P0-03, P4-01 |
| High | Custom/imported text is interpolated into `innerHTML` and inline handlers | Requires safe rendering and strict validation before sharing or synced data | P4-01 |
| High | Starting a new routine directly replaces `activeWorkout` | An unfinished workout can be replaced without an explicit conflict flow | P2-01 |
| Medium | Timer decrements on callbacks | Background throttling can drift; elapsed time already uses timestamps | P2-03, P4-03 |
| Medium | Empty exercise/routine arrays are reseeded by `init()` | Intentional deletion of all items is not distinguished from first run | P0-03 |
| Medium | Every movement uses weight/reps and a 1RM formula | Duration, distance, bodyweight and assisted movements need separate semantics | P2-02, P5-01 |
| Medium | History summarizes “best” as weight × reps | This differs from heaviest weight and estimated 1RM; label and metric policy needed | P5-01 |
| Medium | No save/quota error handling or migration version | Durability cannot be assumed on storage failure | P0-02, P0-03 |
| Medium | Hard-coded plates; unreported remainder | Target loads may not be achievable; actual load must be shown | P2-05 |

No exploit payload, destructive import, load test, or production security audit was run. The optional empty-data import runtime test was blocked by automatic approval review because it would overwrite browser storage; the associated finding rests on source code.

## The supplied video: what was watched

[Hevy App Review — Important Things To Know](https://www.youtube.com/watch?v=8ESngufwx6g), **Knowledge By Marcus**, uploaded **2024-12-04**, approximately **4:35**. Review method: native English captions plus 32 frames across the full video, inspected chronologically in four contact sheets. Timestamp ranges below are approximate visual landmarks aligned with captions. This is a sampled visual review, not a frame-by-frame playback.

| Time | Observed interaction | Roadmap implication |
| --- | --- | --- |
| [0:15–0:43](https://www.youtube.com/watch?v=8ESngufwx6g&t=15s) | Workout screen: quick start, routine cards, new routine, explore, resume/discard bar | Familiar workout-first entry and persistent resume |
| [0:43–1:12](https://www.youtube.com/watch?v=8ESngufwx6g&t=43s) | Exercise selection uses equipment and muscle filters | Search, filters and multi-select picker |
| [1:12–1:33](https://www.youtube.com/watch?v=8ESngufwx6g&t=72s) | Exercise detail includes demonstration, summary and history | Movement education and performance in one detail screen |
| [1:33–2:05](https://www.youtube.com/watch?v=8ESngufwx6g&t=93s) | Routine editor has sets, notes and individual rest settings | Complete reusable prescription editor |
| [2:05–2:39](https://www.youtube.com/watch?v=8ESngufwx6g&t=125s) | Start routine, enter load/reps, check set, automatic adjustable rest | Core logger acceptance journey |
| [2:39–2:51](https://www.youtube.com/watch?v=8ESngufwx6g&t=159s) | Finish/save sequence and celebratory sharing screen | Separate durable save, summary and optional publish |
| [2:51–3:25](https://www.youtube.com/watch?v=8ESngufwx6g&t=171s) | Routine volume/reps/duration chart and historical Pro offer | Understandable progress and contextual premium value |
| [3:25–4:04](https://www.youtube.com/watch?v=8ESngufwx6g&t=205s) | Home feed, profile statistics, measures and calendar | Social home and nested personal dashboards |
| [4:09–4:29](https://www.youtube.com/watch?v=8ESngufwx6g&t=249s) | Explore programs with filters and routine previews | Curated program discovery |

The reviewer praises ease of use. One review is qualitative reference material, not evidence of market-wide demand. Visible 2024 prices and program counts are historical observations, not current pricing or catalogue commitments.

## Current official Hevy benchmark

The following summaries were verified on official pages on the audit date. They are concise descriptions, not a complete specification.

| Official source | Verified product facts | Implication |
| --- | --- | --- |
| [Hevy homepage](https://www.hevyapp.com/) | Mobile logging, progress and social workflows; desktop planning; Apple Watch and WearOS routines/offline logging | A competitive destination spans devices, not only a static web page |
| [Feature index](https://www.hevyapp.com/features/) | Lists advanced logging, progress, social, coaching, widgets, integrations and programming | Keep a parity checklist with deliberate release priorities |
| [Routine workflow](https://www.hevyapp.com/features/gym-routines/) | Folders, prescriptions, notes, supersets, routine duplication and optional template updates after a workout | Model routine versions separately from actual sessions |
| [Exercise library](https://www.hevyapp.com/features/exercise-library/) | Catalogue browsing and movement information | Build owned/licensed content and structured metadata |
| [Exercise performance](https://www.hevyapp.com/features/exercise-performance/) | Movement-specific records, including load/reps, time and history | Do not apply one calculation to every exercise |
| [Progress tracking](https://www.hevyapp.com/features/gym-progress/) | Personal training data and body composition tracking | Private progress dashboard with clearly defined metrics |
| [Hevy Trainer](https://www.hevyapp.com/features/workout-plan-generator/) | Adaptive programs consider goals, equipment, experience and schedule; adjust training guidance | Generic automated plans already have competition |
| [Hevy on ChatGPT](https://www.hevyapp.com/features/hevy-chatgpt/) | Plan generation, history analysis and personalized suggestions through an account connection | A chat assistant alone is not a unique selling point |

Feature availability can vary by platform and plan. Recheck relevant pages and physical-device behavior before implementation decisions. No paid account or current native Hevy installation was inspected.

## Wider competitive context

| Product | Verified position from official material | Strategic consequence |
| --- | --- | --- |
| [Strong](https://www.strong.app/) | Simple tracking, progress, cloud/device access, exports and advanced logging | Logging and data ownership are baseline expectations |
| [Fitbod](https://fitbod.me/) | Customized strength workouts using goals, experience, equipment and adaptive algorithms | Personalization is a crowded proposition |
| [Liftosaur](https://www.liftosaur.com/) | Programmable training plans with progression rules | Advanced programmability has an existing specialist |

**Inference:** pursue a combined experience of fast logging, transparent progression, easy migration, and useful accountability. Its value and willingness to pay are unvalidated. The roadmap includes interviews and cohort experiments to test it; this report does not claim competitors lack these capabilities.

## Technical reference

[Expo SQLite documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/) confirms durable databases across app restarts. This supports evaluating SQLite for a future native client. It does not prove cloud synchronization, reliable notifications, watch support, or effortless web parity; those remain separate architecture decisions.

## Evidence boundaries

No user interviews, competitor usability trial, market-size study, revenue validation, fitness-outcome study, or load benchmark was conducted. Targets and schedules in the master plan are proposals. Original app files remain unchanged; downloaded review media is temporary research material and is not redistributed in this repository.
