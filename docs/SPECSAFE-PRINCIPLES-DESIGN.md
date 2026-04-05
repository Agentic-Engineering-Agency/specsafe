# Specsafe Principles Skill Design

Status: Design draft
Version: 0.1
Date: 2026-04-04

## Purpose

`specsafe-principles` converts brainstorming output and early product thinking into a stable set of decision-making principles that all later planning and development must respect.

It bridges the gap between divergent exploration and the first structured artifact (the brief).

Without explicit principles, later decisions get relitigated, brief/PRD/UX/architecture drift apart, and agents make conflicting assumptions.

## Product position

`specsafe-principles` is:
- a convergence and alignment tool
- a short, high-signal artifact generator
- the place to define what matters and what does not
- upstream of brief, PRD, UX, architecture, and all development work

`specsafe-principles` is not:
- a second brainstorming session
- a detailed product spec
- a design document
- an architecture decision record

## Relationship to other skills

Upstream
- `specsafe-brainstorm` (primary)
- user's own stated goals when brainstorming was skipped

Downstream
- `specsafe-brief`
- `specsafe-prd`
- `specsafe-ux`
- `specsafe-architecture`
- `specsafe-readiness`
- all development spec slices

Neighbor skills
- `specsafe-party-mode` may be used during principles alignment if tradeoffs are significant

## Core objectives

The skill must:
1. help the user articulate what matters and what does not
2. produce a stable reference that survives the planning pipeline
3. surface tradeoffs and force explicit choices rather than letting ambiguity persist
4. keep the output short, sharp, and directly useful
5. explicitly include non-goals and anti-patterns

## Canonical output

Primary artifact
- `docs/product-principles.md`

The output should include:
- product intent (one-paragraph summary of what we are building and why)
- core principles (3-7 ranked decision-making rules)
- non-goals (explicit things we will not do)
- quality priorities (ranked list of what matters most when there are tradeoffs)
- decision heuristics (how to resolve conflicts when principles compete)
- open questions carried forward from brainstorming

## Proposed workflow

### Step 1: Load context

Read:
- brainstorming artifact(s) if they exist
- any user-provided context or stated goals
- existing docs if this is a refinement pass

Present:
- summary of what was explored during brainstorming
- key themes, tensions, and standout directions

### Step 2: Product intent

Ask the user to describe in plain language:
- what are we building
- who is it for
- what is the most important outcome

Produce a one-paragraph product intent statement.

Confirm with the user before continuing.

### Step 3: Core principles elicitation

For each principle, the facilitator should:
- propose a candidate principle from brainstorming themes and user input
- explain what it means in practice
- explain what it costs (what you give up by committing to this)
- ask the user to accept, revise, or reject

Target: 3-7 principles.

Principles should be:
- opinionated (not "we want quality" but "we prefer simplicity over flexibility")
- ranked (when two principles conflict, which wins)
- actionable (an agent or developer can use them to resolve ambiguity)

### Step 4: Non-goals

Explicitly ask:
- what should this product NOT do
- what features, patterns, or approaches are we deliberately avoiding
- what would be a sign that we have drifted off course

Non-goals are required, not optional. They are among the most valuable things in the artifact because they prevent scope creep and wrong-direction work.

### Step 5: Quality priorities

Ask the user to rank quality dimensions relevant to the project.

Suggested default dimensions to rank:
- correctness
- security
- performance
- developer experience
- user experience
- accessibility
- simplicity
- extensibility
- test coverage
- documentation quality

The ranking should express real tradeoffs:
- "if we must choose between extensibility and simplicity, simplicity wins"

### Step 6: Decision heuristics

Produce 2-4 heuristic rules that help resolve ambiguity downstream.

Examples:
- "when in doubt, choose the solution with fewer moving parts"
- "user-facing quality always trumps internal elegance"
- "if two approaches are close, pick the one that is easier to test"
- "do not add a dependency unless it solves a problem we have today"

These should be derived from the principles and quality priorities.

### Step 7: Review and save

Present the full principles artifact.
Walk through each section.
Confirm with the user.
Save to `docs/product-principles.md`.

Recommend next step:
- `specsafe-brief`

## Output template

```md
# Product Principles: <project name>

## Product Intent
<one paragraph>

## Core Principles
1. <principle> — <what it means in practice>
2. <principle> — <what it means in practice>
3. ...

## Non-Goals
- <thing we will not do and why>
- ...

## Quality Priorities (ranked)
1. <dimension>
2. <dimension>
3. ...

## Decision Heuristics
- <heuristic>
- ...

## Open Questions
- <carried forward from brainstorming or surfaced here>
- ...
```

## Persona

Best option
- Kai currently handles brief and PRD but is too spec-centric for this role
- a product-focused persona would be ideal
- interim option: use Elena (Scout) since principles work is still discovery-adjacent
- long-term recommendation: introduce a dedicated product/strategy persona or expand Elena's role

Characteristics needed:
- strategic thinker
- good at prompting tradeoff decisions
- concise
- opinionated enough to push back on vague principles

## Guardrails

- never produce principles without user input
- never skip non-goals
- never produce more than 7 core principles (if there are more, they are not principles, they are a wishlist)
- never let a principle be vague enough that two people could interpret it oppositely
- always rank principles so conflicts are resolvable
- always recommend `specsafe-brief` as the next step

## Differences from BMAD

BMAD does not have a discrete principles step.
It handles this implicitly across brainstorming, briefing, and design thinking.

Specsafe makes this explicit because:
- principles alignment reduces drift between later artifacts
- explicit non-goals prevent scope creep at every later stage
- ranked quality priorities give agents and reviewers concrete guidance
- this is the lightest useful artifact in the planning chain

## Testing expectations

The skill should be validated for:
- skill exists and is dynamically enumerated
- workflow includes product-intent section
- workflow includes non-goals requirement
- workflow includes quality ranking
- handoff points to `specsafe-brief`
- guardrails prevent empty or vague outputs

## Success criteria

A good principles artifact should:
- be readable in under 2 minutes
- resolve at least one ambiguous tradeoff that brainstorming surfaced
- prevent at least one common wrong-direction decision downstream
- survive the rest of the planning pipeline without being ignored
