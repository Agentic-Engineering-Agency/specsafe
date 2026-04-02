# Tool Support Guide

SpecSafe supports 8 AI coding tools across 3 tiers. Each tier determines how skills are delivered.

## Tiers

| Tier | Delivery | Tools |
|------|----------|-------|
| **1 — Full Skills** | Native skill/command files with frontmatter, per-skill directories, workflow files | claude-code, opencode, cursor |
| **2 — Conventions** | Single conventions/rules file with all SpecSafe guidance baked in | aider, zed, gemini, antigravity |
| **3 — Prompts** | Prompt files that can be invoked from the tool's prompt system | continue |

## Tier 1 Tools

### claude-code

**Install:** `specsafe install claude-code`

**Generated files:**
- `.claude/skills/<skill-name>/SKILL.md` — one per canonical skill (12 total)
- `.claude/skills/<skill-name>/workflow.md` — workflow files where applicable
- `CLAUDE.md` — project-level rules

**Invocation:** Use `/specsafe-init`, `/specsafe-new`, etc. from the Claude Code CLI. Skills are auto-discovered from `.claude/skills/`.

### opencode

**Install:** `specsafe install opencode`

**Generated files:**
- `.opencode/skills/<skill-name>/SKILL.md` — one per canonical skill
- `.opencode/skills/<skill-name>/workflow.md` — workflow files where applicable
- `.opencode/command/<skill-name>.md` — command stubs that reference the skill

**Invocation:** Use the OpenCode command system to invoke skills by name.

### cursor

**Install:** `specsafe install cursor`

**Generated files:**
- `.cursor/skills/<skill-name>/SKILL.md` — one per canonical skill
- `.cursor/skills/<skill-name>/workflow.md` — workflow files where applicable
- `.cursorrules` — project-level rules

**Invocation:** Reference skills in Cursor's chat or use the command palette.

## Tier 2 Tools

### aider

**Install:** `specsafe install aider`

**Generated files:**
- `.aider.conf.yml` — configures aider to read conventions and project state
- `CONVENTIONS.md` — all SpecSafe conventions and workflow guidance

**Notes:** Aider reads `CONVENTIONS.md` on every prompt. The config file ensures it's always loaded.

### zed

**Install:** `specsafe install zed`

**Generated files:**
- `.zed/prompts/<skill-name>.md` — prompt files for each skill

**Notes:** Zed prompts are available from the assistant panel.

### gemini

**Install:** `specsafe install gemini`

**Generated files:**
- `GEMINI.md` — project-level rules and conventions for Gemini

**Notes:** Gemini reads `GEMINI.md` automatically from the project root.

### antigravity

**Install:** `specsafe install antigravity`

**Generated files:**
- `AGENTS.md` — agent configuration with SpecSafe conventions

**Notes:** Antigravity reads `AGENTS.md` for agent behavior configuration.

## Tier 3 Tools

### continue

**Install:** `specsafe install continue`

**Generated files:**
- `.continue/prompts/<skill-name>.md` — invokable prompt per skill
- `.continue/agents/specsafe.yaml` — agent configuration (if available)

**Invocation:** Use Continue's slash command system to invoke prompts by name.
