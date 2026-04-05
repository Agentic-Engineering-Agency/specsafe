# Specsafe Canonical Workflow

Status: Source of truth
Version: 0.1-draft
Date: 2026-04-04
Purpose: Define the official operating model for Specsafe after the refactor.

## Why this document exists

Specsafe currently has a strong development engine but inconsistent planning guidance. This document defines the canonical workflow that every rule file, skill, setup prompt, adapter artifact, and future feature should follow.

If any existing file disagrees with this document, this document wins.

## Product thesis

Specsafe is a two-phase software engineering framework for human + AI development.

Phase 1 exists to remove ambiguity before implementation.
Phase 2 exists to enforce high-quality execution once ambiguity has been reduced enough.

Specsafe is not just a TDD wrapper.
Specsafe is a planning-and-execution system.

## Core operating model

Default collaboration model:
1. Human expresses goal, context, taste, and constraints.
2. Hermes helps structure the work, clarify ambiguity, and gather relevant documentation.
3. Claude Code is the primary implementation agent when coding work begins.
4. Hermes reviews, tests, and pressure-checks outputs before reporting completion.
5. Multi-agent collaboration is used selectively when it creates real value.

## Canonical workflow overview

```text
PHASE 1: PLANNING
brainstorming
  -> principles
  -> brief
  -> PRD
  -> UX
  -> architecture
  -> readiness

PHASE 2: DEVELOPMENT
spec slice
  -> tests
  -> implementation
  -> verify / QA / review
  -> complete or loop back
```

## Phase 1: Planning

Planning is mandatory for projects, features, or changes where requirements, UX, architecture, or tool usage are not already obvious and stable.

The planning phase creates the artifacts that make implementation safer, faster, and more coherent.

### Step 1: Brainstorming

Goal
- Divergently explore possibilities before prematurely collapsing into a single solution.

Purpose
- surface options
- uncover hidden constraints
- discover novel approaches
- reveal product, UX, architecture, and business tradeoffs

Output
- brainstorming artifact with raw ideas, grouped themes, notable opportunities, and open questions

Rules
- prioritize divergence before convergence
- explore multiple categories of thought, not only technical implementation ideas
- explicitly include user, product, technical, data, edge-case, and business angles
- do not jump straight into architecture

Suggested artifact
- `docs/brainstorming/brainstorming-session-*.md`

### Step 2: Principles

Goal
- Convert brainstorming output into stable decision-making guidance.

Purpose
- define product principles
- define design and engineering priorities
- define non-goals
- define quality priorities and tradeoff heuristics

Output
- a principles artifact that later stages must respect

Rules
- principles should be stable enough to resolve future ambiguity
- principles should be short, sharp, and reusable
- non-goals are required, not optional

Suggested artifact
- `docs/product-principles.md`

### Step 3: Brief

Goal
- Produce a concise business/product framing document.

Purpose
- define the problem
- define the target user
- define value and scope at a high level
- establish the project's reason to exist

Output
- product brief

Rules
- a brief should stay brief
- it should consume brainstorming and principles outputs
- it should not become a pseudo-PRD

Artifact
- `docs/product-brief.md`

### Step 4: PRD

Goal
- Convert the brief into a testable requirements document.

Purpose
- define functional requirements
- define non-functional requirements
- define scope boundaries
- define user journeys / requirements sufficiently for UX and architecture work

Output
- PRD

Rules
- requirements must be clear, explicit, and testable
- ambiguity should be made visible rather than hidden
- if a requirement depends on a specific platform/tool/framework, note it explicitly

Artifact
- `docs/prd.md`

### Step 5: UX

Goal
- Define how the product should behave from the user's perspective before technical structure is finalized.

Why UX comes before architecture
- UX frequently changes assumptions about data shape, state transitions, flows, and constraints
- architecture built before UX often hardens the wrong assumptions
- architecture should support the intended experience, not pre-empt it

Purpose
- define major flows and states
- define information architecture
- define accessibility expectations
- define UX principles, edge cases, and failure states
- identify user interactions that impact the architecture and schema

Output
- UX design spec

Rules
- UX is not decoration; it defines important product behavior
- accessibility is required
- edge and failure states must be documented
- architecture is downstream of UX

Artifact
- `docs/ux-design.md`

### Step 6: Architecture

Goal
- Translate the product and UX decisions into a complete technical design.

Purpose
- define components, layers, and boundaries
- define data model and schema
- define system flows and integrations
- define failure handling and operational considerations
- define rationale for key tradeoffs

Output
- architecture document

Rules
- architecture serves product and UX, not the other way around
- every major decision should have rationale
- prefer boring, stable solutions unless there is a compelling reason not to
- diagrams are required when they reduce ambiguity

Artifacts
- `docs/architecture.md`
- supporting Mermaid and/or Excalidraw diagrams as needed

Recommended diagram types
- system context
- component/layer map
- data flow
- schema/data model
- sequence diagrams for critical flows

### Step 7: Readiness

Goal
- Decide whether planning is good enough for development to begin.

Purpose
- validate coherence between brief, PRD, UX, and architecture
- identify contradictions and unknowns
- confirm that documentation is sufficient for implementation
- ensure the next development unit can be kept small and testable

Output
- readiness report with a clear decision

Allowed outcomes
- GO
- NEEDS REVISION
- BLOCKED

Rules
- implementation should not begin if planning artifacts materially disagree
- unresolved external dependency questions should be surfaced here
- this is the last gate before development work starts

Artifact
- `docs/implementation-readiness.md`

## Phase 2: Development

Development begins only after the change is understood well enough to be implemented as a small spec slice.

### Unit of work: spec slice

Specsafe's preferred implementation unit is not a huge feature, epic, or broad story.
It is a small vertical slice that is:
- understandable
- testable
- reviewable
- realistically completable without broad ambiguity

A good spec slice:
- has a narrow goal
- has explicit acceptance criteria
- can be tested independently
- does not smuggle in unrelated work

Anti-patterns
- “implement the whole dashboard”
- “build auth system”
- “create all onboarding features”

Better examples
- “support email-based sign-in request flow”
- “add project creation form validation and error states”
- “persist selected workspace in local state and reload on refresh”

### Step 1: Create spec slice

Goal
- Define the smallest valuable and coherent development unit.

Purpose
- capture acceptance criteria
- identify boundaries and dependencies
- define scenarios and expected outcomes

Output
- spec file in active specs

Rules
- derive from planning artifacts when available
- if the slice is still too big, split it again
- spec slices should remain tightly scoped

### Step 2: Tests first

Goal
- express intended behavior as executable checks before implementation.

Purpose
- lock behavior
- expose ambiguity early
- drive implementation boundaries

Rules
- tests come before code
- tests should reflect the current slice, not future work
- browser/E2E tests are required when the slice is materially UX-visible

### Step 3: Implementation

Goal
- write the minimal high-quality code needed to satisfy the tests and the spec slice.

Purpose
- perform disciplined red-green-refactor work
- remain aligned with planning artifacts
- avoid opportunistic scope creep

Rules
- implementation follows tests
- implementation must respect the current architecture and UX
- use official documentation when working with named frameworks, SDKs, platforms, or MCPs

### Step 4: Verify / QA / review

Goal
- independently validate correctness and quality.

Required quality bar
- tests pass
- lint passes
- typecheck passes
- code makes sense and files are coherent
- implementation matches the spec slice
- implementation remains aligned with UX and architecture
- security risks reviewed
- edge cases reviewed
- browser validation performed when relevant
- framework/library usage checked against current docs when relevant

Allowed outcomes
- PASS -> eligible for completion
- FAIL -> loop back to implementation

### Step 5: Complete / archive

Goal
- mark approved work complete and preserve project state cleanly.

Purpose
- update tracking
- preserve QA evidence
- move completed work into its proper state
- archive obsolete or superseded items when appropriate

Rules
- no item should be completed without evidence
- archive is for obsolete/superseded work, not normal successful completion

## Documentation-first policy

This is a cross-cutting rule across both phases.

When a task touches a named framework, SDK, platform, tool, library, or integration, the workflow should gather current official documentation before implementation and feed the relevant guidance into prompts, reviews, and readiness checks.

Examples
- Convex
- Mastra
- TypeScript
- Vercel
- Playwright
- any SDK/API under active development

Why
- AI agents hallucinate integrations when they rely on stale priors
- up-to-date docs dramatically improve correctness

Minimum expectation
- identify the relevant official docs
- extract the constraints/examples that matter
- pass them into the implementation prompt and validation process

## Party mode policy

Specsafe party mode is optional, focused, and not default.

Use party mode when:
- requirements are ambiguous
- tradeoffs are meaningful
- multiple disciplines need to weigh in
- the user wants a multi-perspective planning or review session

Good use cases
- brainstorming
- principles alignment
- PRD challenge session
- UX vs architecture tradeoff review
- readiness review

Bad use cases
- trivial implementation work
- routine code edits
- tasks where a single clear owner is sufficient

Default roster philosophy
- select only the personas needed for the session
- do not summon everyone by default

## Multi-agent policy

Specsafe supports multi-agent work, but selectively.

Default heuristics
- 1 agent: focused implementation or analysis
- 2 agents: implementation + independent reviewer/tester
- 3+ agents: only when workstreams are separable or multi-perspective reasoning materially helps

This is a rational heuristic, not a rigid law.

## Role of Hermes and Claude Code

Default operating mode
- Hermes: planning, structuring, documentation research, prompt design, orchestration, review, testing, synthesis
- Claude Code: primary implementation worker
- Playwright: browser/UI validation when relevant
- other agents: used when they have a clear comparative advantage

## What must be updated to conform to this document

The following product surfaces must eventually align to this source of truth:
- `README.md`
- tool rule files in `canonical/rules/`
- setup prompts and config templates
- planning skill handoffs
- test coverage expectations
- project docs and examples
- agent prompt templates

## Invariants

The following are non-negotiable invariants for Specsafe:
- planning exists to reduce ambiguity before implementation
- UX precedes architecture in the canonical path
- development work is done in small spec slices
- tests come before implementation
- evidence is required before completion
- official documentation should be consulted when tool/framework specifics matter
- multi-agent collaboration is selective and purposeful

## Success criteria for the refactor

Specsafe is aligned with this workflow when:
- all rules describe a two-phase model
- planning handoffs are consistent everywhere
- brainstorming, principles, readiness, and party mode exist as first-class capabilities
- UX reliably precedes architecture
- development still preserves strict tests-first discipline
- Hermes + Claude Code orchestration fits naturally on top of the framework
