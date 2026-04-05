# SpecSafe Conventions

## Two-Phase Workflow

SpecSafe uses a two-phase model: Planning reduces ambiguity, then Development enforces test-driven execution.

### Phase 1: Planning

Canonical order: brainstorm → principles → brief → PRD → UX → architecture → readiness.

- **Brainstorm**: Divergent exploration- **Principles**: Product principles and non-goals- **Brief**: Concise product/business framing (`specsafe-brief`)
- **PRD**: Testable requirements with user journeys (`specsafe-prd`)
- **UX**: Design foundations, tokens, accessibility (`specsafe-ux`)
- **Architecture**: System design with ADRs (`specsafe-architecture`)
- **Readiness**: Pre-development coherence check
UX always precedes architecture. Planning precedes development.

### Phase 2: Development (5 Stages)

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

## 18 Skills

### Planning
1. `specsafe-brief` — Create product brief
2. `specsafe-prd` — Expand brief into PRD
3. `specsafe-ux` — UX design foundations
4. `specsafe-architecture` — System architecture

### Development
5. `specsafe-new <name>` — Create new spec
6. `specsafe-spec <id>` — Refine spec
7. `specsafe-test <id>` — Generate tests (SPEC → TEST)
8. `specsafe-code <id>` — Implement via TDD (TEST → CODE)
9. `specsafe-verify <id>` — Validate implementation (CODE → QA)
10. `specsafe-qa <id>` — Full QA report
11. `specsafe-complete <id>` — Complete spec (QA → COMPLETE)

### Utility
12. `specsafe-init` — Initialize project
13. `specsafe-explore` — Pre-spec research
14. `specsafe-context` — Gather project context
15. `specsafe-status` — Project dashboard
16. `specsafe-archive <id>` — Archive obsolete spec
17. `specsafe-doctor` — Validate project health
18. `specsafe-skill-creator` — Create new skills

### Planning (continued)
19. `specsafe-brainstorm` — Divergent exploration
20. `specsafe-principles` — Product principles
21. `specsafe-readiness` — Pre-development coherence check
## Rules

- Always read `PROJECT_STATE.md` before any operation
- Never modify `PROJECT_STATE.md` except through skill workflows
- Tests define implementation — code exists only to make tests pass
- One spec at a time
- Evidence required for all QA verdicts
- Requirements use SHALL/MUST/SHOULD (RFC 2119)
- Planning precedes development — reduce ambiguity before writing code
