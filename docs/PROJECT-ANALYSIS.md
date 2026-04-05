# SpecSafe Project Analysis

Generated: 2026-04-04

## 1. Project Identity

**Name:** SpecSafe (`@specsafe/cli` on npm)
**Version:** 2.1.0 (root package.json), generators sub-package at 2.0.0
**License:** MIT
**Repository:** https://github.com/Agentic-Engineering-Agency/specsafe

**What it is:** SpecSafe is a skills-first TDD (Test-Driven Development) framework for AI-assisted development. It provides a structured 5-stage workflow (SPEC, TEST, CODE, VERIFY/QA, COMPLETE) that keeps AI coding agents aligned with human intent through specifications, test-driven implementation, and QA gates.

**Problem it solves:** AI coding tools (Claude Code, Cursor, Aider, etc.) lack enforced TDD workflows. Developers using AI assistants face: no test-before-code enforcement, specs drifting from implementation, no traceability of decisions, inconsistent AI behavior across sessions, and no quality gates before shipping. SpecSafe addresses all of these with a rigid spec-driven pipeline.

**Target users:** Developers using AI coding assistants who want structured, traceable, test-driven development workflows. The tool is AI-tool-agnostic, supporting 8 different coding tools across 3 integration tiers.

**How it works at a high level:** SpecSafe installs "skills" (structured markdown instructions) into the user's AI tool's configuration directory. These skills instruct the AI agent on how to behave at each stage of the TDD pipeline. A CLI (`specsafe`) handles project initialization, skill installation, regeneration, and health checks.

---

## 2. Architecture Overview

### Directory Structure

```
specsafe/                          # Root of the npm package
  package.json                     # Root package.json (@specsafe/cli v2.1.0)
  pnpm-workspace.yaml              # Declares "generators" as the sole workspace package
  tsconfig.json                    # Root TypeScript config
  vitest.config.ts                 # Root-level vitest config (content tests)
  vitest.workspace.ts              # Vitest workspace: content tests + generators tests
  canonical/                       # The "source of truth" content
    skills/                        # 18 canonical skill definitions (markdown)
    personas/                      # 8 persona definitions (markdown)
    rules/                         # Tool-specific rule files (CLAUDE.md, CONVENTIONS.md, etc.)
    templates/                     # Templates for project scaffolding
  generators/                      # pnpm workspace package: the CLI and adapters
    package.json                   # Sub-package (specsafe v2.0.0)
    tsconfig.json                  # Compiles src/ to dist/
    vitest.config.ts               # Tests in __tests__/
    src/                           # TypeScript source
      index.ts                     # CLI entry point (commander)
      init.ts                      # `specsafe init` command
      install.ts                   # `specsafe install <tool>` command
      update.ts                    # `specsafe update` command
      doctor.ts                    # `specsafe doctor` command
      registry.ts                  # Adapter lookup
      adapters/                    # 8 tool adapters + shared types/utils
    __tests__/                     # Generator unit + E2E tests
  tests/                           # Root-level content validation tests
  docs/                            # Documentation
  specs/                           # SpecSafe's own active specs
```

### Key Architectural Decisions

1. **Monorepo with single workspace package:** Uses pnpm workspaces, but only has one sub-package (`generators`). The root package.json is the publishable artifact; `generators/dist/index.js` is the CLI entry point.

2. **Content-code separation:** Canonical skills/personas/rules/templates are plain markdown files in `canonical/`. The TypeScript code in `generators/` reads and transforms these into tool-specific output. This means content authors do not need to touch code.

3. **Adapter pattern:** Each AI tool has an adapter implementing the `ToolAdapter` interface. Adapters transform canonical skills into tool-specific file layouts.

4. **Two test suites:** Content tests (`tests/`) validate the canonical markdown files (structure, cross-references, persona assignments). Generator tests (`generators/__tests__/`) test the CLI commands and adapters.

---

## 3. Technology Stack

| Category | Technology |
|----------|-----------|
| Language | TypeScript (ES2022 target, ESNext modules, bundler resolution) |
| Runtime | Node.js >= 18 |
| Package Manager | pnpm 10.28.2 |
| Build | `tsc` (TypeScript compiler) -- no bundler, compiles to ESM JS |
| Test Framework | Vitest 3.x |
| CLI Framework | Commander 12.x |
| Interactive Prompts | @clack/prompts 1.0.1 |
| Terminal Styling | ansis 4.x |
| Table Rendering | cli-table3 0.6.x |
| CI/CD | GitHub Actions |
| Package Registry | npm (published as `@specsafe/cli`) |
| Linter | Biome 2.4.x (dev dependency, added recently) |

### Runtime Dependencies (4 total)

| Package | Role |
|---------|------|
| `@clack/prompts` | Interactive CLI prompts (multiselect, text input, spinners) |
| `ansis` | ANSI color/formatting for terminal output |
| `cli-table3` | Formatted table output (used by `doctor` command) |
| `commander` | CLI command parsing and help generation |

### Dev Dependencies (5 total)

| Package | Role |
|---------|------|
| `@biomejs/biome` | Linting and formatting |
| `@types/node` | Node.js type definitions |
| `typescript` | TypeScript compiler |
| `vite` | Required by vitest |
| `vitest` | Test runner |

---

## 4. Key Abstractions

### 4.1 Canonical Skills

**Location:** `canonical/skills/<skill-name>/SKILL.md` (and optional `workflow.md`)

A canonical skill is the source-of-truth definition for an AI agent behavior. Each skill has:
- **YAML frontmatter:** `name`, `description`, `disable-model-invocation` (always `true`)
- **Body content:** Either self-contained instructions or a pointer to `workflow.md`
- **Optional workflow.md:** Detailed multi-step workflow with preconditions, numbered steps, guardrails, and handoff instructions

There are **18 canonical skills** (not 12 as originally planned -- 6 were added later):

**Core TDD Pipeline (12 original):**
| Skill | Persona | Stage |
|-------|---------|-------|
| `specsafe-init` | Cass (Herald) | INIT |
| `specsafe-explore` | Elena (Scout) | EXPLORE |
| `specsafe-new` | Kai (Mason) | SPEC |
| `specsafe-spec` | Kai (Mason) | SPEC |
| `specsafe-test` | Reva (Forge) | TEST |
| `specsafe-code` | Zane (Bolt) | CODE |
| `specsafe-verify` | Lyra (Warden) | VERIFY |
| `specsafe-qa` | Lyra (Warden) | QA |
| `specsafe-complete` | Cass (Herald) | COMPLETE |
| `specsafe-status` | Cass (Herald) | STATUS |
| `specsafe-archive` | Cass (Herald) | ARCHIVE |
| `specsafe-doctor` | Cass (Herald) | DOCTOR |

**Extended Skills (6 added):**
| Skill | Description |
|-------|------------|
| `specsafe-architecture` | Create system architecture documents (uses persona Nolan/Sage) |
| `specsafe-brief` | Create product briefs |
| `specsafe-context` | Generate project context for AI tools |
| `specsafe-prd` | Create Product Requirements Documents |
| `specsafe-ux` | Create UX design specifications (uses persona Aria/Prism) |
| `specsafe-skill-creator` | Create custom SpecSafe skills |

**Self-contained vs. Workflow skills:**
- Self-contained (no `workflow.md`): `specsafe-init`, `specsafe-status`, `specsafe-archive`, `specsafe-doctor`
- Workflow-based (have `workflow.md`): All others

**TypeScript representation** (in `generators/src/adapters/types.ts`):
```typescript
interface CanonicalSkill {
  name: string;
  description: string;
  disableModelInvocation: boolean;
  content: string;          // SKILL.md body (after frontmatter)
  workflowContent?: string; // workflow.md content if exists
  directory: string;        // Directory name
}
```

### 4.2 Personas

**Location:** `canonical/personas/<archetype>-<name>.md`

**8 personas** (6 original + 2 extended):

| File | Name | Archetype | Stages |
|------|------|-----------|--------|
| `scout-elena.md` | Elena | Scout | EXPLORE |
| `mason-kai.md` | Kai | Mason | SPEC |
| `forge-reva.md` | Reva | Forge | TEST |
| `bolt-zane.md` | Zane | Bolt | CODE |
| `warden-lyra.md` | Lyra | Warden | QA, VERIFY |
| `herald-cass.md` | Cass | Herald | COMPLETE, STATUS, ARCHIVE, INIT, DOCTOR |
| `prism-aria.md` | Aria | Prism | UX DESIGN |
| `sage-nolan.md` | Nolan | Sage | ARCHITECTURE |

Each persona file has required sections: `## Identity`, `## Communication Style`, `## Principles`, `## Guardrails`.

Personas are referenced in `workflow.md` files via a blockquote pattern:
```markdown
> **Persona:** Zane the Implementation Engineer. ...
```

Personas are **not consumed by the CLI** -- they are embedded directly in the workflow markdown and exist as reference documentation. The tests validate that workflow files reference the correct persona.

### 4.3 Adapters

**Location:** `generators/src/adapters/`

Each adapter implements the `ToolAdapter` interface:
```typescript
interface ToolAdapter {
  name: string;
  displayName: string;
  detect(projectRoot: string): Promise<boolean>;
  generate(skills: CanonicalSkill[], canonicalDir: string): Promise<GeneratedFile[]>;
}
```

- `detect()` checks if the tool's configuration directory/files exist in the project
- `generate()` transforms canonical skills into tool-specific files

### 4.4 Rules

**Location:** `canonical/rules/`

Rule files are tool-specific configuration/instructions that get copied to the project root or tool config directory during `install`. They contain the SpecSafe workflow summary, stage table, skills reference, and project constraints.

| File | Used By |
|------|---------|
| `CLAUDE.md` | claude-code adapter (copied to project root) |
| `CONVENTIONS.md` | aider adapter (copied to project root) |
| `GEMINI.md` | gemini adapter (copied to project root) |
| `AGENTS.md` | antigravity adapter (copied to `.agent/rules/` and project root) |
| `.cursorrules.mdc` | cursor adapter (copied to `.cursor/rules/specsafe.mdc`) |
| `.rules` | zed adapter (copied to project root) |
| `continue-config.yaml` | continue adapter (copied to `.continue/agents/specsafe.yaml`) |

Note: The rule files are nearly identical in content (workflow stages table, skills reference, constraints). The only differences are minor formatting for the target tool.

### 4.5 Templates

**Location:** `canonical/templates/`

| File | Purpose |
|------|---------|
| `specsafe-config-template.json` | Template for `specsafe.config.json` with `{{project-name}}` placeholder |
| `project-state-template.md` | Template for `PROJECT_STATE.md` with `{{project-name}}`, `{{version}}`, `{{timestamp}}` placeholders |
| `spec-template.md` | Template for individual spec files (`SPEC-YYYYMMDD-NNN`) |
| `qa-report-template.md` | Template for QA reports with `{{spec-id}}`, `{{total}}`, etc. placeholders |

---

## 5. Data Flow

### 5.1 `specsafe init [name]`

**Source:** `generators/src/init.ts` -- `init()` function

1. Check if `specsafe.config.json` already exists (abort if so)
2. In interactive mode (`--interactive`): prompt for project name, tools (auto-detected from filesystem), test framework, language using @clack/prompts
3. Create directories: `specs/active/`, `specs/completed/`, `specs/archive/`
4. Read template files from `canonical/templates/`
5. Replace `{{project-name}}`, `{{version}}`, `{{timestamp}}` placeholders
6. Write `specsafe.config.json`, `PROJECT_STATE.md`, `specs/template.md`
7. If tools were selected in interactive mode, call `install()` for each
8. Tool auto-detection checks for: `.claude/`, `.cursor/`, `.opencode/`, `.gemini/`, `.agent/`, `.zed/`, `.continue/`, `.aider.conf.yml`

### 5.2 `specsafe install <tool>`

**Source:** `generators/src/install.ts` -- `install()` function

1. Validate tool name against `TOOL_NAMES` constant
2. Look up adapter via `getAdapter()` from `registry.ts`
3. Load all canonical skills from `canonical/skills/` via `loadCanonicalSkills()`
4. Call `adapter.generate(skills, canonicalDir)` to produce `GeneratedFile[]`
5. **Security check:** verify each generated file path stays within the project directory
6. Write all generated files to disk (creating directories as needed)
7. Update `specsafe.config.json` to add the tool to the `tools` array

### 5.3 `specsafe update`

**Source:** `generators/src/update.ts` -- `update()` function

1. Read `specsafe.config.json` to get the list of installed tools
2. Call `install()` for each tool in the config (regenerates all files from canonical source)

### 5.4 `specsafe doctor`

**Source:** `generators/src/doctor.ts` -- `doctor()` function

Runs a series of health checks and outputs a formatted table:

| Check | Validates |
|-------|----------|
| `specsafe.config.json` | File exists, valid JSON, has required keys (`project`, `version`, `tools`, `specsafeVersion`) |
| `PROJECT_STATE.md` | File exists |
| `specs/active/` | Directory exists |
| `specs/completed/` | Directory exists |
| `specs/archive/` | Directory exists |
| Per-tool detection | For each tool in config, calls `adapter.detect()` to verify tool files are present |

Returns an array of `Check` objects with `OK` / `WARNING` / `ERROR` status. Sets `process.exitCode = 1` on errors.

---

## 6. Adapter System

### 6.1 Adapter Interface

All 8 adapters implement `ToolAdapter` from `generators/src/adapters/types.ts`. They are registered in `generators/src/adapters/index.ts` as a `Record<string, ToolAdapter>` and looked up by `generators/src/registry.ts`.

### 6.2 Tier Classification

**Tier 1 -- Full Skills** (native skill directories with frontmatter):
- `claude-code` -- `.claude/skills/<name>/SKILL.md` + `CLAUDE.md`
- `opencode` -- `.opencode/skills/<name>/SKILL.md` + `.opencode/command/<name>.md` (command stubs)
- `cursor` -- `.cursor/skills/<name>/SKILL.md` + `.cursor/rules/specsafe.mdc`
- `gemini` -- `.gemini/skills/<name>/SKILL.md` + `.gemini/commands/<name>.toml` + `GEMINI.md`
- `antigravity` -- `.agent/skills/<name>/SKILL.md` + `.agent/rules/specsafe.md` + `AGENTS.md`

**Tier 2 -- Conventions** (single rules/conventions file):
- `aider` -- `.aider.conf.yml` + `CONVENTIONS.md` (does NOT install per-skill files)
- `zed` -- `.rules` + `.zed/settings.json` (does NOT install per-skill files)

**Tier 3 -- Prompts** (invokable prompt files):
- `continue` -- `.continue/prompts/<name>.md` + `.continue/agents/specsafe.yaml`

### 6.3 Per-Adapter Behavior

| Adapter | detect() | generate() |
|---------|----------|-----------|
| `claude-code` | `.claude/` exists | SKILL.md per skill + workflow.md + CLAUDE.md |
| `opencode` | `.opencode/` or `OPENCODE.md` exists | SKILL.md + workflow.md + command stubs per skill |
| `cursor` | `.cursor/` or `.cursorrules` exists | SKILL.md + workflow.md + `.cursor/rules/specsafe.mdc` |
| `continue` | `.continue/` exists | Combined prompt per skill (SKILL body + workflow) + agent YAML |
| `aider` | `.aider.conf.yml` exists | `.aider.conf.yml` + `CONVENTIONS.md` only (ignores skills param) |
| `zed` | `.zed/` exists | `.rules` + `.zed/settings.json` only (ignores skills param) |
| `gemini` | `.gemini/` or `GEMINI.md` exists | SKILL.md + workflow.md + `.toml` command per skill + GEMINI.md |
| `antigravity` | `.agent/` or `AGENTS.md` exists | SKILL.md + workflow.md + `.agent/rules/specsafe.md` + AGENTS.md |

### 6.4 Shared Utilities (`adapters/utils.ts`)

| Function | Purpose |
|----------|---------|
| `parseFrontmatter(content)` | Parse YAML frontmatter from markdown (handles Windows line endings, quoted values, colons in values) |
| `loadCanonicalSkills(canonicalDir)` | Read all skill directories, parse SKILL.md frontmatter, load optional workflow.md |
| `readCanonicalRule(canonicalDir, filename)` | Read a rule file, return empty string if missing |
| `reconstructSkillMd(skill)` | Reconstruct a SKILL.md file from a `CanonicalSkill` object (frontmatter + body) |

---

## 7. Testing Strategy

### 7.1 Test Architecture

Two separate test suites configured via `vitest.workspace.ts`:

1. **Content tests** (`tests/*.test.ts`, configured in root `vitest.config.ts`): Validate canonical markdown content -- skills structure, personas sections, template content, cross-references between skills.

2. **Generator tests** (`generators/__tests__/*.test.ts`, configured in `generators/vitest.config.ts`): Test CLI commands and adapters using temporary directories.

### 7.2 Content Tests (4 files, ~389 lines)

| File | What it tests |
|------|--------------|
| `tests/skills.test.ts` | Every skill has SKILL.md with valid frontmatter (name, description, disable-model-invocation). Workflow skills have workflow.md with persona block, Preconditions, Workflow with Steps, Guardrails, and Handoff/State Changes sections. Self-contained skills have inline workflow/steps. |
| `tests/personas.test.ts` | All 6 core personas exist as `.md` files with required sections: Identity, Communication Style, Principles, Guardrails. |
| `tests/templates.test.ts` | All 4 templates exist with expected content (requirements/scenarios in spec template, Active/Completed/Metrics in state template, valid JSON in config template, Summary/Recommendation in QA template). |
| `tests/cross-references.test.ts` | Handoff references in workflow.md point to valid skill names. Persona assignments match the planned mapping. Handoff chain is complete (explore->new->spec->test->code, verify->qa/code, qa->complete/code). |

### 7.3 Generator Tests (15 files, ~1112 lines)

| File | What it tests |
|------|--------------|
| `__tests__/init.test.ts` | Creates directories/files, replaces placeholders, aborts on re-init, produces valid JSON, uses directory basename as default name |
| `__tests__/install.test.ts` | Validates tool names, generates files, updates config |
| `__tests__/update.test.ts` | Reads config, re-installs all configured tools |
| `__tests__/doctor.test.ts` | Health checks for config, state file, directories, tool detection |
| `__tests__/registry.test.ts` | Adapter lookup, all adapters registered |
| `__tests__/utils.test.ts` | Frontmatter parsing (standard, Windows CRLF, empty body, colons, quotes), loadCanonicalSkills (loads all 18, workflow content), reconstructSkillMd round-trip, readCanonicalRule |
| `__tests__/e2e.test.ts` | Full init->install->doctor cycle, tier-specific file generation (claude-code, aider, continue), multi-tool install, SKILL.md frontmatter validation for all 18 skills |
| `__tests__/adapters/*.test.ts` | Per-adapter: detect() with/without tool dirs, generate() file paths and content (8 files, one per adapter) |

### 7.4 Test Helpers

`generators/__tests__/adapters/helpers.ts` provides:
- `createTempDir()` -- temp directory creation
- `setupDetectDir()` -- set up directories/files for detect() testing
- `createTestSkills()` -- 2 mock skills (init + code) for adapter testing
- `findFile()` -- find a file by path in generated output
- `createCanonicalDir()` -- create minimal canonical directory with mock skills and rules

### 7.5 Test Patterns

- All generator tests use temporary directories (`mkdtemp` + cleanup in `afterEach`)
- Tests import the actual functions (`init`, `install`, `doctor`) rather than spawning CLI processes
- Adapter tests use mock skills (2) rather than all 18 canonical skills for speed
- E2E tests use the real canonical directory to test full integration
- No mocking of the filesystem -- all tests create/read real files in temp dirs

### 7.6 What Is NOT Tested

- The CLI binary itself (no process-spawn tests of `specsafe` command)
- Interactive prompt flows (all tests use non-interactive mode)
- The actual AI agent behavior when using installed skills
- npm publishing and package installation
- Windows path handling (except CRLF in frontmatter parsing)
- Concurrent install/update operations
- Error recovery (e.g., partial file writes)
- The extended skills (specsafe-architecture, specsafe-brief, etc.) are not in the `ALL_SKILLS` array in `tests/skills.test.ts` -- the content tests only check the original 12

---

## 8. Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@clack/prompts` | 1.0.1 (pinned) | Interactive CLI prompts -- `p.text()`, `p.select()`, `p.multiselect()`, `p.spinner()`, `p.group()` |
| `ansis` | ^4.2.0 | ANSI terminal colors (`c.cyan()`, `c.green()`, `c.red()`, `c.yellow()`, `c.bold()`) |
| `cli-table3` | ^0.6.5 | Formatted ASCII tables (used in `doctor` output) |
| `commander` | ^12.0.0 | CLI framework -- command definitions, argument parsing, help generation |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@biomejs/biome` | ^2.4.10 | Linting and formatting (recently added) |
| `@types/node` | ^20.0.0 | Node.js type definitions |
| `typescript` | ^5.3.0 | TypeScript compiler |
| `vite` | ^7.3.1 | Required by vitest |
| `vitest` | ^3.0.0 | Test runner |

### pnpm Overrides

| Package | Override | Reason |
|---------|----------|--------|
| `rollup` | `>=4.59.0` | Likely security fix |
| `picomatch` | `>=4.0.4` | Likely security fix |

---

## 9. Build & Deploy

### Build Process

1. `pnpm build` at root runs `pnpm -r build`, which calls `tsc` in the `generators` package
2. TypeScript compiles `generators/src/*.ts` to `generators/dist/*.js` (ESM, ES2022)
3. `postbuild` script runs `chmod +x dist/index.js` to make the CLI executable
4. The shebang `#!/usr/bin/env node` in `index.ts` makes it runnable as `specsafe`

### Package Publishing

**npm package name:** `@specsafe/cli`
**Entry point:** `generators/dist/index.js` (via `bin.specsafe` in root package.json)
**Included files:** `generators/dist/`, `canonical/`, `LICENSE`

**Two CI/CD workflows:**

1. **CI** (`.github/workflows/ci.yml`):
   - Triggered on push/PR to `main`
   - Matrix: Node 18, 20, 22
   - Steps: install, build, typecheck, generator tests, content tests
   - On push to main: publish to npm if version is new, create GitHub release

2. **CD** (`.github/workflows/cd.yml`):
   - Triggered on `v*` tags
   - Build, test, typecheck
   - Publish to npm with `pnpm publish -r --access public`
   - Create GitHub release with auto-generated notes

**Note:** There are two separate publish mechanisms (CI main-branch publish AND CD tag-based publish). This is potentially redundant -- see Known Gaps.

### Installation

```bash
npm install -g @specsafe/cli
# Then:
specsafe init my-project
specsafe install claude-code
```

---

## 10. Known Gaps and Observations

### Content/Skills Inconsistencies

1. **Skill count mismatch:** README documents 12 skills, but `canonical/skills/` contains 18. The 6 extended skills (architecture, brief, context, prd, ux, skill-creator) are not documented in the README's skills table.

2. **Persona count mismatch:** README and `docs/personas.md` document 6 personas, but `canonical/personas/` contains 8 files (includes `prism-aria.md` and `sage-nolan.md`). These extra personas serve the extended skills.

3. **Content test coverage gap:** `tests/skills.test.ts` only validates the original 12 skills (`ALL_SKILLS` array), not all 18. The 6 extended skills have no content validation tests.

4. **Persona test coverage gap:** `tests/personas.test.ts` only checks the original 6 personas, not the 2 additions (Aria, Nolan).

5. **Cross-reference test assumes 12 skills:** The `PERSONA_MAP` in `tests/cross-references.test.ts` only maps 8 workflow skills, missing the extended ones.

### Architecture Concerns

6. **Duplicate version declarations:** Root `package.json` is v2.1.0, generators `package.json` is v2.0.0. The CLI reads version from root, so the generators version is stale/confusing.

7. **Duplicate publish pipelines:** Both `ci.yml` (main branch push) and `cd.yml` (tags) publish to npm. This could cause conflicts or double-publishes.

8. **Aider and Zed adapters ignore skills:** These adapters receive the `skills` parameter in `generate()` but ignore it entirely, only outputting static rules files. This is by design (Tier 2), but the interface doesn't make this distinction explicit.

9. **No adapter tests for file count:** The E2E test checks for 18 skills in claude-code output, but individual adapter tests use only 2 mock skills. If an adapter had a bug that dropped skills, per-adapter tests would not catch it.

10. **Rule file duplication:** `CLAUDE.md`, `GEMINI.md`, `AGENTS.md`, `.rules`, and `.cursorrules.mdc` all contain nearly identical content. Only `CONVENTIONS.md` and `continue-config.yaml` differ meaningfully. These could be generated from a single template.

### Missing Features

11. **No `specsafe uninstall` command:** There is no way to remove a tool's generated files.

12. **No `specsafe status` CLI command:** The README mentions `specsafe status` but the CLI only implements `init`, `install`, `update`, and `doctor`. The `specsafe-status` skill is a markdown instruction for the AI agent, not a CLI command.

13. **No spec lifecycle commands in CLI:** `specsafe new`, `specsafe spec`, `specsafe test`, etc. are AI-agent skills (markdown), not CLI commands. The CLI only handles project scaffolding and tool management.

14. **No programmatic API:** Everything goes through the CLI. The functions are exported but there is no separate library package.

15. **No lockfile validation:** `doctor` does not check that `pnpm-lock.yaml` is up to date or that node_modules is consistent.

16. **No `--force` flag:** `init` refuses to run if `specsafe.config.json` exists. There is no way to reinitialize.

### Code Quality

17. **Security: path containment check in install.ts** is good -- verifies generated file paths do not escape the project directory.

18. **Error handling is basic:** Most errors are caught and printed with `console.error()` + `process.exitCode = 1`. No structured error types.

19. **No logging/verbosity control:** No `--verbose` or `--quiet` flags.

20. **Changelog is non-chronological:** The CHANGELOG.md has entries out of order (0.3.1, then Unreleased, then 0.3.0, 0.2.0, 0.1.0, then 0.3.2-0.3.6 at the bottom). The v2.x entries are missing entirely.

---

## Appendix: File Index

### Source Files (`generators/src/`)

| File | Lines | Purpose |
|------|-------|---------|
| `index.ts` | ~55 | CLI entry point, 4 commands |
| `init.ts` | ~135 | Project initialization with interactive mode |
| `install.ts` | ~65 | Tool installation with security checks |
| `update.ts` | ~45 | Regenerate all tool files |
| `doctor.ts` | ~110 | Health check with formatted output |
| `registry.ts` | ~10 | Adapter lookup |
| `adapters/types.ts` | ~55 | TypeScript interfaces and constants |
| `adapters/utils.ts` | ~70 | Frontmatter parsing, skill loading |
| `adapters/index.ts` | ~25 | Adapter re-exports and registry map |
| `adapters/claude-code.ts` | ~30 | Claude Code adapter |
| `adapters/opencode.ts` | ~35 | OpenCode adapter |
| `adapters/cursor.ts` | ~35 | Cursor adapter |
| `adapters/continue.ts` | ~40 | Continue.dev adapter |
| `adapters/aider.ts` | ~25 | Aider adapter |
| `adapters/zed.ts` | ~35 | Zed adapter |
| `adapters/gemini.ts` | ~40 | Gemini CLI adapter |
| `adapters/antigravity.ts` | ~35 | Google Antigravity adapter |

### Canonical Content

| Directory | Count | Description |
|-----------|-------|-------------|
| `canonical/skills/` | 18 directories | Skill definitions (SKILL.md + optional workflow.md) |
| `canonical/personas/` | 8 files | Persona definitions |
| `canonical/rules/` | 7 files | Tool-specific rule files |
| `canonical/templates/` | 4 files | Project scaffolding templates |
