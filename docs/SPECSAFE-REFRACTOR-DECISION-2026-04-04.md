# Specsafe Refactor Decision Memo

Date: 2026-04-04
Decision: Refactor and evolve Specsafe. Do not rewrite from scratch.
Status: Approved direction

## Decision summary

We will refactor Specsafe rather than start over.

The codebase is already functional, testable, and architecturally coherent. The highest-value problems are:
- localized correctness defects
- incomplete test coverage for newer planning assets
- weak planning-phase orchestration compared with the target workflow
- inconsistent handoffs between planning artifacts
- missing first-class brainstorming, readiness, and party-mode capabilities

These are refactor problems, not rewrite problems.

## Evidence supporting refactor

From `specsafe/docs/CODEBASE-AUDIT-2026-04-04.md`:
- 102 tests passing
- clean `tsc --noEmit`
- Semgrep clean across 849 rules / 68 files
- codebase assessed as architecturally sound and functionally working
- key risks identified as localized: interface mismatch, `__dirname` fallback bug, config overwrites, YAML parsing fragility, and missing test coverage for newer skills/personas

From `specsafe/docs/PROJECT-ANALYSIS.md`:
- clean separation between canonical content and generator code
- adapter pattern is simple and extensible
- existing planning skills already exist and can be improved rather than recreated
- development-phase discipline is already a strength

## Why not rewrite

A rewrite would likely destroy leverage we already have:
- adapter infrastructure
- project scaffolding templates
- existing tests and CI patterns
- canonical content packaging model
- proven development workflow commands

A rewrite would also increase risk by reintroducing solved problems while delaying work on the actual missing value: a stronger planning operating system.

## What stays

Keep these intact unless a concrete defect forces change:
- generator architecture
- canonical-content directory model
- adapter pattern and tool support strategy
- project initialization and install/update/doctor structure
- development-phase core loop: spec -> test -> code -> verify/qa -> complete
- strict quality expectations and evidence-based QA posture

## What changes

Refactor these areas aggressively:
- planning phase framing
- planning skill handoffs
- planning personas and role clarity
- documentation-first policy
- readiness gate before implementation
- brainstorming workflow
- optional party mode / multi-perspective facilitation
- tests for planning skills/personas
- rules and setup copy so the product reflects the actual workflow philosophy

## Refactor objectives

### Objective 1: Promote planning to a first-class phase
Canonical target order:
1. brainstorming
2. principles
3. brief
4. PRD
5. UX
6. architecture
7. readiness
8. development spec slices

### Objective 2: Preserve the development engine
Retain Specsafe's strongest property:
- small spec slices
- tests first
- implementation disciplined by tests
- verify + QA gates
- completion/archive only after evidence-based approval

### Objective 3: Make official docs a required input
When a task uses a named framework, SDK, platform, or integration, current official documentation must be consulted before implementation and fed into prompts/reviews.

### Objective 4: Support Hermes + Claude Code orchestration
Specsafe should become friendlier to the intended operating model:
- human expresses intent
- Hermes structures and refines
- Claude Code implements
- Hermes verifies, tests, and requests fixes before reporting completion

## Refactor boundaries

Do
- fix defects and improve architecture incrementally
- add missing planning capabilities
- replace inconsistent workflow messaging
- strengthen tests
- simplify or remove setup questions that do not materially help quality

Do not
- throw away the generator code because planning is weak
- import all of BMAD wholesale
- add process weight that fights the “small spec slice” philosophy
- make multi-agent workflows the default for every task

## Priority tiers

### Tier 0: Correctness and trust
Fix before broadening product scope:
1. `ToolAdapter.generate()` parameter name mismatch
2. `dirname()` fallback bug on Node 18-20
3. dynamic coverage for all skills and personas
4. version mismatch cleanup
5. config overwrite behavior
6. frontmatter parsing fragility

### Tier 1: Workflow truthfulness
1. update rule files to describe a 2-phase system
2. align all planning handoffs to the canonical order
3. rewrite setup and docs so the tool tells the truth about how it should be used

### Tier 2: Planning redesign
1. add brainstorming
2. add principles
3. refine brief/prd/ux/architecture
4. add readiness
5. add documentation-first checks

### Tier 3: Collaboration accelerators
1. add party mode
2. add stronger Claude Code prompt templates
3. add targeted agent-routing guidance

## Risks and mitigations

Risk: Refactor introduces workflow confusion during transition.
Mitigation: land a canonical workflow doc first, then update skills and rules against that source of truth.

Risk: Planning layer grows too complex.
Mitigation: borrow selectively from BMAD; optimize for product/design/engineering usefulness, not ceremony.

Risk: Existing users see incompatible behavior changes.
Mitigation: preserve command names where possible; introduce changes behind additive skills and updated docs first.

## Definition of success for the refactor

Specsafe succeeds if it becomes:
- clearly two-phased: planning + development
- excellent at early ideation and convergence
- rigorous about test-driven implementation
- documentation-first for modern framework usage
- friendly to Hermes-supervised Claude Code execution
- more coherent without becoming heavier than necessary

## Decision statement

Refactor is the correct path.

Keep the engine.
Redesign the planning layer.
Fix the correctness landmines.
Borrow the best of BMAD selectively, especially brainstorming and party mode.
Preserve Specsafe's strongest differentiator: disciplined engineering execution after planning is complete.
