# Changelog
## [Unreleased]

## [0.3.1] - 2026-02-11

### Fixed
- `specsafe init` failing with "Unknown tool: claude-code" when selecting Claude Code or Crush
- Added missing `generateClaudeCodeConfig` and `generateCrushConfig` functions


All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-02-11

### Added
- **Claude Code integration** — `CLAUDE.md` project context file with spec-driven development workflow, stage progression rules, and CLI reference
- **Crush integration** — `CRUSH.md` context file for Crush (formerly OpenCode by Charmbracelet), a multi-model terminal coding agent
- Claude Code and Crush added to tool registry (7 tools total)
- Auto-detection for Claude Code (`.claude/` directory or `CLAUDE.md`) and Crush (`.crush/` directory or `CRUSH.md`)
- 6 new tests for tool detection and registry (200 total)

## [0.2.0] - 2026-02-11

### Added
- `specsafe rules` command — list, add, remove, and update AI coding tool integrations
- `specsafe rules add <tool>` — install tool-specific configuration files
- `specsafe rules remove <tool>` — uninstall tool configurations
- `specsafe rules update` — update all installed rules to latest version
- Interactive `specsafe init` — auto-detects installed tools (Cursor, Continue.dev, Aider, Zed) and offers to configure them
- Tool configuration files for 5 AI coding assistants:
  - **Cursor** — `.cursorrules` with spec-driven development instructions
  - **Continue.dev** — `config.yaml` (v1 schema) with prompt files for `/specsafe`, `/spec`, `/validate` commands
  - **Aider** — `.aider.conf.yml` + `.aiderignore` + `CONVENTIONS.md`
  - **Zed** — `settings.json` with agent configuration
  - **Git Hooks** — `pre-commit` hook for spec validation
- Dynamic version tracking for installed rules
- Executable permissions automatically set for git hook files
- Path resolution with fallback for rules source directory
- 194 passing tests (up from 139 in v0.1.0)

### Fixed
- Source path mapping for rule file installation (dot-prefixed directory handling)
- `removeToolConfig` now handles malformed JSON gracefully
- Pre-commit hook uses NUL-delimited filenames for safe handling of spaces

### Security
- Added `.env*` to `.gitignore`

## [0.1.0] - 2026-02-11

### Added
- Initial release of SpecSafe CLI and core libraries
- `specsafe init` — Initialize a new SpecSafe project
- `specsafe new` — Create a new spec from template
- `specsafe status` — Show project status
- `specsafe list` — List all specs with filtering
- `specsafe spec <id>` — Validate requirements and move to SPEC stage
- `specsafe test <id>` — Generate tests from spec (SPEC → TEST)
- `specsafe code <id>` — Start implementation (TEST → CODE)
- `specsafe qa <id>` — Run QA validation (CODE → QA)
- `specsafe complete <id>` — Complete spec (QA → COMPLETE)
- `specsafe archive <id>` — Archive completed specs
- `specsafe doctor` — Validate project setup
- `--dry-run` flag on mutation commands
- Configuration file support (specsafe.config.json)
- TypeScript support with strict mode
- Test generation for vitest and jest
- 139 passing tests across all packages
- CI/CD pipelines for automated testing and publishing

### Security
- Input validation on all spec IDs (`validateSpecId`)
- Path traversal protection
- QA report schema validation
- Committed lockfile for reproducible builds

### Package Releases

- `@specsafe/core@0.1.0` — Core workflow engine and types
- `@specsafe/cli@0.1.0` — Command-line interface
- `@specsafe/test-gen@0.1.0` — Test generation library

## [0.3.2] - 2026-02-11

### Fixed
- Claude Code integration: create SKILL.md files in .claude/skills/ for slash commands (/specsafe, /spec, /validate)

## [0.3.3] - 2026-02-11

### Fixed
- CLI version now reads from package.json (was hardcoded to 0.1.0)

## [0.3.4] - 2026-02-11

### Fixed
- Claude Code skills now appear as slash commands (/specsafe, /spec, /validate)

## [0.3.5] - 2026-02-11

### Fixed
- Renamed Claude Code skills to /specsafe-spec and /specsafe-validate to avoid name conflicts
