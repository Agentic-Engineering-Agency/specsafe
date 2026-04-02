# SpecSafe

SpecSafe is a skills-first TDD framework for AI-assisted development. It provides a structured 5-stage workflow that keeps AI agents aligned with human intent through specifications, test-driven implementation, and QA gates — regardless of which AI coding tool you use.

## The 5-Stage Workflow

```
SPEC → TEST → CODE → VERIFY → QA → COMPLETE
```

| Stage | Skill | Persona | What happens |
|-------|-------|---------|-------------|
| **SPEC** | `specsafe-new`, `specsafe-spec` | Kai (Mason) | Create and refine a spec with requirements, acceptance criteria, scenarios |
| **TEST** | `specsafe-test` | Reva (Forge) | Generate test files from spec scenarios — all tests start skipped |
| **CODE** | `specsafe-code` | Zane (Bolt) | TDD red-green-refactor: unskip one test, write code to pass, repeat |
| **VERIFY** | `specsafe-verify` | Lyra (Warden) | Run tests, validate against spec, loop back on failure |
| **QA** | `specsafe-qa`, `specsafe-complete` | Lyra (Warden), Cass (Herald) | Full QA report with GO/NO-GO, then human approval gate |

Additional utility skills:

| Skill | Persona | Purpose |
|-------|---------|---------|
| `specsafe-init` | Cass (Herald) | Initialize a new SpecSafe project |
| `specsafe-explore` | Elena (Scout) | Pre-spec exploration and research |
| `specsafe-status` | Cass (Herald) | Project dashboard with spec counts and metrics |
| `specsafe-doctor` | Cass (Herald) | Validate project health |
| `specsafe-archive` | Cass (Herald) | Archive obsolete specs |

## Quick Start

```bash
# Install globally
npm install -g @specsafe/cli

# Initialize a project
specsafe init my-project

# Install skills for your AI tool
specsafe install claude-code    # Tier 1: full skills
specsafe install aider          # Tier 2: conventions
specsafe install continue       # Tier 3: prompts

# Check project health
specsafe doctor
```

## Skills Reference

All 12 canonical skills:

| Skill | Description |
|-------|------------|
| `specsafe-init` | Initialize project — creates dirs, config, PROJECT_STATE.md |
| `specsafe-explore` | Pre-spec exploration and research mode |
| `specsafe-new` | Create a new spec with unique ID and initial requirements |
| `specsafe-spec` | Refine spec with detailed requirements, criteria, scenarios |
| `specsafe-test` | Generate test files from spec scenarios (all tests start skipped) |
| `specsafe-code` | TDD implementation — unskip tests one at a time, write code to pass |
| `specsafe-verify` | Run tests, validate against spec, loop on failure |
| `specsafe-qa` | Full QA validation with report and GO/NO-GO recommendation |
| `specsafe-complete` | Human approval gate — moves spec to COMPLETE |
| `specsafe-status` | Project dashboard with spec counts by stage |
| `specsafe-archive` | Archive obsolete or abandoned specs |
| `specsafe-doctor` | Validate project health and configuration |

## Agent Personas

| Persona | Role | Archetype | Stages |
|---------|------|-----------|--------|
| **Elena** | Exploration Lead | Scout | EXPLORE |
| **Kai** | Spec Architect | Mason | SPEC |
| **Reva** | Test Engineer | Forge | TEST |
| **Zane** | Implementation Engineer | Bolt | CODE |
| **Lyra** | QA Inspector | Warden | QA, VERIFY |
| **Cass** | Release Manager | Herald | COMPLETE, STATUS, ARCHIVE, INIT, DOCTOR |

## Supported Tools

| Tool | Tier | Output |
|------|------|--------|
| `claude-code` | 1 — Full Skills | `.claude/skills/*/SKILL.md` + `CLAUDE.md` |
| `opencode` | 1 — Full Skills | `.opencode/skills/*/SKILL.md` + `.opencode/command/*.md` |
| `cursor` | 1 — Full Skills | `.cursor/skills/*/SKILL.md` + `.cursorrules` |
| `continue` | 3 — Prompts | `.continue/prompts/*.md` + agent config |
| `aider` | 2 — Conventions | `.aider.conf.yml` + `CONVENTIONS.md` |
| `zed` | 2 — Conventions | `.zed/prompts/*.md` |
| `gemini` | 2 — Conventions | `GEMINI.md` |
| `antigravity` | 2 — Conventions | `AGENTS.md` |

## Configuration

### specsafe.config.json

```json
{
  "project": "my-project",
  "version": "1.0.0",
  "tools": ["claude-code"],
  "testFramework": "vitest",
  "testCommand": "pnpm test",
  "coverageCommand": "pnpm test --coverage",
  "language": "typescript",
  "specsafeVersion": "2.0.0"
}
```

### PROJECT_STATE.md

Tracks the current state of all specs in the project:

```markdown
# Project State — my-project

## Active Specs
| ID | Title | Stage | Owner |
|----|-------|-------|-------|

## Completed Specs
| ID | Title | Completed |
|----|-------|-----------|

## Metrics
- Total specs: 0
- Active: 0
- Completed: 0
```

## Further Reading

- [Tool Support Guide](./tool-support.md) — per-tool setup details
- [Persona Guide](./personas.md) — how each persona works
