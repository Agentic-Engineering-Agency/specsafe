# Specsafe Brainstorm Skill Design

Status: Design draft
Version: 0.1
Date: 2026-04-04
Primary reference: BMAD brainstorming workflow
Primary constraint: Must fit Specsafe's product philosophy rather than become generic creativity tooling.

## Purpose

`specsafe-brainstorm` is the official entry point for ambiguous product, feature, workflow, or system ideas.

It exists to help the user and the agent explore solution space before collapsing into principles, brief, PRD, UX, and architecture.

This skill should replace the current absence of a true ideation engine.
It should not replace `specsafe-explore`, which remains a research/discovery skill.

## Product position

`specsafe-brainstorm` is:
- divergent-first
- facilitator-led
- artifact-producing
- resumable
- selective in technique use
- optimized for product/design/engineering planning

`specsafe-brainstorm` is not:
- a generic creative writing tool
- an unbounded roleplay toy
- a substitute for architecture
- a substitute for technical repo exploration

## Relationship to other skills

Upstream
- user idea / goal / rough challenge

Downstream
- `specsafe-principles`
- `specsafe-brief`
- occasionally `specsafe-party-mode` during high-ambiguity sessions

Neighbor skill
- `specsafe-explore` should be used when the core need is codebase investigation, technical discovery, or brownfield analysis

## Core objectives

The skill must:
1. make it easy to start from an idea, not a polished spec
2. create real divergence before premature convergence
3. expose tradeoffs across product, UX, data, architecture, and business dimensions
4. produce outputs that later planning stages can consume directly
5. support continuation/resume across sessions
6. avoid “AI dumps 50 ideas with no structure” failure mode

## Canonical outputs

Primary output artifact
- `docs/brainstorming/brainstorming-session-YYYY-MM-DD-HHMM.md`

Optional derivative output
- `docs/brainstorming/brainstorm-summary.md`

The output should include:
- topic / challenge statement
- desired outcomes
- constraints and assumptions
- ideas generated
- grouped themes
- standout opportunities
- tensions / tradeoffs
- open questions
- recommended next step

## Session modes

Borrowed and adapted from BMAD:

### Mode 1: User-selected techniques
Use when:
- the user knows how they want to think
- the user wants control over the ideation style

### Mode 2: AI-recommended techniques
Use when:
- the user wants guidance
- the topic needs context-aware method selection

This should be the default suggested mode.

### Mode 3: Random technique selection
Use when:
- the user is stuck and wants surprise
- novelty is more important than predictability

### Mode 4: Progressive flow
Use when:
- the topic is large or fuzzy
- we want broad divergence first, then more structured narrowing

This should be the recommended mode for major project planning.

## Technique library

The BMAD technique library is a strong reference. Specsafe should borrow selectively.

Recommended initial categories
1. product
2. UX
3. technical
4. structured
5. wildcards
6. risk-and-edge-cases

Why this differs from BMAD
- BMAD is broader and more creativity-oriented
- Specsafe should optimize for engineering-relevant ideation

### Recommended initial techniques

Product
- Jobs To Be Done prompts
- user problem reframing
- value wedge exploration
- scope slicing

UX
- journey-first thinking
- state and failure mapping
- accessibility-first challenge
- edge-case interaction probing

Technical
- first principles
- constraint mapping
- integration surface mapping
- data-shape brainstorming

Structured
- SCAMPER
- six thinking hats
- morphological analysis
- decision matrix seed generation

Wildcards
- reverse brainstorming
- what-if scenario inversion
- cross-domain analogy
- anti-solution

Risk and edge cases
- failure-mode ideation
- adversarial user behavior
- operational risk prompts
- migration/backward compatibility prompts

## Required facilitation rules

### Rule 1: facilitator stance
The skill is a facilitator, not a content firehose.
It must continually involve the user.

### Rule 2: divergence before convergence
Do not organize too early.
Avoid collapsing on the first clean-looking answer.

### Rule 3: category shifting
Borrow BMAD's anti-bias idea.
After a cluster of ideas in one dimension, deliberately pivot dimensions.
Example sequence:
- product value
- UX flow
- architecture implication
- failure mode
- edge case
- business implication

### Rule 4: output quality over raw idea count
BMAD aims for huge quantity. Specsafe should prefer meaningful breadth over arbitrary counts.
The goal is not “100 ideas” by default.
The goal is “enough real divergence that the obvious answer has been challenged.”

### Rule 5: engineering relevance
Every brainstorming session should eventually surface:
- user-facing impact
- system/data implications
- risk/edge cases
- likely next planning artifact

## Proposed workflow structure

### Step 1: Session setup
Capture:
- what are we brainstorming
- what kind of outcome is wanted
- what constraints already exist
- is this a project, feature area, workflow, architecture question, or redesign
- whether previous session exists

Offer:
- continue prior session
- start new session

### Step 2: Approach selection
Offer the four modes:
- user-selected
- AI-recommended
- random
- progressive

Default recommendation
- AI-recommended for normal use
- progressive for large project ideation

### Step 3: Divergent ideation
Drive 1-3 techniques depending on session size.
Track ideas in structured sections.
Do not yet over-prioritize.

### Step 4: Theme clustering
Group ideas into themes such as:
- product opportunities
- UX patterns
- technical directions
- data/model implications
- risks and unresolved questions

### Step 5: Convergence and prioritization
Ask the user which directions matter most.
Produce:
- top themes
- quick wins
- breakthrough concepts
- questions needing follow-up

### Step 6: Recommend next artifact
The skill should conclude by recommending exactly one next step, such as:
- `specsafe-principles`
- `specsafe-brief`
- `specsafe-party-mode`
- `specsafe-explore` if technical uncertainty dominates

## Output template

Suggested final structure:

```md
# Brainstorming Session: <topic>

## Context
- Topic:
- Desired outcome:
- Constraints:
- Session mode:
- Techniques used:

## Raw Idea Highlights
- ...

## Themes
### Theme 1: ...
- ideas
- implications

### Theme 2: ...
- ideas
- implications

## Tradeoffs and Tensions
- ...

## Risks and Edge Cases surfaced
- ...

## Most Promising Directions
1. ...
2. ...
3. ...

## Open Questions
- ...

## Recommended Next Step
- Run `/specsafe-principles`
```

## Integration with later planning

`specsafe-principles` should consume:
- standout ideas
- tensions
- quality priorities
- open questions

`specsafe-brief` should consume:
- chosen direction
- target user/value insight
- major scope boundaries

`specsafe-ux` and `specsafe-architecture` should later benefit from:
- interaction ideas
- data/flow implications
- edge-case insights

## Differences from BMAD to preserve

Keep from BMAD
- resumability
- mode selection
- facilitator stance
- anti-bias thinking
- organization and action planning

Do not copy directly
- arbitrary maximal idea counts
- generic creativity categories that do not help product/software work
- overly theatrical behavior as default
- unnecessary process weight in every session

## Suggested persona

Best option
- add a dedicated brainstorming/planning facilitator persona

Possible interim option
- Elena can temporarily host this skill until a dedicated facilitator exists

Preferred long-term characteristics
- curious
- energetic but grounded
- strong at prompting options without forcing conclusions
- aware of product, UX, engineering, and risk dimensions

## Guardrails

- never output only a flat list of ideas
- never skip user engagement unless explicitly requested
- never force architecture too early
- never treat brainstorming as implementation planning
- always surface risks and edge cases before concluding
- always recommend the next planning move

## Success criteria

A good `specsafe-brainstorm` session leaves the user with:
- clearer possibility space
- clearer constraints
- clearer next step
- a reusable artifact for later planning
- less ambiguity than when they started

## Recommended implementation notes

Files likely needed
- canonical skill directory for `specsafe-brainstorm`
- `SKILL.md`
- `workflow.md`
- optional technique library CSV or markdown reference
- tests for workflow structure and references

Recommended test expectations
- skill exists and is enumerated dynamically
- workflow includes facilitator stance
- workflow includes mode selection
- workflow includes theme clustering and next-step recommendation
- skill references downstream handoff to principles / brief / explore as appropriate
