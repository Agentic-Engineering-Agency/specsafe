# SpecSafe Agent Rules

This repository builds the SpecSafe CLI and canonical planning, TDD, verification, and tool-adapter workflows used by AI-assisted projects.

Workspace standards apply here: [../docs/standards/README.md](../docs/standards/README.md).
This file adds only what is specific to this repo. Where they conflict, this file wins, and the conflict is recorded under `## Deviations`.

## Stack

- Language / runtime: TypeScript ES modules on Node.js 18 or newer.
- Framework / platform: Commander CLI, Clack prompts, and Vitest; tool adapters generate harness-specific files from canonical skills and rules.
- Package manager: pnpm 10 workspace (`generators/` is the workspace package).

## Non-negotiables

- Treat `canonical/skills/`, `canonical/personas/`, `canonical/rules/`, and `canonical/templates/` as the source for generated tool integrations; fix canonical content rather than patching one generated adapter output.
- Preserve skill frontmatter, workflow preconditions, guardrails, handoffs, and state changes when adding or changing a canonical skill.
- Keep the two-phase contract intact: planning reaches readiness before development; development proceeds spec, tests, implementation, verify/QA, then human-approved completion.
- Keep adapter writes contained under the target project root and preserve tool-specific user configuration where the adapter is designed to merge it.
- Do not move this repository's managed specs into a workspace-style feature tree; SpecSafe owns their lifecycle under `specs/active/`, `specs/completed/`, and `specs/archive/`.

## Commands

| Purpose | Command |
|---|---|
| Install | `pnpm install` |
| Build | `pnpm build` |
| Test | `pnpm test` |
| Typecheck | `pnpm typecheck` |

## Verification gates

- Required for CLI, adapter, or canonical workflow changes: `pnpm test` and `pnpm typecheck`.
- Required for release: `pnpm test`, `pnpm typecheck`, and `pnpm build`.
- Adapter changes must exercise the affected generated paths and prove path containment and preservation behavior where applicable.
- Documentation-only changes must remain consistent with `docs/SPECSAFE-CANONICAL-WORKFLOW.md` and the generated canonical rules.

## Read order

1. `README.md`
2. `docs/SPECSAFE-CANONICAL-WORKFLOW.md`
3. `CONTRIBUTING.md`
4. The affected source under `canonical/`
5. The corresponding adapter or CLI implementation and tests under `generators/`
6. The active spec under `specs/active/`, when the change belongs to one

## Scope discipline

- Default to the smallest valuable spec slice and keep its tests ahead of implementation.
- Change one canonical owner, then regenerate or update every adapter that consumes it.
- Do not add a tool integration by copying another tool's output; implement it through the adapter registry and canonical loaders.
- Keep generated-package and project-lifecycle concerns separate.

## Command Code (alternate harness)

Command Code is an **alternate** executor available in this repo, admitted for a named
capability gap (taste learning, checkpoints/rewind, plan-mode review, headless `cmd -p` runs,
native MCP with per-server permission gating). It reads this `AGENTS.md` as its memory file, so
this file remains the single instruction source. It is **not** the default — OMP is. The
generated `.commandcode/settings.json` mirrors the OMP discipline in Command Code's permission
rules and is materialized from `scripts/harness-matrix.json`; never hand-edit it. See
`docs/standards/harness.md` (Command Code section) and `docs/research/command-code-evaluation.md`.

## Deviations

- SpecSafe intentionally uses `specs/active/`, `specs/completed/`, and `specs/archive/` instead of `specs/<feature>/`. The CLI `init` command creates the lifecycle directories and spec template, `doctor` checks the layout, and the bundled `specsafe-new`, `specsafe-complete`, and `specsafe-archive` workflows create or move records within it; changing the layout would break that managed lifecycle.

## Jevmem project memory

Durable project memory lives in `JEVMEM.md` (one line per decision, constraint, preference, bug, architecture fact, or todo) and is served by the `jevmem` MCP server.

- Before any non-trivial task, call the `search_memory` tool with a one-line description of the task and follow what comes back unless the user overrides it.
- When the user states a decision, a hard rule, a preference, a root cause, or defers work, call `add_memory` with one line (≤ 200 chars) and the right kind: decision | constraint | preference | bug | architecture | todo. jevmem scrubs secrets and asks Jev first; it may refuse the line or correct the kind, and says why.
- If something contradicts an existing memory, add the new line and say which memory it replaces.
- Never add greetings, questions, or things already obvious from the code.
- Never add, edit or remove lines in `JEVMEM.md` directly: record memories only through `add_memory` (with `jevmem watch` running, jevmem also records them from the session on its own).

## Bounded task execution

Within the existing instruction hierarchy, authorization, repository gates, and review/resource
budgets, apply the following to substantial work. Existing stricter or equivalent rules remain
authoritative; this section fills gaps rather than creating a second workflow.

- Inspect the baseline and name the problem, observable acceptance criteria, allowed scope,
  dependencies, and stopping condition. Carry authorized work through appropriate verification
  and follow-through; ask only for a missing required decision or authorization.
- Use `working`, `input-needed`, `review-ready`, `failed`, and `complete` when reporting task
  state. `review-ready` requires a concrete artifact or diff and evidence; `complete` requires
  the accepted outcome and applicable gates. Translate these labels to existing tracker states.
- Establish writer ownership and preserve dirty work. Use supported isolation or serialize
  conflicting writes. Independent review follows existing policy and risk, with the scope and
  revision frozen; self-checks and worker reports are not independent review.
- Reuse existing receipts: record actual harness/model and session when available, immutable
  commit or artifact hash, checks and outcomes, review verdict, and unresolved limits. Mark
  unknowns and distinguish observed evidence from reports. Preserve prior receipts; exclude
  secrets, private prompts, and reasoning.
- Observe relevant cost/usage and CI signals within current caps. Retry only within authorized
  scope and remaining budgets. On a real blocker or exhausted limit, preserve the work and
  report the exact target, cause, and next permitted step. Add no recurring monitor, endless
  review loop, automatic approval, or automatic merge.
