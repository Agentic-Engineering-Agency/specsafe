# Specsafe ↔ BMAD Gap Analysis

Date: 2026-04-04
Status: Working analysis for Specsafe refactor
Decision context: Refactor confirmed; do not rewrite from scratch.

## Executive summary

Specsafe already has a solid engine:
- clean canonical-content vs generator separation
- extensible adapter pattern
- passing tests/typecheck and strong SAST result
- an existing planning surface (`brief`, `prd`, `ux`, `architecture`, `context`, `explore`)

BMAD is materially stronger in planning orchestration, brainstorming depth, persona specialization, and multi-agent facilitation.

Recommendation:
- keep Specsafe's engine and development discipline
- redesign the planning layer using selective BMAD borrowing
- explicitly add brainstorming and party mode to Specsafe
- align all planning handoffs to the canonical order:
  brainstorming -> principles -> brief -> PRD -> UX -> architecture -> readiness -> spec slices

## Sources reviewed

Specsafe
- `specsafe/docs/PROJECT-ANALYSIS.md`
- `specsafe/docs/CODEBASE-AUDIT-2026-04-04.md`
- `specsafe/canonical/skills/specsafe-explore/workflow.md`
- `specsafe/canonical/skills/specsafe-brief/workflow.md`
- `specsafe/canonical/skills/specsafe-prd/workflow.md`
- `specsafe/canonical/skills/specsafe-ux/workflow.md`
- `specsafe/canonical/skills/specsafe-architecture/workflow.md`
- `specsafe/canonical/skills/specsafe-context/workflow.md`
- `specsafe/canonical/skills/specsafe-skill-creator/workflow.md`
- `specsafe/canonical/rules/CLAUDE.md`
- `specsafe/tests/skills.test.ts`
- `specsafe/tests/personas.test.ts`

BMAD
- `_bmad/bmm/module-help.csv`
- `_bmad/_config/agent-manifest.csv`
- `_bmad/core/bmad-brainstorming/*`
- `_bmad/core/bmad-party-mode/*`
- `_bmad/bmm/2-plan-workflows/bmad-create-prd/*`
- `_bmad/bmm/2-plan-workflows/bmad-create-ux-design/*`
- `_bmad/bmm/3-solutioning/bmad-create-architecture/*`
- `_bmad/cis/module-help.csv`
- `_bmad/cis/skills/*`

## Current-state comparison

### 1. Planning lifecycle

Specsafe current state
- Has `brief`, `prd`, `ux`, and `architecture` skills.
- `specsafe-skill-creator` already documents pipeline order as `BRIEF -> PRD -> UX -> ARCH -> SPEC -> TEST -> CODE -> QA -> COMPLETE`.
- Actual handoffs are inconsistent:
  - `specsafe-brief` hands off to `specsafe-prd`
  - `specsafe-prd` says next can be `specsafe-architecture` or `specsafe-ux`
  - `specsafe-ux` hands off directly to `specsafe-new`
  - `specsafe-architecture` says next can be `specsafe-ux` or `specsafe-new`
- Tool rule files still frame Specsafe mainly as a strict 5-stage dev workflow: `SPEC -> TEST -> CODE -> QA -> COMPLETE`.

BMAD current state
- Planning is a first-class workflow family, not an extension.
- Canonical sequence is explicit across module help:
  - Brainstorm Project
  - Product Brief
  - Create PRD
  - Create UX
  - Create Architecture
  - Create Epics and Stories
  - Check Implementation Readiness
- Planning and implementation are treated as different phases.

Gap
- Specsafe has planning skills but not a coherent planning operating system.
- BMAD has orchestration depth; Specsafe has engineering discipline.

Recommendation
- Promote planning to Phase 1 in all rules, setup, prompts, and skill handoffs.
- Make the canonical order explicit and singular across the codebase.

### 2. Brainstorming

Specsafe current state
- `specsafe-explore` exists, but it is research/problem clarification, not a full ideation engine.
- No dedicated brainstorming skill, no method library, no structured ideation outputs, no convergence workflow.

BMAD current state
- `bmad-brainstorming` is a complete facilitation system.
- Includes:
  - resumable sessions
  - user-selected / AI-recommended / random / progressive approaches
  - large technique library (`brain-methods.csv`)
  - divergent then convergent flow
  - theme clustering and prioritization
  - action planning
  - final brainstorming artifact generation
- Uses a facilitator stance rather than a content-dump stance.

Gap
- This is the largest planning gap between Specsafe and the desired target workflow.

Recommendation
- Add a Specsafe brainstorming capability as a first-class Phase 1 skill.
- Borrow BMAD's strongest ideas, not its entire surface area:
  - resumable sessions
  - selectable ideation modes
  - technique library
  - idea clustering
  - output artifact for downstream planning
- Keep the result product-focused and engineering-relevant, not generic creativity theater.

Suggested new artifact
- `docs/brainstorming-session.md` or dated brainstorming artifacts under `docs/brainstorming/`

### 3. Principles / idea framing

Specsafe current state
- No dedicated principles artifact or explicit “idea and principles” skill.
- Some of this is implicitly scattered across `explore`, `brief`, and `prd`.

BMAD current state
- Handles this implicitly via brainstorming, product briefing, design thinking, and innovation strategy.

Gap
- User wants a discrete stage between brainstorming and brief creation.

Recommendation
- Add a lightweight `specsafe-principles` or `specsafe-vision` skill.
- Purpose:
  - convert brainstorm output into product intent
  - define core principles, non-goals, and decision heuristics
  - produce the stable constraints later artifacts must respect

Suggested artifact
- `docs/product-principles.md`

### 4. Personas

Specsafe current state
- Eight personas total.
- Development personas are clean and useful.
- Planning personas are compressed:
  - `Kai` is doing both brief and PRD work
  - UX and architecture are present but newer and under-tested
  - no dedicated brainstorming or PM persona

BMAD current state
- Strongly specialized planning personas:
  - Business Analyst
  - Product Manager
  - UX Designer
  - Architect
  - Brainstorming Coach
  - Innovation Strategist
  - Problem Solver
  - Technical Writer
  - Scrum Master, QA, Dev, etc.

Gap
- Specsafe planning work currently lacks enough persona differentiation to produce consistently distinct planning behaviors.

Recommendation
- Do not import BMAD's full persona zoo.
- Add only the missing planning distinctions Specsafe needs:
  - Brainstorm facilitator
  - Product/brief owner
  - UX designer
  - Architect
  - Existing spec/test/code/qa/release roles
- Keep personas few, sharp, and purpose-built.

### 5. Multi-agent collaboration / Party Mode

Specsafe current state
- No first-class “party mode” or multi-perspective planning discussion mode.
- Multi-agent orchestration is external/manual rather than productized in Specsafe.

BMAD current state
- `bmad-party-mode` is a dedicated workflow.
- Key strengths:
  - facilitator/orchestrator role
  - manifest-driven persona roster
  - structured activation, discussion, and graceful exit
  - natural use during elicitation and validation

Gap
- Specsafe lacks a native collaborative discussion mode for high-ambiguity planning tasks.

Recommendation
- Add `specsafe-party` or `specsafe-party-mode`.
- Scope should be narrower than BMAD's general party mode:
  - use for brainstorming, principles alignment, architecture tradeoff debates, readiness review
  - not for every task
- Support targeted roster selection:
  - example: Brainstormer + Product + UX + Architect
  - example: Architect + QA + Implementer for risk review

Important product rule
- Party mode should be opt-in and purposeful.
- It should never become default noise.

### 6. Readiness gating before implementation

Specsafe current state
- Strong per-spec development loop once a spec exists.
- No dedicated implementation-readiness gate for the planning phase.

BMAD current state
- Has `bmad-check-implementation-readiness`.
- Explicitly checks PRD/UX/architecture/stories alignment before implementation begins.

Gap
- User wants a stronger gate before dev begins and stronger alignment with docs.

Recommendation
- Add a `specsafe-readiness` skill before `specsafe-new` or before any spec enters active implementation.
- Checks should include:
  - brief/prd/ux/architecture coherence
  - unresolved product contradictions
  - data model readiness
  - external dependency unknowns
  - implementation constraints from official docs

### 7. Documentation-first execution

Specsafe current state
- Planning skills read project docs.
- Development rules focus on TDD and QA, but not on mandatory use of up-to-date official framework docs.

BMAD current state
- Research workflows exist but are not tailored to your desired “always consult official docs when relevant” standard.

Gap
- This is a user-critical quality requirement and must become a first-class rule.

Recommendation
- Add a cross-cutting “documentation-first” policy to Specsafe.
- For any named framework/platform/tool, the workflow should gather and cite current docs before implementation.
- This must feed Claude Code prompts and readiness gates.

### 8. Development-phase shape

Specsafe current state
- This is the strongest part of the product.
- The `SPEC -> TEST -> CODE -> QA -> COMPLETE` discipline is valuable and should be preserved.

BMAD current state
- Strong implementation workflow family, but story/epic orientation is heavier than the user's preferred small spec-slice model.

Gap
- No major gap; Specsafe is already well-positioned here.

Recommendation
- Keep Specsafe's development engine.
- Rename and document the unit of work as “spec slices” rather than broad stories/features.
- Preserve tests-first, implementation, verify, QA, complete/archive.

## Adopt / Adapt / Ignore matrix

| BMAD capability | Current Specsafe equivalent | Decision | Notes |
|---|---|---|---|
| Brainstorming workflow with method library | None / weakly `explore` | Adapt | High-priority addition |
| Progressive, resumable planning workflows | Partial | Adapt | Strong fit for planning phase |
| Specialized planning personas | Partial | Adapt | Add only missing distinctions |
| Party mode | None | Adapt | Add targeted, optional multi-perspective mode |
| Product brief workflow | `specsafe-brief` | Keep + refine | Align persona and handoffs |
| PRD workflow | `specsafe-prd` | Keep + refine | Add doc-first rule and handoff consistency |
| UX workflow | `specsafe-ux` | Keep + rewrite handoff | Must precede architecture in canonical path |
| Architecture workflow | `specsafe-architecture` | Keep + rewrite handoff | Must follow UX in canonical path |
| Readiness check | None | Add | Essential before implementation |
| Epics/stories system | `specsafe-new/spec` slices | Ignore / selectively adapt | Do not import heavy story bureaucracy |
| Generic creative suite extras | None | Mostly ignore | Borrow only when they directly improve Specsafe |

## Canonical target workflow for refactor

### Phase 1: Planning
1. `specsafe-brainstorm`
2. `specsafe-principles`
3. `specsafe-brief`
4. `specsafe-prd`
5. `specsafe-ux`
6. `specsafe-architecture`
7. `specsafe-readiness`

### Phase 2: Development
1. create small spec slice
2. tests first
3. implementation
4. verify / QA / review
5. if poor quality or failing: loop back
6. if approved: complete + archive

## Immediate refactor implications

1. Update all rule files to describe a 2-phase system, not only the 5-stage dev loop.
2. Add brainstorming and readiness as first-class capabilities.
3. Add party mode as an optional planning accelerator.
4. Align all handoffs to `brief -> prd -> ux -> architecture -> readiness -> spec`.
5. Preserve the current development engine and adapter system.

## Recommended implementation order

1. Fix correctness landmines from audit.
2. Rewrite product/rule framing to the 2-phase model.
3. Add brainstorming skill.
4. Add principles skill.
5. Refine brief/prd/ux/architecture handoffs and personas.
6. Add readiness skill.
7. Add party mode.
8. Update tests to dynamically cover all skills/personas.
9. Re-evaluate setup questions after workflow refactor stabilizes.

## Bottom line

Specsafe should not become a BMAD clone.

It should become:
- lighter than BMAD
- stricter than BMAD about engineering quality
- better than current Specsafe at planning and ideation
- explicitly designed for Hermes + Claude Code orchestration

The clearest BMAD features to borrow are:
- brainstorming
- party mode
- planning-flow coherence
- readiness gating
- selective persona specialization
