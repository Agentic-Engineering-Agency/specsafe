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

## Deviations

- SpecSafe intentionally uses `specs/active/`, `specs/completed/`, and `specs/archive/` instead of `specs/<feature>/`. The CLI `init` command creates the lifecycle directories and spec template, `doctor` checks the layout, and the bundled `specsafe-new`, `specsafe-complete`, and `specsafe-archive` workflows create or move records within it; changing the layout would break that managed lifecycle.
