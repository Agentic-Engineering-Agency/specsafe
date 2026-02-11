# SPEC-20260211-002: v0.3.0 — Claude Code & Crush Integration

**Status:** SPEC  
**Author:** Seshat  
**Created:** 2026-02-11  
**Target:** v0.3.0  

## Overview

Add SpecSafe integration for two additional AI coding tools:
1. **Claude Code** (Anthropic) — The most popular AI coding agent
2. **Crush** (Charmbracelet, formerly OpenCode) — Multi-model terminal coding agent

## Tool Analysis

### Claude Code
- **Config mechanism:** Markdown files in hierarchical locations
  - `CLAUDE.md` — Project-level instructions (committed to repo)
  - `CLAUDE.local.md` — Personal project preferences (gitignored)
  - `.claude/CLAUDE.md` — Alternative project location
  - `.claude/rules/*.md` — Modular topic-specific rules
  - `.claude/settings.json` — Settings and plugin config
- **Detection:** Presence of `CLAUDE.md` or `.claude/` directory
- **Context model:** Hierarchical — user > project > rules, more specific wins
- **Docs:** https://code.claude.com/docs/en/memory

### Crush (formerly OpenCode)
- **Config mechanism:** Markdown context files + JSON config
  - `CRUSH.md` / `crush.md` / `Crush.md` — Project context
  - `AGENTS.md` — Universal agent context (also read by Crush)
  - `.crush/` — Data directory with config
- **Detection:** Presence of `CRUSH.md`, `crush.md`, or `.crush/` directory
- **Note:** Crush also reads `.cursorrules`, `CLAUDE.md`, `GEMINI.md` — it's a meta-agent
- **Docs:** https://github.com/charmbracelet/crush
- **Verified:** OpenCode (opencode-ai/opencode) is archived, explicitly redirects to Crush

## Requirements

### R1: Claude Code Configuration Files
Create `rules/claude-code/` with:
- `CLAUDE.md` — SpecSafe project instructions for Claude Code
  - Explain spec-driven development workflow
  - Reference PROJECT_STATE.md, specs/active/
  - Stage progression rules (SPEC → TEST → CODE → QA → COMPLETE)
  - CLI commands reference
- `.claude/rules/specsafe.md` — Modular rule for spec workflow

### R2: Crush Configuration Files
Create `rules/crush/` with:
- `CRUSH.md` — SpecSafe project instructions for Crush
  - Same SDD workflow as Claude Code but formatted for Crush conventions
  - Reference PROJECT_STATE.md and spec files

### R3: Registry Updates
Update `packages/cli/src/rules/registry.ts`:
```typescript
{
  name: 'claude-code',
  description: 'Claude Code by Anthropic',
  files: ['CLAUDE.md'],
},
{
  name: 'crush',
  description: 'Crush (formerly OpenCode) by Charmbracelet',
  files: ['CRUSH.md'],
},
```

### R4: Manifest Updates
Update `rules/manifest.json` with source mappings for both tools.

### R5: Tool Detection Updates
Update interactive `specsafe init` to detect:
- Claude Code: check for `.claude/` directory or `CLAUDE.md`
- Crush: check for `.crush/` directory or `CRUSH.md`

### R6: Test Coverage
- Registry tests for new tool definitions
- Detection tests for Claude Code and Crush
- Rules command tests for add/remove/update with new tools

## Implementation Plan

### PR #28: Rules Content — Claude Code & Crush configs
- Create `rules/claude-code/CLAUDE.md`
- Create `rules/claude-code/.claude/rules/specsafe.md` (optional — modular rule)
- Create `rules/crush/CRUSH.md`
- Update `rules/manifest.json`

### PR #29: Registry & Detection — Tool infrastructure
- Update `registry.ts` with new tool definitions
- Update `detectTools.ts` / `generateToolConfig.ts` for new tools
- Update tests

### PR #30 (if needed): Interactive init updates
- Add Claude Code and Crush to tool detection in `specsafe init`

## Merge Order
1. PR #28 (content) → PR #29 (infrastructure) → PR #30 (init updates)

## Notes
- Crush reads multiple context file formats (AGENTS.md, CLAUDE.md, .cursorrules) — our CRUSH.md is additive
- Claude Code's `.claude/rules/*.md` modular system is powerful but optional for v0.3.0
- Google Antigravity deferred — insufficient public documentation available
