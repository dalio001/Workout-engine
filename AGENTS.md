# AGENTS.md — Workout Engine agent contract

This is the shared source of project rules for Codex, Claude, Gemini, Cursor, and Windsurf. Read [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md) for product direction and [docs/WORKFLOW.md](docs/WORKFLOW.md) for the workflow.

## Current authorization

The 2026-10-14 request authorizes inspection, competitor research, a roadmap, pillar documents, and agent governance. **Do not implement features, restructure application code, install project dependencies, provision services, or deploy as part of this planning task.** A later request to implement a defined item can authorize that work.

The user subsequently authorized committing, pushing and merging these documents into the GitHub repository. This authorizes documentation publication, not feature implementation. The user also clarified that **personal use is the current scope**. Follow the personal-use sequence in the master plan; public beta, community, coaching, billing and growth are optional future scope, not current requirements.

## graphify

- Use the installed graphify skill when the user types `/graphify`.
- Read its installed `SKILL.md` before doing anything else for that command. The user's referenced location is `~/.Codex/skills/graphify/SKILL.md`; the available installation may be under `~/.agents/skills/graphify/SKILL.md`.

## Pillar Documentation Update Protocol

Every agent working on this project must follow this protocol:

1. Update the pillar owning each completed task, bug fix, or feature. The active pillars are:

   | Pillar | File | Owns |
   | --- | --- | --- |
   | 0 | [00_CORE_ARCHITECTURE.md](docs/pillars/00_CORE_ARCHITECTURE.md) | Architecture, persistence, migration, identity, sync, delivery infrastructure |
   | 1 | [01_UI_DESIGN.md](docs/pillars/01_UI_DESIGN.md) | Navigation, screens, design system, accessibility, interaction quality |
   | 2 | [02_WORKOUT_ENGINE.md](docs/pillars/02_WORKOUT_ENGINE.md) | Sessions, routines, exercise catalogue, logging, timers, training rules |
   | 3 | [03_COMMUNITY_COACHING.md](docs/pillars/03_COMMUNITY_COACHING.md) | Sharing, social graph, accountability groups, coach relationships |
   | 4 | [04_TRUST_INTEGRATIONS.md](docs/pillars/04_TRUST_INTEGRATIONS.md) | Security, privacy, moderation, media permissions, health and watch adapters |
   | 5 | [05_PROGRESS_INTELLIGENCE.md](docs/pillars/05_PROGRESS_INTELLIGENCE.md) | Metric definitions, records, charts, progress reports, adaptive suggestions |
   | 6 | [06_SETTINGS_BILLING.md](docs/pillars/06_SETTINGS_BILLING.md) | Preferences, subscriptions, entitlements, account controls |
   | 7 | [07_DISTRIBUTION_GROWTH.md](docs/pillars/07_DISTRIBUTION_GROWTH.md) | Customer research, acquisition, activation, retention, business experiments |

2. Mark `[x]` only after the stated acceptance criteria have been met. Distinguish source inspection, runtime checks, and production verification. Planned work stays `[ ]`.
3. Add new work as `[ ]` with a stable pillar task ID, priority, dependencies, and a concrete outcome. Record changed assumptions explicitly.
4. Preserve relevant video URLs, timestamps, and asset references in the task and the pillar's Video references & Assets section.
5. Keep a concrete **Next Immediate Action** at the bottom of the pillar. Respect the current planning-only authorization.
6. Keep pillar ownership isolated. Update another pillar only when the task changes its dependencies, shared contracts, or UI components, and cross-reference both.
7. Update [docs/PROGRESS_LOG.md](docs/PROGRESS_LOG.md), newest first, with the date and a short account of the completed work and evidence.
8. Update the master plan when sequencing, release scope, success criteria, or decisions change. It is the source for phase order; pillar files own task details.

## Engineering rules and detected environment

- **Audited branch:** `main`, with a clean working tree before the documentation session. Publish the documentation through a `codex/<topic>` branch and pull request into `main`. Future implementation should also use a `codex/<topic>` branch unless the user specifies another branch; keep stable branches clean.
- **Current runtime:** one self-contained `index.html`, vanilla HTML/CSS/JavaScript, browser `localStorage`. Open the file in a browser; there is no package manager or build step.
- **Lint:** not configured. Do not claim `npm run lint` exists.
- **Automated tests:** not configured. Do not claim `npm test` exists.
- **Build:** not applicable to the current static file. Do not claim a build passed.
- Before future code work, establish the real lint/test/typecheck/build commands through P0-06 and record them here. Once established, all applicable commands must pass for a code-changing session.
- Until then, future code changes require targeted browser checks of affected workflows and meaningful regression checks for persistence, units, timers, imports, or metrics when affected. Document exactly what was checked.
- Schema changes require a versioned migration, fixtures for old data, preservation of the original backup, and a rollback/recovery strategy.
- Preserve the meaning of historical loads. The legacy backup has no per-set units; mixed-unit history cannot be silently reconstructed with certainty.
- Workout saves must be durable and idempotent. Analytics and social publishing must not block local workout completion.
- Use conventional commit messages when a commit is requested: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
- Do not commit, push, deploy, or contact users as an automatic consequence of creating roadmap documents.

## Product invariants

- Match the usability of the Hevy reference workflows while developing an original product name, visual identity, and owned or licensed assets.
- Prioritize accurate, recoverable workout data and fast logging before social features or AI.
- Sharing is an explicit action with a visible audience. Body measurements and progress photos are private by default in the proposed product.
- Show the difference between observed performance and estimated or suggested values. Never present estimated 1RM as a verified maximum.
- Training recommendations are explainable, optional, and reversible; no silent routine changes.
- Client preferences do not enforce account authorization or paid entitlements; those need server-side controls when introduced.
