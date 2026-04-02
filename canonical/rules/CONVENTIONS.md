# SpecSafe Conventions

## TDD Workflow (5 Stages)

Every feature follows: **SPEC → TEST → CODE → QA → COMPLETE**. No skipping.

- **SPEC**: Create spec with requirements (SHALL/MUST language) and GIVEN/WHEN/THEN scenarios
- **TEST**: Generate failing tests from spec scenarios — tests before code
- **CODE**: Implement using red-green-refactor — minimum code to pass each test
- **QA**: Validate all tests pass, coverage meets threshold, generate QA report
- **COMPLETE**: Human approval gate, move spec to completed

## Key Files

- `PROJECT_STATE.md` — Read first. Single source of truth for spec status.
- `specs/active/` — Active specs. `specs/completed/` — Done. `specs/archive/` — Obsolete.
- `specsafe.config.json` — Project config (test framework, language, tools).

## 12 Skills

1. `specsafe-init` — Initialize project
2. `specsafe-explore` — Pre-spec research
3. `specsafe-new <name>` — Create new spec
4. `specsafe-spec <id>` — Refine spec
5. `specsafe-test <id>` — Generate tests (SPEC → TEST)
6. `specsafe-code <id>` — Implement via TDD (TEST → CODE)
7. `specsafe-verify <id>` — Validate implementation (CODE → QA)
8. `specsafe-qa <id>` — Full QA report
9. `specsafe-complete <id>` — Complete spec (QA → COMPLETE)
10. `specsafe-status` — Project dashboard
11. `specsafe-archive <id>` — Archive obsolete spec
12. `specsafe-doctor` — Validate project health

## Rules

- Always read `PROJECT_STATE.md` before any operation
- Never modify `PROJECT_STATE.md` except through skill workflows
- Tests define implementation — code exists only to make tests pass
- One spec at a time
- Evidence required for all QA verdicts
- Requirements use SHALL/MUST/SHOULD (RFC 2119)
