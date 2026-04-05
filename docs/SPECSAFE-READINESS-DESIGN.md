# Specsafe Readiness Skill Design

Status: Design draft
Version: 0.1
Date: 2026-04-04
Primary reference: BMAD `bmad-check-implementation-readiness`

## Purpose

`specsafe-readiness` is the final gate between planning and development.

It validates that all planning artifacts are coherent, aligned, and sufficient to safely begin implementation as small spec slices.

It exists because implementation that starts before planning is ready produces the exact problems Specsafe is designed to prevent: scope drift, contradictory requirements, architectural mismatches, and wasted effort.

## Product position

`specsafe-readiness` is:
- a validation and alignment check
- a gate, not a rubber stamp
- the skill that earns the right to begin development
- the last chance to catch planning gaps cheaply

`specsafe-readiness` is not:
- a planning skill (it does not create artifacts)
- a brainstorming skill
- a QA skill for implementation
- something that should block trivially obvious work

## Relationship to other skills

Upstream
- `specsafe-architecture` (immediately prior in canonical order)
- all planning artifacts: principles, brief, PRD, UX, architecture

Downstream
- `specsafe-new` (create first spec slice)
- `specsafe-explore` (if technical unknowns require investigation first)

Neighbor skills
- `specsafe-party-mode` may be used for a readiness review board session

## Core objectives

The skill must:
1. check whether planning artifacts exist and are internally consistent
2. identify contradictions between brief, PRD, UX, and architecture
3. surface unresolved questions or unknowns that block implementation
4. verify that external dependencies and documentation needs are accounted for
5. produce a clear GO / NEEDS REVISION / BLOCKED decision
6. recommend specific next actions

## What the readiness check evaluates

### 1. Artifact existence
Which of the following exist:
- `docs/product-principles.md`
- `docs/product-brief.md`
- `docs/prd.md`
- `docs/ux-design.md`
- `docs/architecture.md`

Missing artifacts are noted.
Not all artifacts are mandatory for every project, but the check should surface what is absent so the decision is conscious.

### 2. Cross-artifact alignment
Check whether:
- PRD requirements are consistent with the brief's stated scope and problem
- UX flows match PRD user journeys and requirements
- architecture supports UX flows and PRD requirements
- data model in architecture matches data implied by UX and PRD
- non-goals in principles are not contradicted by PRD or architecture scope
- quality priorities in principles are reflected in architecture choices

### 3. Contradiction detection
Actively look for:
- scope in PRD that exceeds brief intent
- UX flows that assume data or APIs the architecture does not provide
- architecture choices that conflict with UX accessibility or state requirements
- requirements that are untestable or unmeasurable
- non-goals that are violated by current plans

### 4. External dependency check
For any named framework, platform, SDK, API, or integration:
- has official documentation been consulted
- are integration constraints documented in the architecture
- are there version, API, or breaking-change risks that should be noted

### 5. Implementation slicing readiness
Check whether:
- the scope can be broken into small, testable spec slices
- the first 2-3 slices are identifiable from current artifacts
- dependencies between slices are understood
- there is a reasonable starting point that does not require everything at once

### 6. Open questions inventory
Surface all unresolved questions from:
- brainstorming
- principles
- PRD open items
- UX unknowns
- architecture decision gaps

Classify each as:
- blocking (must resolve before implementation)
- non-blocking (can resolve during implementation)
- deferred (intentionally postponed)

## Allowed outcomes

### GO
All checks pass or remaining gaps are non-blocking.
Implementation can begin with spec slices.

### NEEDS REVISION
Material contradictions, missing artifacts, or blocking unknowns exist.
Specific artifacts or sections that need attention are identified.

### BLOCKED
Critical external dependency, fundamental scope contradiction, or unresolvable architectural gap prevents safe implementation.
The block and its resolution path are described.

## Proposed workflow

### Step 1: Artifact inventory
Scan `docs/` for existing planning artifacts.
Report what exists and what is missing.

### Step 2: Read and summarize
For each existing artifact, extract:
- core intent
- key requirements or decisions
- stated constraints
- open questions

### Step 3: Cross-check alignment
Run alignment checks:
- brief vs PRD scope
- PRD vs UX flows
- UX vs architecture support
- architecture vs principles quality priorities
- non-goals vs actual scope
- data model coherence across UX and architecture

Present findings.

### Step 4: External dependency audit
For any named tools/frameworks/platforms:
- note whether documentation was consulted
- flag integration risks
- identify missing documentation needs

### Step 5: Implementation slicing assessment
Evaluate whether:
- the work can be broken into small spec slices
- the first slices are identifiable
- a reasonable implementation starting point exists

### Step 6: Open questions consolidation
Gather all open questions across artifacts.
Classify each as blocking, non-blocking, or deferred.

### Step 7: Verdict and recommendation
Produce a clear decision:
- GO: proceed to `specsafe-new`
- NEEDS REVISION: list what to fix and which skills to re-run
- BLOCKED: describe the block and possible resolution

## Output template

```md
# Implementation Readiness Report

## Artifact Inventory
| Artifact | Exists | Last updated |
|----------|--------|-------------|
| Product Principles | yes/no | date |
| Product Brief | yes/no | date |
| PRD | yes/no | date |
| UX Design | yes/no | date |
| Architecture | yes/no | date |

## Cross-Artifact Alignment
### Agreements
- ...

### Contradictions Found
- ...

### Gaps
- ...

## External Dependencies
| Dependency | Docs consulted | Risks noted |
|-----------|---------------|-------------|
| ... | yes/no | ... |

## Implementation Slicing Assessment
- Can work be sliced: yes/no
- First slices identified: ...
- Suggested starting point: ...

## Open Questions
### Blocking
- ...

### Non-blocking
- ...

### Deferred
- ...

## Verdict: GO / NEEDS REVISION / BLOCKED

## Recommended Next Step
- ...
```

## Artifact location

- `docs/implementation-readiness.md`

## Persona

Best fit
- Lyra (Warden) is the natural persona for this skill
- her skeptical, evidence-based stance is exactly right for a gate

Alternatively
- Cass (Herald) could work since she handles ceremony and project state

Recommendation
- Lyra, because readiness review is fundamentally an inspection/validation act, not a release ceremony

## Guardrails

- never rubber-stamp readiness without actually reading artifacts
- never skip the contradiction check
- never issue GO if blocking open questions exist
- never issue BLOCKED without describing a resolution path
- always recommend a specific next action
- always surface documentation gaps for named tools/frameworks

## Differences from BMAD

BMAD's `bmad-check-implementation-readiness`:
- checks PRD/UX/architecture/stories alignment
- is oriented around epics and stories

Specsafe's `specsafe-readiness`:
- checks the same planning coherence but against spec-slice readiness, not epics
- explicitly includes the documentation-first policy check
- explicitly includes the open-questions consolidation
- produces a verdict artifact rather than just a pass/fail

## Testing expectations

The skill should be validated for:
- skill exists and is dynamically enumerated
- workflow includes artifact inventory
- workflow includes cross-artifact alignment checks
- workflow includes verdict with clear GO / NEEDS REVISION / BLOCKED
- workflow includes open-question consolidation
- handoff points to `specsafe-new` on GO

## Success criteria

A good readiness check should:
- catch at least one planning gap or contradiction if it exists
- prevent implementation from starting with known unresolved blockers
- give the user confidence that planning is coherent enough
- take less than 5 minutes for a well-prepared project
- produce a reusable reference artifact
