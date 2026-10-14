# Working with the pillar roadmap

Read [../AGENTS.md](../AGENTS.md) at startup, then the phase context in [MASTER_PLAN.md](MASTER_PLAN.md), then the pillar owning the requested task. Read another pillar when its interface or dependency is affected. Pointer files prevent separate IDE rule sets from drifting.

## Current session

This is a planning-only setup. Source code and the existing README are unchanged. No new application, framework, backend, account system, test suite, or deployment was created. The user subsequently authorized publishing/merging these documents to GitHub and clarified that personal use is the active scope. Use section 0 of the master plan; public-product work is deferred.

## Choose a focused task

Use a prompt such as:

> Let's work on Pillar 0, P0-01. Produce the architecture and legacy-data migration decisions only. Do not implement yet.

For implementation in a later session:

> Implement P2-01 from Pillar 2. Follow AGENTS.md, preserve existing workout data, verify the acceptance criteria, and update the pillar and progress log.

The task ID identifies scope; the phase and dependencies identify when it is ready. Future implementation needs a new instruction because the original request explicitly excludes building.

## Task states

| State | Meaning |
| --- | --- |
| `[ ]` proposed | Planned; no implementation claimed |
| `[ ]` in progress | Explicitly authorized work has started; add a dated note |
| `[x]` inspected | Current source was inspected; this is not production validation |
| `[x]` runtime checked | A stated workflow was exercised locally |
| `[x]` delivered | Acceptance criteria passed and evidence is linked |

Each pillar distinguishes existing evidence from future work. A checked audit item must not be mistaken for a released product milestone.

## Keep the contract current

1. Confirm the task owner, dependencies, and authorization.
2. Preserve user work and historical data; use an isolated browser context for inspection.
3. Make only the requested change after implementation is authorized.
4. Run the actual project checks. The current repository has no lint, test, or build commands.
5. Update the owning pillar, affected contracts, and [PROGRESS_LOG.md](PROGRESS_LOG.md).
6. Leave a concrete next action. Update phase gates if evidence changes the plan.

Do not create separate user-owned chats, delegate work, or schedule follow-ups unless the user or applicable instructions authorize that action.
