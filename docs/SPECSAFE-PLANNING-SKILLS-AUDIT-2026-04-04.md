# Specsafe Planning Skills Audit

Date: 2026-04-04
Status: Planning-surface audit for refactor
Decision basis: Refactor confirmed

## Scope

Reviewed planning-facing skills and related personas:
- `specsafe-explore`
- `specsafe-brief`
- `specsafe-prd`
- `specsafe-ux`
- `specsafe-architecture`
- `specsafe-context`
- `specsafe-skill-creator`
- planning-related personas in `specsafe/canonical/personas/`

Goal of this audit:
- decide what to keep
- decide what to rewrite
- decide what to merge or de-emphasize
- identify new skills to add

## High-level judgment

Specsafe's planning layer is salvageable and worth preserving, but it is not yet the operating system the product needs.

Main issues:
- no first-class brainstorming skill
- no first-class principles stage
- no readiness gate before implementation
- inconsistent handoffs between existing planning skills
- planning personas are too compressed in some places
- planning rules are overshadowed by the 5-stage development framing

## Skill-by-skill decisions

### 1. `specsafe-explore`
Current role
- Pre-spec exploration and research mode.
- Strong on clarifying problem, reading code, finding patterns, and recommending a path forward.

Strengths
- useful for brownfield investigation
- good guardrails
- evidence-oriented
- a strong bridge into spec creation for technical work

Weaknesses
- not a brainstorming system
- more diagnostic than generative
- currently easier to confuse with planning-phase ideation than it should be

Decision
- Keep, but narrow and clarify.

Action
- Reposition as technical exploration / discovery, especially for brownfield and implementation-risk discovery.
- Do not use it as the substitute for brainstorming.

Recommended status
- KEEP + REFRAME

### 2. `specsafe-brief`
Current role
- Creates product brief.
- Currently uses Kai the Spec Architect persona.

Strengths
- useful artifact
- correct general place in planning sequence
- already hands off cleanly to PRD

Weaknesses
- persona is too spec-centric for product briefing
- likely too formal and narrow for early product framing
- should absorb output from brainstorming and principles, which do not yet exist

Decision
- Keep, but rewrite persona framing and inputs.

Action
- Feed from brainstorming + principles artifacts.
- Consider moving from Kai to a product/strategy persona, or introduce a distinct planning persona.
- Preserve concise output.

Recommended status
- KEEP + REWRITE

### 3. `specsafe-prd`
Current role
- Builds a PRD from the brief.

Strengths
- sensible structure
- testable requirement orientation is good
- useful discipline for requirements and scope

Weaknesses
- handoff is ambiguous: it currently says next can be architecture or UX
- still reflects older architecture/UX ordering uncertainty
- should explicitly depend on finalized principles and UX-before-architecture policy

Decision
- Keep, but rewrite handoff logic and planning assumptions.

Action
- Preserve requirement rigor.
- Update outputs and handoff to point to UX first, then architecture.
- Include stronger documentation-first prompts when product choices involve specific frameworks or platforms.

Recommended status
- KEEP + REWRITE

### 4. `specsafe-ux`
Current role
- Creates UX design foundations and writes `docs/ux-design.md`.

Strengths
- clearly useful for the target workflow
- persona is directionally correct
- aligned with the user's preferred process

Weaknesses
- currently hands off directly to `specsafe-new`
- this breaks the preferred planning order because architecture should come after UX
- likely needs more explicit links to data/flows/state transitions that architecture will consume

Decision
- Keep and materially rewrite handoff/output expectations.

Action
- Make UX hand off to architecture, not directly to spec creation.
- Add explicit sections that architecture should consume:
  - key journeys
  - interaction/state implications
  - data capture points
  - accessibility requirements
  - edge cases and failure states

Recommended status
- KEEP + REWRITE

### 5. `specsafe-architecture`
Current role
- Creates architecture doc with architect persona.

Strengths
- valuable artifact
- persona is appropriate
- architecture-after-planning is conceptually correct

Weaknesses
- currently allows UX to come after architecture or bypasses directly to spec creation
- should be downstream of UX in the canonical workflow
- should probably be stronger on diagrams, data model, flows, boundaries, and rationale

Decision
- Keep and materially rewrite.

Action
- Make architecture depend on UX and PRD alignment.
- Expand required outputs:
  - system overview
  - data model/schema
  - component/layer boundaries
  - API/integration boundaries
  - failure modes
  - Mermaid and Excalidraw-ready diagram guidance
- Hand off to readiness, not directly to `specsafe-new`.

Recommended status
- KEEP + REWRITE

### 6. `specsafe-context`
Current role
- Generates project context for AI tools.

Strengths
- useful supporting utility
- can improve AI implementation quality
- useful for brownfield work and agent handoffs

Weaknesses
- not a core planning phase artifact
- currently more operational than product-defining

Decision
- Keep as a utility, not as a primary planning stage.

Action
- Reposition as a support skill invoked when needed:
  - before implementation
  - before agent delegation
  - for brownfield repo onboarding

Recommended status
- KEEP AS UTILITY

### 7. `specsafe-skill-creator`
Current role
- Helps create custom Specsafe skills.

Strengths
- useful internal meta-tool
- already reflects the desired planning order better than some core workflows do

Weaknesses
- not part of end-user default planning flow
- current persona choice may be acceptable but should not drive planning philosophy

Decision
- Keep as an internal/extensibility tool.

Action
- Update once the canonical workflow is stabilized so it teaches the new truth.

Recommended status
- KEEP AS INTERNAL TOOL

## New skills to add

### A. `specsafe-brainstorm`
Why
- highest-value missing capability
- should become the true entry point for ambiguous ideas

Must have
- selectable ideation modes
- AI-recommended techniques
- resumable session flow
- idea clustering and prioritization
- output artifact that downstream planning skills consume

Recommended status
- ADD

### B. `specsafe-principles`
Why
- user explicitly wants an idea/principles stage
- helps stabilize later brief/PRD/UX/architecture decisions

Must have
- product intent
- design/engineering principles
- non-goals
- decision heuristics
- quality priorities

Recommended status
- ADD

### C. `specsafe-readiness`
Why
- missing pre-development gate
- should validate planning coherence before spec slices begin

Must have
- brief/prd/ux/architecture alignment
- unresolved contradiction list
- implementation unknowns
- documentation sufficiency check
- GO / NEEDS WORK decision

Recommended status
- ADD

### D. `specsafe-party-mode`
Why
- user explicitly wants BMAD-style party mode borrowed into Specsafe
- valuable for high-ambiguity planning, tradeoff debates, and review sessions

Must have
- facilitator stance
- selectable roster, not mandatory full roster
- best used for brainstorming, principles, architecture debates, readiness reviews
- explicit session purpose and closure

Recommended status
- ADD

## Persona audit

### Current personas
- `scout-elena`
- `mason-kai`
- `forge-reva`
- `bolt-zane`
- `warden-lyra`
- `herald-cass`
- `prism-aria`
- `sage-nolan`

### Persona decisions

#### Elena / Scout
Decision
- Keep
Reason
- Strong fit for exploration and discovery
Status
- KEEP

#### Kai / Mason
Decision
- Keep, but reduce planning overload
Reason
- Good for specs; currently stretched across brief + PRD where a product-focused role may fit better
Status
- KEEP + NARROW

#### Reva / Forge
Decision
- Keep
Reason
- Clear role in tests-first development
Status
- KEEP

#### Zane / Bolt
Decision
- Keep
Reason
- Clear role in implementation
Status
- KEEP

#### Lyra / Warden
Decision
- Keep
Reason
- Strong QA/verification posture
Status
- KEEP

#### Cass / Herald
Decision
- Keep
Reason
- Useful for completion/status/release-facing workflow work
Status
- KEEP

#### Aria / Prism
Decision
- Keep and strengthen
Reason
- essential for UX-first planning stage
Status
- KEEP + STRENGTHEN

#### Nolan / Sage
Decision
- Keep and strengthen
Reason
- essential for architecture stage
Status
- KEEP + STRENGTHEN

### Missing persona distinctions

Most likely addition needed
- a dedicated brainstorming/planning facilitator

Maybe needed
- a dedicated product/brief persona if Kai remains too spec-centric after rewrite

Do not add unless needed
- excessive persona proliferation like a full BMAD clone

## Delete / merge decisions

Delete now
- none

Merge now
- none mandatory

De-emphasize
- using `specsafe-explore` as a catch-all planning entry point
- using `specsafe-context` as if it were a core planning artifact

## Recommended canonical planning surface after refactor

Core Phase 1 skills
1. `specsafe-brainstorm`
2. `specsafe-principles`
3. `specsafe-brief`
4. `specsafe-prd`
5. `specsafe-ux`
6. `specsafe-architecture`
7. `specsafe-readiness`

Supporting utilities
- `specsafe-explore`
- `specsafe-context`
- `specsafe-party-mode`
- `specsafe-skill-creator`

## Testing implications

The current tests hardcode outdated lists:
- `specsafe/tests/skills.test.ts` only includes 12 skills
- `specsafe/tests/personas.test.ts` only includes 6 personas

Refactor requirement
- switch tests to dynamic filesystem enumeration so new planning skills/personas cannot silently bypass validation

## Final verdict

Keep the planning layer, but rewrite its orchestration.

Keep:
- `explore`
- `brief`
- `prd`
- `ux`
- `architecture`
- `context`
- `skill-creator`
- existing core personas

Rewrite heavily:
- planning handoffs
- persona-to-skill mapping for planning
- UX and architecture expectations
- rule files and product framing

Add:
- brainstorming
- principles
- readiness
- party mode
