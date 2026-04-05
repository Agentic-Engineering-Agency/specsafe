# Specsafe Refactor Implementation Plan

Status: Ready for execution
Date: 2026-04-04
Depends on: All design docs in `specsafe/docs/`

## Execution philosophy

- small commits
- tests updated before or alongside each change
- correctness fixes first, then workflow changes, then new capabilities
- Hermes orchestrates and reviews; Claude Code does implementation
- each tier is independently shippable

## Reference documents

| Document | Path | Purpose |
|----------|------|---------|
| Canonical workflow | `docs/SPECSAFE-CANONICAL-WORKFLOW.md` | Source of truth |
| Gap analysis | `docs/SPECSAFE-BMAD-GAP-ANALYSIS-2026-04-04.md` | BMAD comparison |
| Refactor decision | `docs/SPECSAFE-REFRACTOR-DECISION-2026-04-04.md` | Why refactor |
| Skills audit | `docs/SPECSAFE-PLANNING-SKILLS-AUDIT-2026-04-04.md` | Keep/rewrite/add |
| Brainstorm design | `docs/SPECSAFE-BRAINSTORM-DESIGN.md` | New skill spec |
| Principles design | `docs/SPECSAFE-PRINCIPLES-DESIGN.md` | New skill spec |
| Readiness design | `docs/SPECSAFE-READINESS-DESIGN.md` | New skill spec |
| Party mode design | `docs/SPECSAFE-PARTY-MODE-DESIGN.md` | New skill spec |
| Codebase audit | `docs/CODEBASE-AUDIT-2026-04-04.md` | Bug list |

---

## Tier 0: Correctness fixes

Priority: Highest — do before any feature work.
Estimated scope: ~8 localized changes.

### T0-1: Fix ToolAdapter parameter name mismatch
- File: `generators/src/adapters/types.ts:35`
- Change: rename `projectRoot` to `canonicalDir` in the `ToolAdapter` interface
- Audit: `generate()` signature
- Test: existing adapter tests should still pass; verify no callers break

### T0-2: Fix __dirname fallback
- Files: `generators/src/init.ts:8`, `install.ts:11`, `update.ts:8`
- Change: replace `resolve(__filename, '..')` with `dirname(__filename)`
- Import: add `import { dirname } from 'node:path'` if missing
- Test: verify canonical skill loading works under Node 18-20

### T0-3: Make test arrays dynamic
- Files: `tests/skills.test.ts`, `tests/personas.test.ts`
- Change: read skill dirs and persona files from filesystem instead of hardcoded arrays
- Benefit: all 18+ skills and 8+ personas automatically covered
- Preserve: existing structural checks (frontmatter, workflow, persona blocks, sections)

### T0-4: Fix version mismatch
- Files: root `package.json`, `generators/package.json`, config template
- Change: synchronize version numbers
- Change: fix `join(__dirname, '..', '..', 'package.json')` resolution in `generators/src/index.ts`

### T0-5: Fix config overwrite in Zed and Aider adapters
- Files: `generators/src/adapters/zed.ts`, `aider.ts`
- Change: merge with existing user config instead of full overwrite
- Test: verify existing settings are preserved on install/update

### T0-6: Fix YAML frontmatter parser
- File: `generators/src/adapters/utils.ts:6-25`
- Change: replace hand-rolled parser with `js-yaml` or add proper colon handling
- Test: descriptions containing colons should not be truncated

### T0-7: Fix Gemini TOML injection
- File: `generators/src/adapters/gemini.ts:32-33`
- Change: escape `"`, `\\`, and newlines in interpolated TOML values
- Test: description with quotes produces valid TOML

### T0-8: Add temp dir cleanup to adapter tests
- Files: `generators/__tests__/adapters/*.test.ts`
- Change: add `afterEach` cleanup
- Test: no temp dir leaks

### T0-9: Run Biome auto-fix
- Command: `npx @biomejs/biome check --fix generators/src/ tests/`
- Resolves: 37 of 48 style issues
- Manually address remaining 11

---

## Tier 1: Workflow truthfulness

Priority: High — makes the product tell the truth about how it should be used.
Depends on: Tier 0 complete.

### T1-1: Update README.md
- Reframe Specsafe as a two-phase system
- Add Phase 1: Planning section listing all planning skills
- Preserve Phase 2: Development section with existing 5-stage table
- Update skills reference to include all 18+ skills
- Update personas table to include Aria and Nolan
- Remove "All 12 canonical skills" framing
- Add link to canonical workflow doc

### T1-2: Update canonical rule files
- Files: `canonical/rules/CLAUDE.md`, `GEMINI.md`, `CONVENTIONS.md`, `AGENTS.md`, `.cursorrules.mdc`, `.rules`, `continue-config.yaml`
- Change: add Phase 1 planning overview before the 5-stage dev table
- Change: list planning skills with brief descriptions
- Change: preserve the development pipeline table
- Change: note that planning precedes development in the intended workflow

### T1-3: Rewrite specsafe-brief handoff
- File: `canonical/skills/specsafe-brief/workflow.md`
- Current handoff: -> `specsafe-prd`
- New handoff: -> `specsafe-prd` (unchanged, this is already correct)
- Change: add precondition noting `docs/product-principles.md` as recommended input
- Change: update persona framing if a dedicated product persona is introduced

### T1-4: Rewrite specsafe-prd handoff
- File: `canonical/skills/specsafe-prd/workflow.md`
- Current handoff: -> `specsafe-architecture` or `specsafe-ux`
- New handoff: -> `specsafe-ux` (singular, canonical)
- Change: update all references to say UX is next, not architecture

### T1-5: Rewrite specsafe-ux handoff
- File: `canonical/skills/specsafe-ux/workflow.md`
- Current handoff: -> `specsafe-new`
- New handoff: -> `specsafe-architecture`
- Change: update handoff text and section

### T1-6: Rewrite specsafe-architecture handoff
- File: `canonical/skills/specsafe-architecture/workflow.md`
- Current handoff: -> `specsafe-ux` or `specsafe-new`
- New handoff: -> `specsafe-readiness` (once it exists), or -> `specsafe-new` as interim
- Change: remove "or UX" since UX is now upstream

### T1-7: Update specsafe-skill-creator pipeline reference
- File: `canonical/skills/specsafe-skill-creator/workflow.md`
- Current pipeline string: `BRIEF -> PRD -> UX -> ARCH -> SPEC -> TEST -> CODE -> QA -> COMPLETE`
- New pipeline string: `BRAINSTORM -> PRINCIPLES -> BRIEF -> PRD -> UX -> ARCH -> READINESS -> SPEC -> TEST -> CODE -> QA -> COMPLETE`

---

## Tier 2: New planning skills

Priority: Core new value.
Depends on: Tier 1 for handoff consistency.

### T2-1: Create specsafe-brainstorm
Reference: `docs/SPECSAFE-BRAINSTORM-DESIGN.md`

Files to create:
- `canonical/skills/specsafe-brainstorm/SKILL.md`
- `canonical/skills/specsafe-brainstorm/workflow.md`
- optional: `canonical/skills/specsafe-brainstorm/techniques.md` or CSV

SKILL.md requirements:
- frontmatter: name, description, disable-model-invocation: true
- body references workflow.md

workflow.md requirements:
- persona block
- preconditions section
- session setup step
- mode selection step
- divergent ideation step
- theme clustering step
- convergence step
- next-step recommendation
- guardrails section
- handoff to specsafe-principles

Test: dynamic enumeration should pick this up automatically after T0-3.

### T2-2: Create specsafe-principles
Reference: `docs/SPECSAFE-PRINCIPLES-DESIGN.md`

Files to create:
- `canonical/skills/specsafe-principles/SKILL.md`
- `canonical/skills/specsafe-principles/workflow.md`

SKILL.md requirements:
- standard frontmatter
- body references workflow.md

workflow.md requirements:
- persona block
- preconditions (reads brainstorming artifact if available)
- product intent step
- core principles elicitation step
- non-goals step (mandatory)
- quality priorities ranking step
- decision heuristics step
- review and save step
- guardrails section
- handoff to specsafe-brief

### T2-3: Create specsafe-readiness
Reference: `docs/SPECSAFE-READINESS-DESIGN.md`

Files to create:
- `canonical/skills/specsafe-readiness/SKILL.md`
- `canonical/skills/specsafe-readiness/workflow.md`

SKILL.md requirements:
- standard frontmatter
- body references workflow.md

workflow.md requirements:
- persona block (Lyra / Warden recommended)
- artifact inventory step
- cross-artifact alignment step
- external dependency audit step
- implementation slicing assessment step
- open questions consolidation step
- verdict: GO / NEEDS REVISION / BLOCKED
- guardrails section
- handoff to specsafe-new on GO

### T2-4: Add personas if needed
Evaluate after T2-1 through T2-3 whether:
- a dedicated brainstorming facilitator persona is needed
- a dedicated product/strategy persona is needed for brief work

If yes:
- create new persona file(s) in `canonical/personas/`
- update workflow references
- tests should pick them up dynamically

---

## Tier 3: Party mode and collaboration

Priority: Valuable but can ship after Tier 2.
Depends on: Tier 2 skills exist.

### T3-1: Create specsafe-party-mode
Reference: `docs/SPECSAFE-PARTY-MODE-DESIGN.md`

Files to create:
- `canonical/skills/specsafe-party-mode/SKILL.md`
- `canonical/skills/specsafe-party-mode/workflow.md`

SKILL.md requirements:
- standard frontmatter
- body references workflow.md

workflow.md requirements:
- facilitator role description
- session setup step (purpose, artifacts, roster selection)
- roster selection step (AI-recommended or user-selected)
- discussion orchestration step with round structure
- clarifying questions step
- synthesis and recommendation step
- guardrails against overuse
- handoff depends on session context

### T3-2: Add documentation-first checklist to implementation skills
- Files: `specsafe-code/workflow.md`, `specsafe-test/workflow.md`
- Change: add a precondition step that checks whether named frameworks/tools require doc lookup
- Light touch: do not block workflow, but surface the prompt

### T3-3: Create Claude Code prompt template
- File: `docs/claude-code-prompt-template.md` or a new canonical template
- Purpose: standard template Hermes uses when crafting prompts for Claude Code agents
- Sections:
  - objective
  - current phase and spec slice
  - relevant constraints from principles/UX/architecture
  - documentation excerpts when applicable
  - testing requirements
  - edge cases
  - quality bar / "do not mark complete unless..."

---

## Tier 4: Quality and polish

Priority: Ongoing.
Depends on: Tiers 0-3 substantially complete.

### T4-1: Add Biome check to CI
- File: `.github/workflows/ci.yml`
- Change: add `npx @biomejs/biome check generators/src/ tests/`

### T4-2: Evaluate setup questions
- Review `specsafe init` flow
- Likely remove: language question
- Evaluate: testing tool question (keep, default, or defer to natural language)
- Reference: user's notes in memory

### T4-3: Update CONTRIBUTING.md
- Reflect two-phase workflow
- Document planning skill structure expectations
- Document test expectations for new skills

### T4-4: Update docs/tool-support.md and docs/personas.md
- Reflect new planning skills and personas

### T4-5: Consider adapter updates for new planning skills
- Claude Code adapter: include planning skill generation
- Other adapters: evaluate which planning skills should be exposed per tool tier

---

## Execution strategy

### Recommended agent assignment

Tier 0:
- Claude Code implements fixes
- Hermes reviews and tests

Tier 1:
- Hermes drafts content changes
- Claude Code applies them
- Hermes verifies consistency across all rule files

Tier 2:
- Hermes drafts skill content from design docs
- Claude Code creates files and integrates
- Hermes reviews workflow quality and guardrail coverage

Tier 3:
- same as Tier 2

### Recommended commit strategy

One commit per task ID.
Conventional commit messages:
- `fix: rename projectRoot to canonicalDir in ToolAdapter (T0-1)`
- `fix: use dirname() for __dirname fallback (T0-2)`
- `test: dynamic skill/persona enumeration (T0-3)`
- `docs: reframe README as two-phase system (T1-1)`
- `feat: add specsafe-brainstorm skill (T2-1)`
- etc.

### Estimated scope

| Tier | Tasks | Estimated effort |
|------|-------|-----------------|
| 0 | 9 | Small — localized fixes |
| 1 | 7 | Medium — content rewrites |
| 2 | 4 | Medium-large — new skills |
| 3 | 3 | Medium — new capabilities |
| 4 | 5 | Small — polish |

Total: 28 tasks across 5 tiers.

---

## Definition of done for each tier

### Tier 0
- all tests pass
- tsc clean
- biome auto-fixes applied
- no known correctness bugs remaining from audit

### Tier 1
- README reflects two-phase workflow
- all rule files describe planning + development
- all planning skill handoffs follow canonical order
- no skill says "next: architecture or UX" — the order is singular

### Tier 2
- brainstorm, principles, and readiness skills exist
- each has SKILL.md with valid frontmatter and workflow.md with required sections
- tests dynamically cover all new skills
- handoffs are consistent with canonical workflow

### Tier 3
- party mode exists and works
- documentation-first prompt exists in implementation skills
- Claude Code prompt template exists

### Tier 4
- CI includes biome
- setup questions evaluated and simplified
- all docs updated
