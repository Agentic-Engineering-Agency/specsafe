# Specsafe Party Mode Design

Status: Design draft
Version: 0.1
Date: 2026-04-04
Primary reference: BMAD Party Mode
Primary constraint: Must remain useful, selective, and non-gimmicky for serious software engineering work.

## Purpose

`specsafe-party-mode` is an optional, facilitator-led, multi-perspective discussion mode for high-ambiguity planning and review work.

It is designed to help when one viewpoint is not enough.

It is not meant to be always on.
It is not meant to summon every persona by default.
It is not meant to create noise for ordinary coding tasks.

## Product position

Party mode exists to produce better decisions through structured perspective diversity.

It should be used when:
- a problem has meaningful tradeoffs
- multiple disciplines should weigh in
- the user wants a collaborative planning or review session
- ambiguity is high enough that different expert stances add value

It should not be used when:
- a task has a clear owner and low ambiguity
- simple implementation should just proceed
- the discussion would only duplicate what one persona already knows

## Core design principle

Focused roster selection over full roster chaos.

BMAD's party mode is broad and entertaining. Specsafe's version should be narrower and more intentional.

Default rule
- choose 2-4 relevant personas
- only use more when the session genuinely benefits

## Primary use cases

### 1. Brainstorming boost
Bring together complementary lenses for ideation.

Example roster
- brainstorm facilitator
- product/brief persona
- UX persona
- architect persona

### 2. Principles alignment
Use when several good directions exist and the team must choose values and non-goals.

Example roster
- product persona
- UX persona
- architect persona
- QA/risk persona

### 3. Architecture tradeoff review
Use when there are meaningful system design choices and downstream impacts.

Example roster
- architect persona
- UX persona
- QA persona
- implementation persona

### 4. Readiness review
Use before implementation begins to challenge whether planning artifacts are coherent enough.

Example roster
- product persona
- UX persona
- architect persona
- QA persona

### 5. Post-implementation challenge session
Use when a result “works” but confidence is low.

Example roster
- implementation persona
- QA persona
- UX persona
- architect persona

## Inputs

Required
- session purpose
- current question / challenge

Optional
- paths to existing artifacts (brief, PRD, UX, architecture, spec, QA report)
- requested roster
- discussion mode / desired intensity

## Outputs

Primary output
- structured discussion summary

Optional artifact
- `docs/party-mode/<session-name>.md`

Summary should include:
- session purpose
- personas involved
- key agreements
- key disagreements
- unresolved questions
- recommended next action

## Workflow design

### Step 1: Session setup
Capture:
- what decision or question the session is about
- which artifacts are relevant
- whether the user wants a suggested roster or custom roster
- whether the goal is ideation, critique, or validation

### Step 2: Roster selection
Offer two paths:
- AI-recommended roster
- user-selected roster

The system should recommend the smallest roster that gives real perspective diversity.

### Step 3: Facilitated discussion rounds
The facilitator should orchestrate discussion in rounds rather than dumping all personas at once.

Recommended round types:
1. opening viewpoints
2. tensions / disagreements
3. convergence / recommendation

This keeps the output readable and prevents chaos.

### Step 4: Clarifying questions
If the personas expose missing information, the facilitator asks the user for what is needed before continuing.

### Step 5: Summary and recommendation
The session ends with a clear synthesis:
- where personas agree
- where they disagree
- what should happen next

## Facilitator behavior

The facilitator is responsible for:
- keeping the discussion relevant
- selecting and rotating speakers intentionally
- preventing repetitive circular debates
- preserving each persona's distinct stance
- converting discussion into actionable synthesis

The facilitator is not just another persona.
The facilitator is the moderator and synthesizer.

## Persona roster design

### Recommended core roster types

Planning roster
- brainstorm facilitator
- product/brief persona
- UX persona
- architect persona

Execution review roster
- implementation persona
- QA persona
- architect persona
- UX persona if the change is user-visible

Readiness roster
- product persona
- UX persona
- architect persona
- QA persona

### Persona selection heuristics

If the issue is mostly product ambiguity:
- product + UX + architect

If the issue is mostly technical tradeoff:
- architect + implementation + QA

If the issue is mostly UX quality:
- UX + product + QA + architect if system constraints matter

If the issue is implementation quality:
- implementation + QA + architect

## Discussion styles

Suggested modes:

### Mode A: Collaborative
- personas build on each other
- lighter disagreement
- good for early ideation

### Mode B: Debate
- personas explicitly challenge each other
- good for tradeoffs and architecture decisions

### Mode C: Review board
- personas inspect artifacts against quality criteria
- good for readiness and QA-like sessions

Default recommendation
- collaborative for brainstorming
- debate for architecture tensions
- review board for readiness and post-implementation challenge

## Proposed output format

```md
# Party Mode Session: <topic>

## Purpose
- ...

## Personas involved
- ...

## Discussion highlights
### Agreements
- ...

### Disagreements
- ...

### Risks surfaced
- ...

### Open questions
- ...

## Facilitator synthesis
- ...

## Recommendation
- Run `/specsafe-principles`
- Revise `docs/ux-design.md`
- Block implementation until architecture is updated
```

## Differences from BMAD to preserve

Keep from BMAD
- facilitator-led orchestration
- persona-driven differentiated voices
- structured entry and exit
- explicit session state
- natural cross-perspective value

Do not copy directly
- full-roster-by-default behavior
- excessive theatricality
- long conversational sprawl without synthesis
- party mode as entertainment rather than a decision tool

## Recommended artifact flow integration

Inputs that party mode should be able to review
- brainstorming artifact
- principles doc
- product brief
- PRD
- UX spec
- architecture doc
- readiness report
- active spec slice
- QA report

Outputs party mode may recommend
- revise principles
- revise brief
- revise PRD
- revise UX
- revise architecture
- proceed to readiness
- proceed to implementation
- loop back to exploration

## Guardrails

- never use party mode by default for routine work
- never load all personas unless explicitly justified
- never let persona performance overshadow useful decision-making
- always end with synthesis and a recommendation
- always surface disagreements clearly instead of averaging them away
- always keep the session attached to a concrete question or artifact

## Suggested implementation structure

Files likely needed
- canonical skill directory for `specsafe-party-mode`
- `SKILL.md`
- `workflow.md`
- optional roster/rules reference

Potential workflow sections
- initialization
- roster selection
- discussion orchestration
- clarifying question handling
- synthesis
- graceful conclusion

## Testing expectations

The skill should be validated for:
- facilitator stance
- roster selection logic
- discussion rounds structure
- synthesis requirement
- recommendation requirement
- explicit guardrails against default overuse

## Success criteria

A good party mode session should leave the user with:
- better decisions than a single perspective would likely produce
- clearer agreements and disagreements
- sharper articulation of tradeoffs
- a recommended next move
- no unnecessary chaos or process drag

## Recommended launch scope

MVP
- AI-recommended or user-selected roster
- 2-4 personas
- collaborative + debate + review-board modes
- summary artifact
- next-step recommendation

Later enhancements
- saved favorite rosters
- artifact-aware roster auto-suggestions
- stronger integration with readiness and QA flows
- optional Claude Code prompt export for downstream execution
