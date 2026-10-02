# SPEC-20261002-001: Machine-readable doctor

**ID:** SPEC-20261002-001
**Stage:** QA
**Created:** 2026-10-02
**Updated:** 2026-10-02

## Goal

Let CI and agents gate on project health without parsing the human table.
Reuse all existing CLI doctor checks; keep diagnostics deterministic and read-only.

## Acceptance Criteria

- `specsafe doctor --json` prints one JSON object with `schemaVersion: 1`,
  `checks` (existing label/status/message records), `summary` (errors/warnings),
  and `exitCode`.
- JSON exit codes are 0 for healthy, 1 for warnings, and 2 for any errors.
- Human output and legacy exit behavior remain unchanged.
- Vitest covers the JSON contract, severity precedence, and human parity.
- `pnpm test` and `pnpm typecheck` pass; a ready PR is opened for human review.

## Scope

Serialize the existing CLI doctor checks, not the broader agent skill's diagnostics.
No new AI judgments, network calls, dependencies, or generated harness changes.

## Verification

- Red: four new JSON cases failed against the original implementation.
- `CI=1 pnpm test`: 15 files and 115 tests passed, including three human snapshots
  captured before implementation.
- `pnpm typecheck` and `pnpm build`: exit 0.
- Compiled CLI smoke: healthy/warnings/errors exited 0/1/2; stdout was one JSON
  line and stderr was empty in each case.
- TypeSafe skill, Noul/confidence/HTTP documentation, citation cookbook, and the
  workspace client were reviewed. No judgments/primitives were used: checks are
  deterministic. Coordinator confirmed omitting an unused Jev client; no mock or
  live API calls were made.

Completion awaits human approval of the PR.
