# SPEC-20260211-003: OpenSpec-Style Workflow Implementation

**Status:** SPEC  
**Author:** Seshat  
**Created:** 2026-02-11  
**Target:** v0.4.0  

## Overview

Transform SpecSafe from a static spec tracker into a full **OpenSpec-style workflow engine** with AI-assisted commands for each stage of development.

## Current State vs Target

### Current SpecSafe (v0.3.x)
- Static spec files with manual stage progression
- Basic CLI commands (`new`, `spec`, `test`, `code`, `qa`, `complete`)
- AI tool configs (Claude Code skills, OpenCode commands)

### Target: OpenSpec-Style Workflow (v0.4.0)
| OpenSpec Command | SpecSafe Equivalent | Purpose |
|-----------------|---------------------|---------|
| `/opsx:new` | `/specsafe:new` | Create new spec with PRD, tech stack, rules |
| `/opsx:spec` | `/specsafe:spec` | Generate detailed spec from PRD |
| `/opsx:test` | `/specsafe:test` | Create tests from spec scenarios |
| `/opsx:dev` | `/specsafe:dev` | Develop implementation |
| `/opsx:verify` | `/specsafe:verify` | Run tests, loop back if fail |
| `/opsx:done` | `/specsafe:done` | Mark complete, archive |
| `/opsx:explore` | `/specsafe:explore` | Think through ideas before committing |

## New Commands to Implement

### 1. `/specsafe:new` — Initialize Spec with PRD
**Files created:**
- `specs/active/SPEC-YYYYMMDD-NNN.md` — Main spec with PRD section
- `.specsafe/tech-stack.md` — Tech decisions
- `.specsafe/rules.md` — Project-specific rules

**Claude Code SKILL.md:**
```yaml
---
name: specsafe-new
description: Create a new spec with PRD, tech stack, and rules
argument-hint: "[feature-name]"
disable-model-invocation: true
---

Create a new spec-driven development feature:

1. Ask user for feature name if not provided
2. Generate SPEC ID (SPEC-YYYYMMDD-NNN format)
3. Create PRD with:
   - Problem statement
   - User stories
   - Acceptance criteria
   - Technical considerations
4. Suggest tech stack options
5. Define project-specific rules/constraints
6. Create the spec file in specs/active/
7. Update PROJECT_STATE.md

Output: Ready for /specsafe:spec to generate detailed requirements
```

### 2. `/specsafe:spec` — Generate Detailed Spec
**Enhances existing spec with:**
- Detailed requirements section
- Scenarios with Given/When/Then
- Implementation notes
- Dependencies

**Files modified:**
- `specs/active/SPEC-*.md` — Add scenarios & requirements

### 3. `/specsafe:test` — Generate Tests
**Creates:**
- `tests/SPEC-*.test.ts` (or .spec.js, etc. based on framework)
- Tests derived from spec scenarios

**Files created:**
- Test files matching chosen framework (vitest/jest)

### 4. `/specsafe:dev` — Development Mode
**Guides implementation:**
- Read spec requirements
- Suggest implementation approach
- Track progress against spec
- Update spec stage to CODE

### 5. `/specsafe:verify` — Test & Loop
**Critical workflow command:**
1. Run generated tests (`npm test` or equivalent)
2. If tests pass → suggest `/specsafe:done`
3. If tests fail → analyze failures, suggest fixes, loop back to `/specsafe:dev`

**This is the key differentiator from current SpecSafe**

### 6. `/specsafe:done` — Complete & Archive
**Finalizes:**
1. Mark spec as COMPLETE
2. Move to `specs/archive/`
3. Generate summary
4. Update PROJECT_STATE.md

### 7. `/specsafe:explore` — Pre-commit Exploration
**For ideation before creating spec:**
- Discuss approaches
- Evaluate tradeoffs
- Output: Recommendation on whether to proceed

## Implementation Plan

### PR #43: New SKILL.md Files (Opus Subagent)
Create 7 new SKILL.md files for each command:
- `.claude/skills/specsafe-new/SKILL.md`
- `.claude/skills/specsafe-spec/SKILL.md`
- `.claude/skills/specsafe-test/SKILL.md`
- `.claude/skills/specsafe-dev/SKILL.md`
- `.claude/skills/specsafe-verify/SKILL.md`
- `.claude/skills/specsafe-done/SKILL.md`
- `.claude/skills/specsafe-explore/SKILL.md`

Same for OpenCode: `.opencode/commands/specsafe-*.md`

### PR #44: Enhanced CLI Commands (Opus Subagent)
Update CLI with new commands:
- `specsafe new` → Interactive PRD creation
- `specsafe spec <id>` → Enhance with AI-assisted spec generation
- `specsafe test <id>` → Generate tests from scenarios
- `specsafe dev <id>` → Development guidance mode
- `specsafe verify <id>` → Run tests with pass/fail loop
- `specsafe done <id>` → Complete workflow
- `specsafe explore` → Pre-spec exploration

### PR #45: Test Runner Integration (Opus Subagent)
- Detect test framework (vitest/jest)
- Run tests programmatically
- Parse results
- Auto-loop on failure

### PR #46: Workflow State Machine (Opus/Codex)
- Track workflow state per spec
- Enforce stage progression
- Handle loopbacks (verify → dev → verify)

## Linear Tasks to Create

| ID | Title | Priority | Description |
|----|-------|----------|-------------|
| SPEC-32 | Create specsafe-new SKILL.md | P1 | PRD + tech stack + rules generation |
| SPEC-33 | Create specsafe-spec SKILL.md | P1 | Detailed spec generation |
| SPEC-34 | Create specsafe-test SKILL.md | P1 | Test generation from scenarios |
| SPEC-35 | Create specsafe-dev SKILL.md | P1 | Development guidance |
| SPEC-36 | Create specsafe-verify SKILL.md | P1 | Test runner with pass/fail loop |
| SPEC-37 | Create specsafe-done SKILL.md | P1 | Complete & archive |
| SPEC-38 | Create specsafe-explore SKILL.md | P2 | Pre-spec exploration |
| SPEC-39 | Implement CLI new command | P1 | Interactive PRD creation |
| SPEC-40 | Implement CLI verify command | P1 | Test runner integration |
| SPEC-41 | Update all AI tool configs | P1 | 7 skills × 7 tools = 49 files |
| SPEC-42 | Test workflow end-to-end | P1 | Full spec lifecycle test |

## Notes

- Focus on **verify** command — this is the loop mechanism OpenSpec has
- Keep skills **separate** (not one big file) for modularity
- Each skill should be **self-contained** with clear purpose
- Use `disable-model-invocation: true` for all (dedicated commands, not auto-load)
