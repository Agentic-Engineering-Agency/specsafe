# SpecSafe

SpecSafe is a two-phase software engineering framework for AI-assisted development. It provides structured planning workflows to reduce ambiguity, then enforces test-driven implementation through small spec slices — regardless of which AI coding tool you use.

For the full canonical workflow, see [docs/SPECSAFE-CANONICAL-WORKFLOW.md](./docs/SPECSAFE-CANONICAL-WORKFLOW.md).

## Two-Phase Workflow

```
PHASE 1: PLANNING
brainstorm → principles → brief → PRD → UX → architecture → readiness

PHASE 2: DEVELOPMENT
spec slice → tests → implementation → verify/QA → complete (or loop back)
```

## Phase 1: Planning

Planning removes ambiguity before implementation begins. Each planning skill produces an artifact that informs the next stage.

| Step | Skill | Description |
|------|-------|-------------|
| 1 | `specsafe-brainstorm` | Divergent exploration of possibilities *(coming soon)* |
| 2 | `specsafe-principles` | Product principles, non-goals, quality priorities *(coming soon)* |
| 3 | `specsafe-brief` | Concise product/business framing document |
| 4 | `specsafe-prd` | Testable requirements with user journeys and acceptance criteria |
| 5 | `specsafe-ux` | UX design: tokens, components, flows, accessibility |
| 6 | `specsafe-architecture` | System architecture with ADRs and technology decisions |
| 7 | `specsafe-readiness` | Pre-development coherence check: GO / NEEDS REVISION / BLOCKED *(coming soon)* |

## Phase 2: Development

Development begins only after the change is understood well enough to be implemented as a small spec slice.

| Stage | Skill | Persona | What happens |
|-------|-------|---------|-------------|
| **SPEC** | `specsafe-new`, `specsafe-spec` | Kai (Mason) | Create and refine a spec with requirements, acceptance criteria, scenarios |
| **TEST** | `specsafe-test` | Reva (Forge) | Generate test files from spec scenarios — all tests start skipped |
| **CODE** | `specsafe-code` | Zane (Bolt) | TDD red-green-refactor: unskip one test, write code to pass, repeat |
| **VERIFY** | `specsafe-verify` | Lyra (Warden) | Run tests, validate against spec, loop back on failure |
| **QA** | `specsafe-qa`, `specsafe-complete` | Lyra (Warden), Cass (Herald) | Full QA report with GO/NO-GO, then human approval gate |

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

18 canonical skills (+ 3 planned):

### Planning Skills

| Skill | Description |
|-------|-------------|
| `specsafe-brainstorm` | Divergent exploration before converging on a solution *(coming soon)* |
| `specsafe-principles` | Product principles, non-goals, and quality priorities *(coming soon)* |
| `specsafe-brief` | Create a concise product brief — problem, users, scope, success criteria |
| `specsafe-prd` | Expand brief into full PRD with user journeys, FRs, NFRs |
| `specsafe-ux` | UX design foundations — tokens, components, accessibility, flows |
| `specsafe-architecture` | System architecture — components, data model, ADRs, technology stack |
| `specsafe-readiness` | Pre-development coherence and readiness check *(coming soon)* |

### Development Skills

| Skill | Description |
|-------|-------------|
| `specsafe-new` | Create a new spec with unique ID and initial requirements |
| `specsafe-spec` | Refine spec with detailed requirements, criteria, scenarios |
| `specsafe-test` | Generate test files from spec scenarios (all tests start skipped) |
| `specsafe-code` | TDD implementation — unskip tests one at a time, write code to pass |
| `specsafe-verify` | Run tests, validate against spec, loop on failure |
| `specsafe-qa` | Full QA validation with report and GO/NO-GO recommendation |
| `specsafe-complete` | Human approval gate — moves spec to COMPLETE |

### Utility Skills

| Skill | Description |
|-------|-------------|
| `specsafe-init` | Initialize project — creates dirs, config, PROJECT_STATE.md |
| `specsafe-explore` | Pre-spec exploration and research mode |
| `specsafe-context` | Gather and present project context for AI agents |
| `specsafe-status` | Project dashboard with spec counts by stage |
| `specsafe-archive` | Archive obsolete or abandoned specs |
| `specsafe-doctor` | Validate project health and configuration |
| `specsafe-skill-creator` | Create new SpecSafe skills with proper structure and validation |

## Agent Personas

| Persona | Role | Archetype | Stages |
|---------|------|-----------|--------|
| **Elena** | Exploration Lead | Scout | EXPLORE |
| **Kai** | Spec Architect | Mason | SPEC, BRIEF, PRD |
| **Reva** | Test Engineer | Forge | TEST |
| **Zane** | Implementation Engineer | Bolt | CODE |
| **Lyra** | QA Inspector | Warden | QA, VERIFY |
| **Cass** | Release Manager | Herald | COMPLETE, STATUS, ARCHIVE, INIT, DOCTOR |
| **Aria** | UX Designer | Prism | UX |
| **Nolan** | System Architect | Sage | ARCHITECTURE |

## Supported Tools

| Tool | Tier | Output |
|------|------|--------|
| `claude-code` | 1 — Full Skills | `.claude/skills/*/SKILL.md` + `CLAUDE.md` |
| `opencode` | 1 — Full Skills | `.opencode/skills/*/SKILL.md` + `.opencode/command/*.md` |
| `cursor` | 1 — Full Skills | `.cursor/skills/*/SKILL.md` + `.cursorrules` |
| `continue` | 3 — Prompts | `.continue/prompts/*.md` + agent config |
| `aider` | 2 — Conventions | `.aider.conf.yml` + `CONVENTIONS.md` |
| `zed` | 2 — Conventions | `.rules` + `.zed/settings.json` |
| `gemini` | 1 — Full Skills | `.gemini/skills/*/SKILL.md` + `.gemini/commands/*.toml` + `GEMINI.md` |
| `antigravity` | 1 — Full Skills | `.agent/skills/*/SKILL.md` + `.agent/rules/specsafe.md` + `AGENTS.md` |

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

- [Canonical Workflow](./docs/SPECSAFE-CANONICAL-WORKFLOW.md) — source of truth for the two-phase model
- [Tool Support Guide](./docs/tool-support.md) — per-tool setup details
- [Persona Guide](./docs/personas.md) — how each persona works
