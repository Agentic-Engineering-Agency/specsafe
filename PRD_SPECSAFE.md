# SpecSafe - Product Requirements Document

**Document Version:** 1.0
**Created:** 2026-01-26
**Status:** Draft
**Author:** [Your Name]

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Product Vision](#product-vision)
4. [Target Users](#target-users)
5. [Core Workflow](#core-workflow)
6. [Feature Requirements](#feature-requirements)
7. [Technical Architecture](#technical-architecture)
8. [AI Tool Integration](#ai-tool-integration)
9. [CLI Design](#cli-design)
10. [Multi-Agent System](#multi-agent-system)
11. [Tracking & History](#tracking--history)
12. [Comparison with Existing Tools](#comparison-with-existing-tools)
13. [Success Metrics](#success-metrics)
14. [Roadmap](#roadmap)
15. [Open Questions](#open-questions)
16. [References](#references)

---

## Executive Summary

**SpecSafe** is a Test-Driven Development (TDD) framework designed for AI-assisted software engineering. It enforces a strict **SPEC → TEST → CODE → QA → COMPLETE** workflow where specifications drive test creation, tests drive implementation, QA validates quality, and humans approve before production.

### Key Value Propositions

| Value | Description |
|-------|-------------|
| **TDD Enforcement** | Tests are always written before implementation - no exceptions |
| **Spec-Driven** | Features start as formal specifications using normative language (SHALL/MUST) |
| **AI-First Design** | Built around Claude Code and OpenCode with MCP servers, skills, hooks, and subagents |
| **Mandatory Tracking** | Every change updates a master log - complete development history |
| **QA Validation** | Automated test runs generate reports with GO/NO-GO recommendations |
| **Human Approval Gate** | Explicit COMPLETE phase where humans review and approve before production |
| **Multi-Agent Orchestration** | Specialized agents for each development phase working in parallel |

### Workflow Overview

```
SPEC → TEST → CODE → QA → COMPLETE
  │       │       │      │       │
  │       │       │      │       └─→ Human approves → completed/ (production)
  │       │       │      │
  │       │       │      └─→ AI generates QA report with recommendation
  │       │       │
  │       │       └─→ TDD red-green-refactor cycle
  │       │
  │       └─→ AI generates test skeletons from scenarios
  │
  └─→ Human + AI brainstorm requirements

ARCHIVE (separate): Move deprecated specs to trashcan
```

### Inspiration Sources

- **OpenSpec** (Fission AI) - Spec-driven development workflow
- **Eigent.ai** - Multi-agent architecture and local-first philosophy
- **Anthropic Best Practices** - MCP, skills, hooks, subagents patterns

---

## Problem Statement

### Current AI-Assisted Development Pain Points

| Problem | Impact |
|---------|--------|
| **No TDD Enforcement** | AI generates code without tests, leading to untested features |
| **Specs Drift from Code** | Requirements written but never kept in sync with implementation |
| **No Traceability** | Impossible to answer "why was this decision made?" months later |
| **Manual Tracking Overhead** | Developers forget to update tracking documents |
| **Inconsistent AI Behavior** | Each session starts fresh without learned patterns |
| **No Quality Gates** | Code ships without formal QA checkpoints |

### Gap Analysis: Existing Solutions

| Tool | Strengths | Gaps |
|------|-----------|------|
| **OpenSpec** | Spec-driven proposals, 21 AI tools supported | No test generation, no TDD enforcement, manual workflow |
| **Eigent.ai** | Multi-agent, local-first, 200+ MCP tools | General-purpose automation, not development-focused |
| **Cucumber/BDD** | Behavior scenarios | Complex syntax, no AI integration, manual test writing |
| **Jest/Vitest** | Excellent test runners | No spec integration, no AI-driven test generation |
| **Claude Code** | Powerful coding agent | No enforced TDD workflow, no tracking |
| **OpenCode** | Multi-provider, open source | No TDD workflow, no spec integration |

---

## Product Vision

### Mission Statement

> "Make test-driven, spec-first development the easy path rather than the disciplined one."

### Vision

SpecSafe transforms AI-assisted development by:

1. **Enforcing TDD** - Making it impossible to write code without tests
2. **Automating Specs → Tests** - Converting specifications directly into test skeletons
3. **Tracking Everything** - Building a complete historical record automatically
4. **Multi-Agent Orchestration** - Specialized AI agents for each development phase
5. **Quality Gates** - Formal GO/NO-GO checkpoints before code integration

### Core Philosophy

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         THE SPECSAFE PHILOSOPHY                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   "No code without a test. No test without a spec. No work without a log." │
│                                                                            │
│   1. SPECS ARE TRUTH     - Requirements define what to build               │
│   2. TESTS ARE CONTRACTS - Tests validate the requirements                 │
│   3. CODE IS SERVANT     - Implementation exists only to pass tests        │
│   4. HISTORY IS MEMORY   - Every decision is recorded for the future       │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Target Users

### Primary: Software Engineers

| Persona | Description | Key Needs |
|---------|-------------|-----------|
| **Solo Developer** | Building apps/systems independently | TDD guidance, automated tracking, AI assistance |
| **Team Lead** | Managing development workflows | Enforced standards, visibility, quality gates |
| **DevOps Engineer** | Building pipelines and infrastructure | IaC testing, terraform validation, automation |
| **Full-Stack Developer** | Working across frontend/backend | Multi-language support, integration testing |

### Use Cases

| Category | Examples |
|----------|----------|
| **Web Applications** | React, Vue, Angular, TanStack, Next.js |
| **Backend Systems** | Node.js, Python, Go, Rust APIs |
| **Infrastructure** | Terraform, Pulumi, CloudFormation |
| **DevOps Pipelines** | CI/CD, GitHub Actions, GitLab CI |
| **Databases** | Schema migrations, query testing |
| **CLI Tools** | Command-line applications |
| **Libraries** | npm packages, PyPI packages |

---

## Core Workflow

### The Five-Stage Development Cycle

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              THE SPECSAFE WORKFLOW                                        │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐    ┌──────────┐                  │
│   │        │    │        │    │        │    │        │    │          │                  │
│   │  SPEC  │ ─▶ │  TEST  │ ─▶ │  CODE  │ ─▶ │   QA   │ ─▶ │ COMPLETE │                  │
│   │        │    │        │    │        │    │        │    │          │                  │
│   └────────┘    └────────┘    └────────┘    └────────┘    └──────────┘                  │
│       │              │              │             │              │                       │
│       ▼              ▼              ▼             ▼              ▼                       │
│   User Stories   Generate      Implement     Run Tests     Human Review                 │
│   Requirements   Test Files    Pass Tests    Report        Approve & Move               │
│   Scenarios      (.skip)       (TDD)         Results       to completed/                │
│                                                                                          │
│   HUMAN          AI Agent      AI Agent      AI Agent      HUMAN                        │
│   + AI assist    test-gen      code-impl     qa-review     DECISION                     │
│                                                                                          │
│   Commands:                                                                              │
│   specsafe:spec  specsafe:test specsafe:dev specsafe:qa   specsafe:complete             │
│                                                                                          │
│                                     │                                                    │
│                                     ▼                                                    │
│                              ┌─────────────┐                                             │
│                              │   NO-GO?    │                                             │
│                              │  Return to  │                                             │
│                              │    CODE     │                                             │
│                              └─────────────┘                                             │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘

                              ↓ After Human Approval ↓

┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              POST-COMPLETION                                              │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌────────────────────────────────────────────────────────────────────────────────┐    │
│   │                          MASTER LOG UPDATE                                      │    │
│   │                                                                                 │    │
│   │   - PROJECT_STATE.md updated with completion status                            │    │
│   │   - Spec moved from active/ to completed/ (production-ready)                   │    │
│   │   - Metrics updated (coverage, time, decisions)                                │    │
│   │   - QA report stored with spec                                                 │    │
│   └────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│                              ARCHIVE (Separate Action)                                   │
│   ┌────────────────────────────────────────────────────────────────────────────────┐    │
│   │                                                                                 │    │
│   │   specsafe:archive - Move deprecated/obsolete specs to archive/ (trashcan)    │    │
│   │   - Used when spec is no longer relevant                                       │    │
│   │   - Used when feature is removed from product                                  │    │
│   │   - Used when spec is superseded by newer spec                                 │    │
│   │   - Preserves history but marks as inactive                                    │    │
│   │                                                                                 │    │
│   └────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Directory Lifecycle

```
specs/
├── active/                 # Currently being developed
│   └── user-auth/          # SPEC → TEST → CODE → QA phases
│       └── spec.md
│
├── completed/              # Production-ready, implemented specs
│   └── user-auth/          # After human approval in COMPLETE phase
│       ├── spec.md         # The specification
│       └── qa-report.md    # QA results that led to approval
│
└── archive/                # TRASHCAN: Deprecated/removed specs
    └── YYYY-MM-DD-old-feature/
        ├── spec.md         # Historical record
        ├── qa-report.md    # Last QA state
        └── deprecation.md  # Why it was archived
```

### Stage Details

#### Stage 1: SPEC (Brainstorm & Define)

**Purpose:** Define what to build using user stories and normative language.

**Participants:**
- Human developer (requirements, decisions)
- AI agent (brainstorming, scenario generation)

**Outputs:**
- `spec.md` with SHALL/MUST requirements
- WHEN/THEN scenarios for each requirement
- User stories in standard format

**Command:** `specsafe:spec`

**Human-in-the-Loop:** Human provides requirements, AI assists with scenarios and edge cases.

---

#### Stage 2: TEST (Generate Tests)

**Purpose:** Auto-generate test files from spec scenarios.

**Participants:**
- AI `test-generator` agent

**Outputs:**
- Test files with `.skip` markers (pending implementation)
- Test structure matching spec scenarios
- Coverage targets defined

**Command:** `specsafe:test`

**Human-in-the-Loop:** Human reviews generated tests for accuracy before proceeding.

---

#### Stage 3: CODE (Implement)

**Purpose:** Write code to make tests pass (TDD red-green-refactor).

**Participants:**
- AI `code-implementer` agent
- Human developer (review, decisions)

**Process:**
1. Run tests (all failing - RED)
2. Implement minimum code to pass one test
3. Run tests (one passing - GREEN)
4. Refactor if needed
5. Repeat until all tests pass

**Command:** `specsafe:dev`

**Human-in-the-Loop:** Human reviews code changes, makes architectural decisions.

---

#### Stage 4: QA (Validate & Report)

**Purpose:** Run tests, generate comprehensive QA report for human review.

**Participants:**
- AI `qa-reviewer` agent

**Process:**
1. Run full test suite
2. Calculate pass percentage
3. Check coverage against thresholds
4. Identify corner case failures
5. Generate comprehensive QA report
6. **Output:** QA report with GO/NO-GO recommendation

**Command:** `specsafe:qa`

**Output:** QA report including:
- Test results (passed/failed/skipped)
- Coverage metrics
- Corner case analysis
- AI recommendation (GO/NO-GO)
- Action items if NO-GO

**Human-in-the-Loop:** Human reviews QA report and makes final decision.

---

#### Stage 5: COMPLETE (Human Approval & Transition)

**Purpose:** Human validates QA results and approves spec for production.

**Participants:**
- Human developer (final approval)

**Process:**
1. Human reviews QA report
2. Human validates test coverage is sufficient
3. Human confirms corner case handling is acceptable
4. **APPROVE:** Move spec from `active/` to `completed/`
5. **REJECT:** Return to CODE stage with feedback

**Command:** `specsafe:complete`

**Human-in-the-Loop:** This stage is HUMAN-ONLY decision.

```
┌─────────────────────────────────────────────────────────────────┐
│                    HUMAN APPROVAL CHECKLIST                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [ ] QA report reviewed                                       │
│   [ ] Test pass rate acceptable (≥ threshold or justified)     │
│   [ ] Coverage meets requirements (≥ threshold or justified)   │
│   [ ] Corner cases documented and acceptable                   │
│   [ ] No critical failures in test suite                       │
│   [ ] Implementation matches spec requirements                 │
│                                                                 │
│   Decision: [ ] APPROVE  [ ] REJECT (return to CODE)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Separate Action: ARCHIVE (Deprecate/Remove)

**Purpose:** Move obsolete specs to archive (trashcan) when no longer needed.

**When to Archive:**
- Feature removed from product
- Spec superseded by newer version
- Capability deprecated
- Project pivot/abandonment

**Process:**
1. Document reason for archival
2. Move from `completed/` (or `active/`) to `archive/YYYY-MM-DD-[name]/`
3. Create `deprecation.md` explaining why
4. Update PROJECT_STATE.md

**Command:** `specsafe:archive`

**Note:** Archive is NOT part of the normal workflow. It's a separate maintenance action.

---

## Feature Requirements

### P0: Must Have (MVP)

| ID | Feature | Description |
|----|---------|-------------|
| F001 | **CLI Installation** | `npm install -g specsafe` or `curl` one-liner |
| F002 | **Project Initialization** | `specsafe init` creates directory structure and config |
| F003 | **Spec Creation** | `specsafe:spec` command with templates and AI brainstorming |
| F004 | **Test Generation** | `specsafe:test` parses specs and generates test skeletons |
| F005 | **TDD Dev Mode** | `specsafe:dev` with watch mode and test runner integration |
| F006 | **QA Validation** | `specsafe:qa` runs tests and generates report with recommendation |
| F007 | **Human Approval** | `specsafe:complete` for human review and approval to move to completed/ |
| F008 | **Archive Command** | `specsafe:archive` moves deprecated specs to archive/ (trashcan) |
| F009 | **Master Log** | `PROJECT_STATE.md` auto-updated after every action |
| F010 | **Claude Code Integration** | Skills, commands, hooks, MCP server for Claude Code |
| F011 | **OpenCode Integration** | Commands for OpenCode |
| F012 | **Git Hooks** | Pre-commit blocks if tests fail or tracking not updated |
| F013 | **Multi-Language Support** | TypeScript, Python, SQL, YAML, Terraform, Shell |

### P1: Should Have

| ID | Feature | Description |
|----|---------|-------------|
| F101 | **Subagent Orchestration** | Parallel agents for spec-review, test-gen, code-impl |
| F102 | **MCP Server** | Custom tools for spec parsing, test generation |
| F103 | **Coverage Tracking** | Track test coverage over time |
| F104 | **Time Tracking** | Time spent per spec/feature |
| F105 | **Decision Log** | Architectural decisions recorded |
| F106 | **VS Code Extension** | Integrated spec/test/code workflow |
| F107 | **Custom Test Frameworks** | Support Vitest, Jest, Pytest, Go test, etc. |
| F108 | **Template Library** | Reusable spec templates by domain |

### P2: Nice to Have

| ID | Feature | Description |
|----|---------|-------------|
| F201 | **Web Dashboard** | Visual tracking of all projects |
| F202 | **Pattern Recognition** | Suggest patterns from historical data |
| F203 | **Predictive Estimation** | Time estimates based on past work |
| F204 | **Team Collaboration** | Multi-user tracking and permissions |
| F205 | **CI/CD Integration** | GitHub Actions, GitLab CI plugins |
| F206 | **LLM Fine-tuning** | Custom models trained on project patterns |

---

## Technical Architecture

### Directory Structure

```
project/
├── .specsafe/                          # Framework configuration
│   ├── config.yaml                     # Settings (thresholds, frameworks, AI tools)
│   ├── state.json                      # Current phase, active tasks
│   ├── hooks/                          # Claude Code / Git hooks
│   │   ├── pre-commit                  # Block commits without tests/tracking
│   │   ├── post-commit                 # Update tracking after commit
│   │   ├── pre-push                    # Final validation before push
│   │   └── specsafe-hooks.json         # Claude Code hook definitions
│   ├── mcp/                            # MCP server for AI tools
│   │   ├── server.ts                   # MCP server implementation
│   │   ├── tools/                      # Tool definitions
│   │   │   ├── spec-parser.ts          # Parse spec files
│   │   │   ├── test-generator.ts       # Generate tests from specs
│   │   │   ├── qa-runner.ts            # Run QA and generate reports
│   │   │   └── tracking-updater.ts     # Update PROJECT_STATE.md
│   │   └── resources/                  # MCP resources (data access)
│   │       ├── specs.ts                # Spec data access
│   │       └── metrics.ts              # Metrics data access
│   ├── skills/                         # Reusable AI workflow prompts
│   │   ├── spec-create.md              # Spec creation skill
│   │   ├── test-generate.md            # Test generation skill
│   │   ├── tdd-implement.md            # TDD implementation skill
│   │   ├── qa-review.md                # QA review skill
│   │   └── complete-approve.md         # Human approval workflow
│   ├── subagents/                      # Specialized agent configs
│   │   ├── spec-reviewer/
│   │   │   ├── instructions.md
│   │   │   └── config.yaml
│   │   ├── test-generator/
│   │   │   ├── instructions.md
│   │   │   └── config.yaml
│   │   ├── code-implementer/
│   │   │   ├── instructions.md
│   │   │   └── config.yaml
│   │   └── qa-reviewer/
│   │       ├── instructions.md
│   │       └── config.yaml
│   └── tasks/                          # Task queue management
│       ├── queue.json                  # Active task queue
│       └── templates/                  # Task templates
├── specs/                              # Specifications
│   ├── active/                         # Currently being developed (SPEC→TEST→CODE→QA)
│   │   └── [capability]/
│   │       └── spec.md                 # SHALL/MUST, WHEN/THEN
│   ├── completed/                      # Production-ready, implemented specs
│   │   └── [capability]/
│   │       ├── spec.md                 # Approved specification
│   │       └── qa-report.md            # QA results that led to approval
│   ├── archive/                        # TRASHCAN: Deprecated/removed specs
│   │   └── YYYY-MM-DD-[capability]/
│   │       ├── spec.md                 # Historical record
│   │       ├── qa-report.md            # Last QA state
│   │       └── deprecation.md          # Why it was archived
│   └── templates/                      # Reusable templates
│       ├── api-endpoint.md
│       ├── ui-component.md
│       ├── database-schema.md
│       └── infrastructure.md
├── tests/                              # Test files (generated + manual)
│   ├── unit/                           # Unit tests
│   ├── integration/                    # Integration tests
│   └── e2e/                            # End-to-end tests
├── src/                                # Source code
├── tracking/                           # Historical data
│   ├── changes.log                     # All changes
│   ├── decisions.log                   # Architectural decisions
│   └── metrics.json                    # Coverage, time, bugs
├── PROJECT_STATE.md                    # Master tracking document
├── CLAUDE.md                           # Claude Code instructions
└── .opencode.yaml                      # OpenCode configuration
```

### Configuration File

```yaml
# .specsafe/config.yaml
specsafe:
  version: "1.0.0"
  project_name: "My Project"

workflow:
  enforce_tdd: true                     # Block code without tests
  require_tracking_update: true         # Block commits without tracking
  require_human_approval: true          # Require human approval in COMPLETE phase
  auto_archive: false                   # Manual archive only (trashcan)

specs:
  format: "markdown"
  normative_language: ["SHALL", "MUST", "SHALL NOT", "MUST NOT"]
  scenario_format: ["WHEN", "THEN", "AND", "GIVEN"]
  user_story_format: "As a [role], I want [feature], so that [benefit]"
  directories:
    active: "specs/active"              # Specs in development
    completed: "specs/completed"        # Production-ready specs
    archive: "specs/archive"            # Deprecated specs (trashcan)
    templates: "specs/templates"        # Reusable templates

tests:
  framework: "vitest"                   # vitest, jest, pytest, go-test
  e2e_framework: "playwright"           # playwright, cypress
  coverage_threshold: 80                # Minimum coverage %
  auto_generate: true                   # Generate from specs

qa:
  pass_threshold: 80                    # % tests must pass for GO recommendation
  corner_case_tolerance: 10             # % allowed corner case failures
  require_coverage: true                # Coverage must meet threshold
  generate_report: true                 # Create QA report
  report_location: "specs/active/{spec}/qa-report.md"

complete:
  require_qa_report: true               # Must have QA report before approval
  checklist:                            # Items human must verify
    - "QA report reviewed"
    - "Test pass rate acceptable"
    - "Coverage meets requirements"
    - "Corner cases documented"
    - "No critical failures"
    - "Implementation matches spec"
  on_approve:
    - "move_to_completed"               # Move spec to completed/
    - "include_qa_report"               # Include QA report with spec
    - "update_tracking"                 # Update PROJECT_STATE.md
  on_reject:
    - "document_feedback"               # Record rejection reason
    - "return_to_code"                  # Go back to CODE phase
    - "create_action_items"             # Create tasks for fixes

archive:
  include_deprecation_reason: true      # Require reason for archiving
  preserve_qa_history: true             # Keep QA reports in archive
  naming_pattern: "YYYY-MM-DD-{spec}"   # Archive folder naming

tracking:
  master_file: "PROJECT_STATE.md"
  auto_update: true
  track_time: true
  track_decisions: true
  log_file: "tracking/changes.log"

ai_tools:
  primary: "claude-code"                # claude-code, opencode
  secondary: "opencode"
  model_preference:
    spec_review: "claude-opus-4-5"      # Best for analysis
    test_generation: "claude-sonnet-4"  # Good for code generation
    code_implementation: "claude-sonnet-4"
    qa_review: "claude-opus-4-5"        # Best for analysis

mcp:
  enabled: true
  server_command: "npx specsafe-mcp-server"
  tools:
    - "specsafe_parse_spec"
    - "specsafe_generate_tests"
    - "specsafe_run_tests"
    - "specsafe_qa_report"
    - "specsafe_update_tracking"
    - "specsafe_get_state"
    - "specsafe_list_specs"
    - "specsafe_move_spec"

hooks:
  claude_code:
    post_edit: "specsafe hook post-edit"
    pre_commit: "specsafe hook pre-commit"
    on_stop: "specsafe hook on-stop"
  git:
    pre_commit: ".specsafe/hooks/pre-commit"
    post_commit: ".specsafe/hooks/post-commit"

subagents:
  spec_reviewer:
    enabled: true
    model: "claude-opus-4-5"
  test_generator:
    enabled: true
    model: "claude-sonnet-4"
    parallel: true
  code_implementer:
    enabled: true
    model: "claude-sonnet-4"
  qa_reviewer:
    enabled: true
    model: "claude-opus-4-5"

tasks:
  queue_file: ".specsafe/tasks/queue.json"
  auto_create_from_spec: true           # Create tasks when spec is created
  templates_dir: ".specsafe/tasks/templates"
```

---

## AI Tool Integration

### Claude Code Integration

#### Skills (`.claude/skills/`)

```markdown
# specsafe-spec.md
You are creating a specification for a new feature.

## Workflow
1. Gather requirements from the user
2. Brainstorm scenarios and edge cases
3. Write formal spec using SHALL/MUST language
4. Create WHEN/THEN scenarios for each requirement
5. Update PROJECT_STATE.md with new spec

## Output Format
- specs/active/[capability]/spec.md

## Constraints
- Every requirement MUST have at least one scenario
- Use normative language (SHALL, MUST, SHALL NOT)
- Include error scenarios, not just happy paths
```

#### Commands (`.claude/commands/`)

```markdown
# specsafe/spec.md
Create a new specification for: $ARGUMENTS

1. Read PROJECT_STATE.md to understand current state
2. Check if spec already exists in specs/
3. Brainstorm with user on requirements
4. Generate spec.md with SHALL/MUST requirements
5. Generate WHEN/THEN scenarios
6. Update PROJECT_STATE.md
```

```markdown
# specsafe/test.md
Generate tests from specification: $ARGUMENTS

1. Read the spec file at specs/active/$ARGUMENTS/spec.md
2. Parse all WHEN/THEN scenarios
3. Generate test file with .skip markers
4. Create test structure matching scenarios
5. Update PROJECT_STATE.md with test count
```

```markdown
# specsafe/dev.md
Start TDD development session for: $ARGUMENTS

1. Read spec at specs/active/$ARGUMENTS/spec.md
2. Run tests in watch mode
3. Find first failing test
4. Implement minimum code to pass
5. After each pass, update PROJECT_STATE.md
6. Continue until all tests pass
```

```markdown
# specsafe/qa.md
Run QA gate for: $ARGUMENTS

1. Run full test suite
2. Calculate pass percentage
3. Check coverage threshold
4. Generate QA report
5. If >= threshold: RETURN "GO"
6. If < threshold: RETURN "NO-GO" with failures
7. Update PROJECT_STATE.md with QA result
```

#### Hooks (`.claude/hooks/`)

```yaml
# post-tool-use hook
- matcher: "Edit|Write"
  script: |
    # Update tracking after any file change
    specsafe tracking update --file "$FILE"
```

### OpenCode Integration

#### Commands (`.opencode/command/`)

```markdown
# specsafe-spec.md
/specsafe spec [capability]

Create a new specification. See .claude/commands/specsafe/spec.md for details.
```

```markdown
# specsafe-test.md
/specsafe test [spec-path]

Generate tests from specification. See .claude/commands/specsafe/test.md for details.
```

```markdown
# specsafe-dev.md
/specsafe dev [spec-path]

Start TDD development session. See .claude/commands/specsafe/dev.md for details.
```

```markdown
# specsafe-qa.md
/specsafe qa [spec-path]

Run QA gate. See .claude/commands/specsafe/qa.md for details.
```

---

## Anthropic Best Practices Integration

SpecSafe is built AI-first, deeply integrating Anthropic's proven patterns for agentic development. This section details how each pattern is implemented.

### Overview of Anthropic Patterns

| Pattern | Purpose | SpecSafe Implementation |
|---------|---------|------------------------|
| **MCP Servers** | Tool and data connections for AI | Custom SpecSafe MCP server with spec/test/qa tools |
| **Skills** | Reusable workflow prompts | 5 skills for each workflow stage |
| **Hooks** | Pre/post action automation | Tracking updates, validation, git integration |
| **Subagents** | Specialized parallel task execution | 4 agents: spec-review, test-gen, code-impl, qa-review |
| **Tasks** | Structured work tracking | Task queue with dependencies and status |

### MCP (Model Context Protocol) Server

**Reference:** [Model Context Protocol Specification](https://modelcontextprotocol.io/specification/2025-06-18)

SpecSafe provides a custom MCP server that exposes tools and resources for AI agents to interact with the framework.

#### MCP Server Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SPECSAFE MCP SERVER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                            TOOLS                                     │  │
│   ├─────────────────────────────────────────────────────────────────────┤  │
│   │                                                                      │  │
│   │   specsafe_parse_spec      Parse spec.md into structured data       │  │
│   │   specsafe_generate_tests  Generate test skeletons from spec        │  │
│   │   specsafe_run_tests       Execute test suite and return results    │  │
│   │   specsafe_qa_report       Generate comprehensive QA report         │  │
│   │   specsafe_update_tracking Update PROJECT_STATE.md                  │  │
│   │   specsafe_get_state       Get current workflow state               │  │
│   │   specsafe_list_specs      List all specs by status                 │  │
│   │   specsafe_move_spec       Move spec between directories            │  │
│   │                                                                      │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                          RESOURCES                                   │  │
│   ├─────────────────────────────────────────────────────────────────────┤  │
│   │                                                                      │  │
│   │   specsafe://specs/active       List of active specs                │  │
│   │   specsafe://specs/completed    List of completed specs             │  │
│   │   specsafe://specs/{name}       Specific spec content               │  │
│   │   specsafe://state              Current PROJECT_STATE.md            │  │
│   │   specsafe://metrics            Project metrics                     │  │
│   │   specsafe://config             Framework configuration             │  │
│   │                                                                      │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                           PROMPTS                                    │  │
│   ├─────────────────────────────────────────────────────────────────────┤  │
│   │                                                                      │  │
│   │   spec_review_prompt       Review spec for completeness             │  │
│   │   test_generation_prompt   Generate tests from scenarios            │  │
│   │   tdd_implementation       TDD red-green-refactor guidance          │  │
│   │   qa_analysis_prompt       Analyze test results                     │  │
│   │                                                                      │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### MCP Tool Definitions

```typescript
// .specsafe/mcp/tools/spec-parser.ts
export const specParserTool = {
  name: "specsafe_parse_spec",
  description: "Parse a spec.md file and extract requirements, scenarios, and user stories",
  inputSchema: {
    type: "object",
    properties: {
      specPath: {
        type: "string",
        description: "Path to spec.md file (e.g., specs/active/auth/spec.md)"
      },
      includeMetadata: {
        type: "boolean",
        description: "Include file metadata (created, modified dates)",
        default: true
      }
    },
    required: ["specPath"]
  },
  handler: async ({ specPath, includeMetadata }) => {
    // Parse spec and return structured data
    return {
      requirements: [...],      // Array of requirements with scenarios
      userStories: [...],       // Array of user stories
      metadata: includeMetadata ? {...} : undefined
    };
  }
};

// .specsafe/mcp/tools/test-generator.ts
export const testGeneratorTool = {
  name: "specsafe_generate_tests",
  description: "Generate test file skeletons from parsed spec scenarios",
  inputSchema: {
    type: "object",
    properties: {
      specPath: { type: "string" },
      testFramework: {
        type: "string",
        enum: ["vitest", "jest", "pytest", "go-test"],
        default: "vitest"
      },
      outputPath: { type: "string" }
    },
    required: ["specPath"]
  }
};

// .specsafe/mcp/tools/qa-runner.ts
export const qaRunnerTool = {
  name: "specsafe_qa_report",
  description: "Run tests and generate comprehensive QA report with GO/NO-GO recommendation",
  inputSchema: {
    type: "object",
    properties: {
      specPath: { type: "string" },
      passThreshold: { type: "number", default: 80 },
      coverageThreshold: { type: "number", default: 80 },
      cornerCaseTolerance: { type: "number", default: 10 }
    },
    required: ["specPath"]
  }
};
```

#### MCP Server Configuration

```json
// claude_desktop_config.json or .claude/mcp.json
{
  "mcpServers": {
    "specsafe": {
      "command": "npx",
      "args": ["specsafe-mcp-server"],
      "env": {
        "SPECSAFE_PROJECT_ROOT": "."
      }
    }
  }
}
```

**References:**
- [Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [Writing effective tools for AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
- [Build an MCP Server](https://modelcontextprotocol.io/docs/develop/build-server)

---

### Skills: Encapsulating Workflows

**Reference:** [Equipping agents with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

Skills are reusable prompts that capture successful workflow approaches. SpecSafe provides 5 core skills.

#### Skill Design Principles (from Anthropic)

1. **Be concise** - Shorter skills are more effective
2. **Structure well** - Use clear sections and formatting
3. **Test with real usage** - Iterate based on actual results
4. **Capture successful patterns** - Encode what works

#### SpecSafe Skills

```markdown
# .specsafe/skills/spec-create.md

You are creating a specification for a new feature using SpecSafe.

## Context
- Project uses SPEC → TEST → CODE → QA → COMPLETE workflow
- Specs use normative language (SHALL/MUST) and WHEN/THEN scenarios
- Every requirement MUST have at least one scenario

## Workflow
1. Understand the feature request from the user
2. Brainstorm requirements and edge cases together
3. Write user stories in standard format
4. Create requirements using SHALL/MUST language
5. Generate WHEN/THEN scenarios for each requirement
6. Include error scenarios, not just happy paths
7. Save to specs/active/[capability]/spec.md
8. Update PROJECT_STATE.md

## Output Format
```markdown
# [Capability] Specification

## User Stories
### US-001: [Title]
**As a** [role], **I want** [feature], **so that** [benefit]

## Requirements
### Requirement: [Name]
The system SHALL [behavior].

#### Scenario: [Name]
- **GIVEN** [precondition]
- **WHEN** [trigger]
- **THEN** [expected result]
```

## Constraints
- Use SHALL for mandatory requirements
- Use MUST NOT for prohibitions
- Every scenario needs WHEN and THEN at minimum
- Include at least one error scenario per requirement
```

```markdown
# .specsafe/skills/test-generate.md

You are generating test files from a SpecSafe specification.

## Context
- Tests are generated BEFORE implementation (TDD)
- All generated tests start with .skip (pending)
- Test structure mirrors spec structure

## Workflow
1. Read and parse the spec file
2. Extract all WHEN/THEN scenarios
3. Convert each scenario to a test case
4. Generate test file with proper imports
5. Mark all tests as .skip
6. Save to tests/[type]/[capability].spec.test.[ext]
7. Update PROJECT_STATE.md with test count

## Test Naming Convention
Scenario: "User login success"
→ Test: it.skip('should [THEN] when [WHEN]', ...)

## Output Format (Vitest)
```typescript
describe('[Capability]', () => {
  describe('[Requirement Name]', () => {
    // From: Scenario: [Name]
    it.skip('should [THEN] when [WHEN]', async () => {
      // GIVEN: [precondition]
      // WHEN: [trigger]
      // THEN: [expected]
    });
  });
});
```

## Constraints
- NEVER implement test bodies, only structure
- ALL tests must be .skip initially
- Include scenario source as comment
```

```markdown
# .specsafe/skills/tdd-implement.md

You are implementing code using Test-Driven Development in SpecSafe.

## The TDD Cycle
```
   ┌──────────────────────────────────────────┐
   │                                          │
   │    RED → GREEN → REFACTOR → REPEAT       │
   │                                          │
   │    1. Find failing test (RED)            │
   │    2. Write minimum code (GREEN)         │
   │    3. Improve code (REFACTOR)            │
   │    4. Next test (REPEAT)                 │
   │                                          │
   └──────────────────────────────────────────┘
```

## Workflow
1. Run tests to find the first failing test
2. Read the spec scenario for context
3. Remove .skip from ONE test
4. Write MINIMUM code to make it pass
5. Run tests to verify GREEN
6. Refactor if needed (keep GREEN)
7. Update PROJECT_STATE.md
8. Repeat until all tests pass

## Constraints
- NEVER write code without a failing test
- NEVER implement more than one test at a time
- ALWAYS run tests after each change
- ALWAYS update tracking after each GREEN
```

```markdown
# .specsafe/skills/qa-review.md

You are running QA validation for a SpecSafe specification.

## Purpose
Generate a comprehensive QA report for human review.
You do NOT make the final decision - humans do.

## Workflow
1. Run full test suite for the spec
2. Collect test results (pass/fail/skip)
3. Calculate pass percentage
4. Check coverage metrics
5. Identify corner case failures
6. Generate QA report with recommendation
7. Save report to specs/active/[capability]/qa-report.md
8. Update PROJECT_STATE.md

## Report Format
```markdown
# QA Report: [Capability]

**Generated:** [timestamp]
**Spec:** [path]

## Test Results
| Status | Count | Percentage |
|--------|-------|------------|
| Passed | X | X% |
| Failed | X | X% |
| Skipped | X | X% |

## Coverage
- Statements: X%
- Branches: X%
- Functions: X%
- Lines: X%

## Failed Tests
1. [test name] - [reason]
2. ...

## Corner Cases
[Analysis of edge case handling]

## Recommendation
**[GO / NO-GO]**

Rationale: [explanation]

## Action Items (if NO-GO)
1. [item]
2. [item]
```

## Constraints
- Be objective in analysis
- Clearly explain failures
- Provide actionable items for NO-GO
```

```markdown
# .specsafe/skills/complete-approve.md

You are assisting a human with the COMPLETE phase approval.

## Context
This phase requires HUMAN decision. You assist but do not decide.

## Workflow
1. Present QA report summary to human
2. Highlight key metrics and any concerns
3. Show the approval checklist
4. Wait for human decision
5. If APPROVED: Move spec to completed/
6. If REJECTED: Document feedback, return to CODE
7. Update PROJECT_STATE.md

## Approval Checklist (present to human)
- [ ] QA report reviewed
- [ ] Test pass rate acceptable
- [ ] Coverage meets requirements
- [ ] Corner cases documented
- [ ] No critical failures
- [ ] Implementation matches spec

## On Approval
- Move specs/active/[cap]/ → specs/completed/[cap]/
- Include qa-report.md with spec
- Update PROJECT_STATE.md status to COMPLETE
- Log completion in tracking/changes.log

## On Rejection
- Document human feedback
- Create action items
- Return to CODE phase
- Update PROJECT_STATE.md with rejection reason
```

---

### Hooks: Automation at Key Points

**Reference:** [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

Hooks are shell scripts or commands that run automatically before or after actions. SpecSafe uses hooks for:
- Automatic tracking updates
- Validation before commits
- Security checks
- Context injection

#### Hook Types

| Hook Type | Trigger | Purpose |
|-----------|---------|---------|
| `PreToolUse` | Before any tool executes | Validation, context injection |
| `PostToolUse` | After any tool executes | Tracking updates, logging |
| `PreCommit` | Before git commit | Test validation, tracking check |
| `PostCommit` | After git commit | Metrics update |
| `UserPromptSubmit` | Before processing user input | Context loading |
| `Stop` | When agent stops | Final tracking update |

#### SpecSafe Hook Configuration

```json
// .claude/settings.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "specsafe hook pre-edit --file \"$SPECSAFE_FILE\""
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "specsafe hook post-edit --file \"$SPECSAFE_FILE\""
      },
      {
        "matcher": "Bash",
        "command": "specsafe hook post-bash"
      }
    ],
    "PreCommit": [
      {
        "command": "specsafe hook pre-commit"
      }
    ],
    "Stop": [
      {
        "command": "specsafe hook on-stop"
      }
    ]
  }
}
```

#### Hook Implementations

```bash
#!/bin/bash
# .specsafe/hooks/post-edit.sh
# Runs after any file edit to update tracking

FILE="$1"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
TRACKING_FILE="PROJECT_STATE.md"

# Update "Last Updated" timestamp
sed -i "s/\*\*Last Updated:\*\* .*/\*\*Last Updated:\*\* $TIMESTAMP/" "$TRACKING_FILE"

# Add to change log
echo "| $TIMESTAMP | EDIT | $FILE | AI | Auto-tracked |" >> tracking/changes.log

echo "✓ Tracking updated for $FILE"
```

```bash
#!/bin/bash
# .specsafe/hooks/pre-commit.sh
# Validates before allowing git commit

# Check if tests pass
if ! specsafe test run --quick; then
  echo "❌ Tests failing. Commit blocked."
  exit 1
fi

# Check if tracking is updated
LAST_UPDATE=$(grep "Last Updated" PROJECT_STATE.md | cut -d' ' -f3)
TODAY=$(date +"%Y-%m-%d")

if [[ "$LAST_UPDATE" != "$TODAY" ]]; then
  echo "⚠️  PROJECT_STATE.md not updated today. Updating..."
  specsafe track update
fi

echo "✓ Pre-commit checks passed"
exit 0
```

```bash
#!/bin/bash
# .specsafe/hooks/on-stop.sh
# Final tracking update when agent stops

specsafe track update --final
echo "✓ Final tracking update complete"
```

#### Hook Best Practices

1. **Keep hooks fast** - They run on every action
2. **Fail gracefully** - Don't block on non-critical failures
3. **Log everything** - Hooks should contribute to tracking
4. **Be idempotent** - Running twice should be safe

**References:**
- [Configure Claude Code Hooks](https://www.gend.co/blog/configure-claude-code-hooks-automation)
- [Claude Code Hooks Implementation Guide](https://medium.com/spillwave-solutions/claude-code-hooks-implementation-guide-audit-system-03763748700f)

---

### Subagents: Parallel Task Execution

**Reference:** [Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)

Subagents are specialized agents that handle specific task types. SpecSafe uses 4 subagents that can work in parallel or sequence.

#### Subagent Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SPECSAFE SUBAGENT SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                          ┌──────────────────┐                               │
│                          │   ORCHESTRATOR   │                               │
│                          │   (Main Agent)   │                               │
│                          └────────┬─────────┘                               │
│                                   │                                         │
│                    ┌──────────────┼──────────────┐                          │
│                    │              │              │                          │
│     PARALLEL ──────┼──────────────┼──────────────┼────── PARALLEL           │
│                    │              │              │                          │
│                    ▼              ▼              ▼                          │
│           ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                   │
│           │   SPEC      │ │   TEST      │ │   CODE      │                   │
│           │  REVIEWER   │ │  GENERATOR  │ │ IMPLEMENTER │                   │
│           │             │ │             │ │             │                   │
│           │ Model: Opus │ │Model: Sonnet│ │Model: Sonnet│                   │
│           │ Read-only   │ │ Write tests │ │ Write code  │                   │
│           └─────────────┘ └─────────────┘ └─────────────┘                   │
│                    │              │              │                          │
│                    └──────────────┼──────────────┘                          │
│                                   │                                         │
│     SEQUENTIAL ───────────────────┼───────────────────── SEQUENTIAL         │
│                                   │                                         │
│                                   ▼                                         │
│                          ┌─────────────┐                                    │
│                          │     QA      │                                    │
│                          │  REVIEWER   │                                    │
│                          │             │                                    │
│                          │ Model: Opus │                                    │
│                          │ Analysis    │                                    │
│                          └─────────────┘                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Execution Modes:
- PARALLEL: spec-reviewer + test-generator can run simultaneously
- SEQUENTIAL: qa-reviewer runs after code-implementer completes
```

#### Subagent Configuration Files

```yaml
# .specsafe/subagents/spec-reviewer/config.yaml
name: spec-reviewer
model: claude-opus-4-5
purpose: Review specifications for completeness and quality

tools:
  - Read
  - Glob
  - Grep

allowed_tools:
  - "Read"
  - "Glob(specs/**)"
  - "Grep"

timeout: 300  # 5 minutes max

instructions: |
  You are a specification reviewer for SpecSafe.

  Your responsibilities:
  1. Validate spec follows correct format
  2. Ensure all requirements have scenarios
  3. Check for missing edge cases
  4. Verify normative language usage
  5. Suggest improvements

  You are READ-ONLY. Never modify files.

output_format: |
  ## Spec Review: [name]

  ### Format Compliance
  - [x] Uses SHALL/MUST language
  - [ ] Missing scenarios for requirement X

  ### Completeness
  - [x] Happy path covered
  - [ ] Error handling missing for Y

  ### Suggestions
  1. Add scenario for Z
  2. Clarify requirement W
```

```yaml
# .specsafe/subagents/test-generator/config.yaml
name: test-generator
model: claude-sonnet-4
purpose: Generate test skeletons from specifications

tools:
  - Read
  - Write
  - Glob

allowed_tools:
  - "Read"
  - "Write(tests/**)"
  - "Glob(specs/**)"

parallel: true  # Can run multiple instances

instructions: |
  You are a test generator for SpecSafe.

  Your responsibilities:
  1. Parse WHEN/THEN scenarios from specs
  2. Convert to test cases
  3. Generate proper test structure
  4. Mark all tests as .skip
  5. Update tracking

  NEVER implement test bodies.
  ALWAYS use .skip for new tests.

output_pattern: "tests/{type}/{capability}.spec.test.{ext}"
```

```yaml
# .specsafe/subagents/code-implementer/config.yaml
name: code-implementer
model: claude-sonnet-4
purpose: Implement code using TDD (red-green-refactor)

tools:
  - Read
  - Write
  - Edit
  - Bash

allowed_tools:
  - "Read"
  - "Write(src/**)"
  - "Edit(src/**)"
  - "Bash(npm test*)"
  - "Bash(pnpm test*)"

instructions: |
  You are a TDD code implementer for SpecSafe.

  STRICT TDD RULES:
  1. Find first failing test
  2. Write MINIMUM code to pass
  3. Run tests to verify
  4. Refactor if needed
  5. Update tracking
  6. Repeat

  NEVER:
  - Write code without failing test
  - Implement multiple tests at once
  - Skip the refactor step
```

```yaml
# .specsafe/subagents/qa-reviewer/config.yaml
name: qa-reviewer
model: claude-opus-4-5
purpose: Run QA validation and generate reports

tools:
  - Read
  - Write
  - Bash
  - Glob

allowed_tools:
  - "Read"
  - "Write(specs/**/qa-report.md)"
  - "Bash(npm test*)"
  - "Bash(pnpm test*)"
  - "Glob"

instructions: |
  You are a QA reviewer for SpecSafe.

  Your responsibilities:
  1. Run complete test suite
  2. Analyze results
  3. Check coverage
  4. Identify corner cases
  5. Generate QA report
  6. Make GO/NO-GO recommendation

  You RECOMMEND, human DECIDES.
  Be objective and thorough.
```

#### Spawning Subagents

```markdown
# In main agent workflow

## Parallel Spec Review and Test Generation
I'll spawn two subagents in parallel:

[Task: spec-reviewer]
Review the authentication spec for completeness.

[Task: test-generator]
Generate tests from the authentication spec.

## Sequential QA After Implementation
[Task: qa-reviewer]
Run QA validation for authentication spec.
```

**References:**
- [Building Agents with Claude SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Best practices for Claude Code subagents](https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/)

---

### Tasks: Structured Work Management

**Reference:** [Agentic Workflows Architecture Patterns](https://medium.com/@reliabledataengineering/agentic-workflows-with-claude-architecture-patterns-design-principles-production-patterns-72bbe4f7e85a)

Tasks provide structured tracking of work items with dependencies, status, and ownership.

#### Task Structure

```json
// .specsafe/tasks/queue.json
{
  "tasks": [
    {
      "id": "task-001",
      "subject": "Generate tests for authentication spec",
      "description": "Parse auth spec and create test skeletons",
      "status": "completed",
      "owner": "test-generator",
      "spec": "specs/active/authentication/spec.md",
      "created_at": "2026-01-26T10:00:00Z",
      "started_at": "2026-01-26T10:05:00Z",
      "completed_at": "2026-01-26T10:15:00Z",
      "outputs": ["tests/unit/authentication.spec.test.ts"],
      "blocks": ["task-002"],
      "blocked_by": []
    },
    {
      "id": "task-002",
      "subject": "Implement authentication login",
      "description": "TDD implementation of login functionality",
      "status": "in_progress",
      "owner": "code-implementer",
      "spec": "specs/active/authentication/spec.md",
      "test": "tests/unit/authentication.spec.test.ts",
      "created_at": "2026-01-26T10:15:00Z",
      "started_at": "2026-01-26T10:20:00Z",
      "completed_at": null,
      "blocks": ["task-003"],
      "blocked_by": ["task-001"]
    },
    {
      "id": "task-003",
      "subject": "QA validation for authentication",
      "description": "Run tests and generate QA report",
      "status": "pending",
      "owner": null,
      "spec": "specs/active/authentication/spec.md",
      "created_at": "2026-01-26T10:00:00Z",
      "blocks": [],
      "blocked_by": ["task-002"]
    }
  ]
}
```

#### Task Commands

```bash
# Create a task
specsafe task create --subject "Implement login" --spec auth --type implementation

# List tasks
specsafe task list --status pending
specsafe task list --owner code-implementer

# Update task status
specsafe task update task-002 --status in_progress
specsafe task update task-002 --status completed

# Get task details
specsafe task get task-002

# Run next available task
specsafe task next --owner code-implementer
```

#### Task Integration with Subagents

When a subagent starts work, it:
1. Claims a task from the queue
2. Updates status to `in_progress`
3. Performs the work
4. Updates status to `completed`
5. Unblocks dependent tasks

```typescript
// Subagent task workflow
const task = await specsafe.task.claimNext({ owner: 'code-implementer' });
await specsafe.task.update(task.id, { status: 'in_progress' });

// ... do work ...

await specsafe.task.update(task.id, {
  status: 'completed',
  outputs: ['src/auth/login.ts']
});
```

---

## CLI Design

### Installation

```bash
# npm (recommended)
npm install -g specsafe

# curl one-liner
curl -fsSL https://specsafe.dev/install | bash

# homebrew (future)
brew install specsafe
```

### Commands

```bash
# Project Management
specsafe init [path]              # Initialize SpecSafe in project
specsafe update                   # Update SpecSafe configuration
specsafe status                   # Show current state and progress

# Specification (Stage 1: SPEC)
specsafe spec create <name>       # Create new specification
specsafe spec list                # List all specifications by status
specsafe spec show <name>         # Display specification details
specsafe spec validate <name>     # Validate spec format

# Testing (Stage 2: TEST)
specsafe test create <spec>       # Generate tests from spec (with .skip)
specsafe test run [spec]          # Run tests (all or specific spec)
specsafe test watch [spec]        # Watch mode for TDD
specsafe test coverage            # Show coverage report

# Development (Stage 3: CODE)
specsafe dev start <spec>         # Start TDD session
specsafe dev status               # Show current dev session status

# Quality Assurance (Stage 4: QA)
specsafe qa run <spec>            # Run tests and generate QA report
specsafe qa report [spec]         # View existing QA report
specsafe qa threshold <percent>   # Set pass threshold

# Completion (Stage 5: COMPLETE)
specsafe complete <spec>          # Human approval - move to completed/
specsafe complete list            # List specs pending approval
specsafe complete reject <spec>   # Reject and return to CODE stage

# Archive (Maintenance - Trashcan)
specsafe archive <spec>           # Move deprecated spec to archive/
specsafe archive list             # List archived specs
specsafe archive restore <spec>   # Restore archived spec to active/

# Tracking
specsafe track update             # Manual tracking update
specsafe track history            # Show change history
specsafe track metrics            # Show project metrics

# Tasks
specsafe task create <subject>    # Create a new task
specsafe task list [--status]     # List tasks
specsafe task next                # Get next available task
specsafe task update <id>         # Update task status

# AI Tool Integration
specsafe ai setup                 # Configure AI tool integration
specsafe ai agents                # List available subagents
specsafe mcp start                # Start MCP server
```

### Command Aliases (for AI tools)

```bash
# These are the simplified commands for AI tool integration
# Used as Claude Code skills/commands or OpenCode commands

specsafe:spec                     # → specsafe spec create
specsafe:test                     # → specsafe test create
specsafe:dev                      # → specsafe dev start
specsafe:qa                       # → specsafe qa run
specsafe:complete                 # → specsafe complete (human approval)
specsafe:archive                  # → specsafe archive (trashcan)
```

### Workflow Command Sequence

```bash
# Typical workflow for a new feature

# Stage 1: SPEC
specsafe:spec user-authentication

# Stage 2: TEST
specsafe:test user-authentication

# Stage 3: CODE (TDD loop)
specsafe:dev user-authentication

# Stage 4: QA (generates report)
specsafe:qa user-authentication

# Stage 5: COMPLETE (human reviews and approves)
specsafe:complete user-authentication
# → Spec moved to completed/user-authentication/

# Later: Deprecate when no longer needed
specsafe:archive user-authentication
# → Spec moved to archive/2026-01-26-user-authentication/
```

---

## Multi-Agent System

### Agent Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SPECSAFE AGENT ORCHESTRATION                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                           ┌──────────────────┐                              │
│                           │  ORCHESTRATOR    │                              │
│                           │  (Main Agent)    │                              │
│                           └────────┬─────────┘                              │
│                                    │                                        │
│           ┌────────────────────────┼────────────────────────┐               │
│           │                        │                        │               │
│           ▼                        ▼                        ▼               │
│   ┌───────────────┐       ┌───────────────┐       ┌───────────────┐        │
│   │ SPEC-REVIEWER │       │ TEST-GENERATOR│       │ CODE-IMPLEMENT│        │
│   │               │       │               │       │               │        │
│   │ - Validate    │       │ - Parse specs │       │ - TDD cycle   │        │
│   │ - Suggest     │       │ - Generate    │       │ - Refactor    │        │
│   │ - Improve     │       │ - Skeleton    │       │ - Optimize    │        │
│   └───────────────┘       └───────────────┘       └───────────────┘        │
│           │                        │                        │               │
│           └────────────────────────┼────────────────────────┘               │
│                                    │                                        │
│                                    ▼                                        │
│                           ┌───────────────┐                                 │
│                           │  QA-REVIEWER  │                                 │
│                           │               │                                 │
│                           │ - Test run    │                                 │
│                           │ - Coverage    │                                 │
│                           │ - GO/NO-GO    │                                 │
│                           └───────────────┘                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agent Configurations

#### spec-reviewer

```yaml
# .specsafe/subagents/spec-reviewer/config.yaml
name: spec-reviewer
model: claude-opus-4-5
purpose: Review and improve specifications

tools:
  - Read
  - Glob
  - Grep

instructions: |
  You are a specification reviewer. Your job is to:
  1. Validate specs follow the correct format
  2. Ensure all requirements have scenarios
  3. Suggest missing edge cases
  4. Improve normative language clarity

constraints:
  - Read-only (no file modifications)
  - Must validate before approving
```

#### test-generator

```yaml
# .specsafe/subagents/test-generator/config.yaml
name: test-generator
model: claude-sonnet-4
purpose: Generate test files from specifications

tools:
  - Read
  - Write
  - Glob

instructions: |
  You are a test generator. Your job is to:
  1. Parse WHEN/THEN scenarios from specs
  2. Convert scenarios to test cases
  3. Generate test file with proper structure
  4. Mark all tests as .skip (pending implementation)
  5. Update PROJECT_STATE.md with test count

output_pattern: tests/{type}/{capability}.spec.test.{ext}
```

#### code-implementer

```yaml
# .specsafe/subagents/code-implementer/config.yaml
name: code-implementer
model: claude-sonnet-4
purpose: Implement code to pass tests (TDD)

tools:
  - Read
  - Write
  - Edit
  - Bash

instructions: |
  You are a TDD code implementer. Your job is to:
  1. Find the first failing test
  2. Write MINIMUM code to pass it
  3. Run tests to verify
  4. Refactor if needed (keep tests green)
  5. Update PROJECT_STATE.md after each test passes
  6. Repeat until all tests pass

constraints:
  - Never write code without a failing test
  - Implement ONE test at a time
  - Keep changes minimal
```

#### qa-reviewer

```yaml
# .specsafe/subagents/qa-reviewer/config.yaml
name: qa-reviewer
model: claude-opus-4-5
purpose: Quality assurance and GO/NO-GO decision

tools:
  - Read
  - Bash
  - Glob

instructions: |
  You are a QA reviewer. Your job is to:
  1. Run the complete test suite
  2. Calculate pass percentage
  3. Check coverage against threshold
  4. Identify corner case failures
  5. Make GO/NO-GO decision
  6. Generate QA report
  7. Update PROJECT_STATE.md

decision_logic: |
  IF pass_percentage >= config.qa.pass_threshold
    AND coverage >= config.tests.coverage_threshold
    AND corner_case_failures <= config.qa.corner_case_tolerance
  THEN "GO"
  ELSE "NO-GO"
```

---

## Tracking & History

### PROJECT_STATE.md Format

```markdown
# Project State - [Project Name]

**Last Updated:** YYYY-MM-DD HH:MM
**Current Phase:** [SPEC | TEST | CODE | QA | COMPLETE]
**Active Spec:** [spec-name or "None"]

## Spec Status Summary

| Spec | Location | Phase | Tests | Pass Rate | Coverage | QA Status |
|------|----------|-------|-------|-----------|----------|-----------|
| authentication | completed/ | DONE | 15/15 | 100% | 92% | APPROVED |
| course-gen | active/ | CODE | 8/12 | 66% | 72% | - |
| payments | active/ | SPEC | 0/0 | - | - | - |
| old-feature | archive/ | DEPRECATED | - | - | - | - |

**Legend:**
- `active/` - Currently in development workflow
- `completed/` - Production-ready, human-approved
- `archive/` - Deprecated/removed (trashcan)

## Current Work

### Active: course-gen

**Phase:** CODE (TDD Implementation)
**Tests:** 8 passing, 4 failing, 0 skipped
**Pass Rate:** 66%
**Coverage:** 72%
**Blockers:** None

**Next Failing Test:** `should validate course title length`

**Recent Progress:**
- ✅ Input validation tests (3/3)
- ✅ AI prompt construction (2/2)
- 🔄 Response parsing (2/4)
- ⏳ Error handling (0/3)

## Pending Human Approvals

| Spec | QA Date | Pass Rate | Coverage | Recommendation |
|------|---------|-----------|----------|----------------|
| (none pending) | - | - | - | - |

## Change Log

| Date | Time | Action | Spec | Files | Agent | Notes |
|------|------|--------|------|-------|-------|-------|
| 2026-01-26 | 14:30 | TEST_PASS | course-gen | course-gen.test.ts | code-impl | Input validation |
| 2026-01-26 | 14:15 | CODE_EDIT | course-gen | course-gen.ts | code-impl | Added validator |
| 2026-01-26 | 13:00 | TEST_CREATE | course-gen | course-gen.test.ts | test-gen | 12 tests generated |
| 2026-01-26 | 12:00 | SPEC_CREATE | course-gen | spec.md | human | Course gen spec |
| 2026-01-25 | 16:00 | APPROVED | authentication | - | human | Human approved |
| 2026-01-25 | 15:30 | QA_REPORT | authentication | qa-report.md | qa-review | GO recommended |

## Metrics

| Metric | Value | Target |
|--------|-------|--------|
| Specs in Development | 2 | - |
| Specs Completed | 1 | 3 |
| Specs Archived | 1 | - |
| Overall Test Coverage | 78% | 80% |
| Avg Time per Spec | 4.5 hrs | - |

## Decision Log

| Date | Decision | Rationale | Alternatives Considered |
|------|----------|-----------|------------------------|
| 2026-01-26 | Use Z.ai for AI | Cost-effective | OpenAI, Anthropic |
| 2026-01-25 | Vitest over Jest | Faster, native ESM | Jest, Mocha |

## Archived Specs

| Spec | Archived Date | Reason |
|------|---------------|--------|
| old-feature | 2026-01-20 | Superseded by new-feature |
```

### Automatic Tracking Rules

| Event | Phase | Tracking Update |
|-------|-------|-----------------|
| Spec created | SPEC | Add to spec table (active/), change log |
| Spec validated | SPEC | Update spec status, change log |
| Test generated | TEST | Update test count, change log |
| Test passes | CODE | Update pass count, progress, change log |
| Test fails | CODE | Log failure, update pass rate |
| Code edited | CODE | Add to change log |
| QA run | QA | Generate report, update metrics, change log |
| Human approves | COMPLETE | Move to completed/, update status, change log |
| Human rejects | COMPLETE | Log rejection, return to CODE, create tasks |
| Spec archived | ARCHIVE | Move to archive/, add to archived table, change log |
| Spec restored | - | Move from archive/ to active/, change log |

### State Transitions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SPEC STATE MACHINE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────┐                                                              │
│   │  active/ │  ──── SPEC → TEST → CODE → QA ────────┐                     │
│   │          │                     ↑                  │                     │
│   │  (new)   │                     │                  ▼                     │
│   └──────────┘                     │           ┌─────────────┐              │
│                                    │           │   COMPLETE  │              │
│                             REJECT │           │  (human)    │              │
│                                    │           └──────┬──────┘              │
│                                    │                  │                     │
│                                    └──────────────────┤ APPROVE             │
│                                                       ▼                     │
│                                              ┌─────────────┐                │
│                                              │ completed/  │                │
│                                              │ (production)│                │
│                                              └──────┬──────┘                │
│                                                     │                       │
│                                              DEPRECATE                      │
│                                                     │                       │
│                                                     ▼                       │
│                                              ┌─────────────┐                │
│                                              │  archive/   │                │
│                                              │ (trashcan)  │                │
│                                              └─────────────┘                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Comparison with Existing Tools

### SpecSafe vs OpenSpec

| Feature | OpenSpec | SpecSafe |
|---------|----------|----------|
| Spec format | Markdown | Markdown (enhanced) |
| Workflow | Proposal → Apply → Archive | **SPEC→TEST→CODE→QA→COMPLETE** |
| Test generation | Manual | **Automatic from specs** |
| TDD enforcement | None | **Git hooks + CLI** |
| Tracking | Manual updates | **Automatic** |
| QA gates | None | **Report + human approval** |
| Human-in-the-loop | Proposal approval | **Every phase + COMPLETE gate** |
| Multi-agent | None | **4 specialized agents** |
| AI tools | 21 supported | Claude Code + OpenCode (extensible) |
| Archive purpose | Completed work | **Trashcan (deprecated specs)** |

### SpecSafe vs Eigent.ai

| Feature | Eigent.ai | SpecSafe |
|---------|-----------|----------|
| Purpose | General automation | **Software development TDD** |
| Workflow | Task-based | **SPEC→TEST→CODE→QA→COMPLETE** |
| Test focus | None | **TDD-first** |
| Spec integration | None | **Core feature** |
| Quality gates | None | **QA report + human approval** |
| Human approval | Task completion | **Explicit COMPLETE phase** |
| Tracking | Basic | **Comprehensive history** |
| Local-first | Yes | Yes |
| Multi-agent | Yes | Yes (specialized for TDD) |
| MCP tools | 200+ general | **TDD-specific tools** |

### SpecSafe vs Claude Code / OpenCode

| Feature | Claude Code | OpenCode | SpecSafe |
|---------|-------------|----------|----------|
| TDD workflow | Manual | Manual | **Enforced 5-stage** |
| Spec integration | None | None | **Core** |
| Test generation | Manual | Manual | **Automatic** |
| QA validation | None | None | **Report generation** |
| Human approval | None | None | **COMPLETE phase** |
| Tracking | CLAUDE.md | .opencode.yaml | **PROJECT_STATE.md** |
| Multi-agent | Subagents | Subagents | **Specialized TDD agents** |
| MCP server | Custom | Custom | **Pre-built for TDD** |
| Hooks | Supported | Limited | **TDD-specific hooks** |

---

## Success Metrics

### Adoption Metrics

| Metric | Target (6 months) | Target (12 months) |
|--------|-------------------|-------------------|
| GitHub Stars | 1,000 | 5,000 |
| npm Downloads/week | 500 | 2,000 |
| Active Projects | 100 | 500 |
| Contributors | 10 | 30 |

### Quality Metrics

| Metric | Target |
|--------|--------|
| CLI Installation Success | > 95% |
| Test Generation Accuracy | > 90% |
| QA Gate Reliability | > 99% |
| Tracking Accuracy | 100% |

### User Satisfaction

| Metric | Target |
|--------|--------|
| NPS Score | > 50 |
| Feature Completion Rate | > 80% |
| Support Response Time | < 24 hours |

---

## Roadmap

### Phase 1: Foundation (Months 1-2)

- [ ] CLI core (`init`, `status`, `track`)
- [ ] Spec creation and parsing (`specsafe:spec`)
- [ ] Test generation for TypeScript/Vitest (`specsafe:test`)
- [ ] Basic tracking (PROJECT_STATE.md auto-updates)
- [ ] Git hooks (pre-commit validation)
- [ ] Claude Code integration (skills, commands)
- [ ] Directory structure (active/, completed/, archive/)

### Phase 2: Full Workflow (Months 3-4)

- [ ] TDD dev command with watch mode (`specsafe:dev`)
- [ ] QA validation and report generation (`specsafe:qa`)
- [ ] Human approval workflow (`specsafe:complete`)
- [ ] Archive as trashcan (`specsafe:archive`)
- [ ] OpenCode integration
- [ ] Multi-language support (Python, Go, Terraform)

### Phase 3: AI-First Features (Months 5-6)

- [ ] MCP server with SpecSafe tools
- [ ] Subagent orchestration (spec-reviewer, test-gen, code-impl, qa-review)
- [ ] Parallel agent execution
- [ ] Task queue management
- [ ] Claude Code hooks integration
- [ ] Decision logging

### Phase 4: Ecosystem (Months 7+)

- [ ] VS Code extension
- [ ] Web dashboard for tracking
- [ ] CI/CD plugins (GitHub Actions, GitLab CI)
- [ ] Spec template marketplace
- [ ] Team collaboration features
- [ ] Custom test framework adapters

---

## Open Questions

### Technical

1. **Test Framework Detection** - How to auto-detect and configure different test frameworks?
2. **Language-Specific Parsing** - How to parse specs into language-specific test syntax?
3. **Coverage Integration** - How to integrate with various coverage tools?

### Product

1. **Free vs Paid** - Should there be a paid tier? What features?
2. **Cloud Component** - Should tracking/metrics have optional cloud sync?
3. **Enterprise Features** - What enterprise features are needed?

### Community

1. **Template Contributions** - How to manage community-contributed templates?
2. **Plugin Architecture** - How to enable third-party extensions?

---

## References

### Inspiration Sources

- [OpenSpec by Fission AI](https://github.com/Fission-AI/OpenSpec) - Spec-driven development
- [Eigent.ai](https://github.com/eigent-ai/eigent) - Multi-agent architecture
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [OpenCode](https://github.com/sst/opencode) - Open-source AI coding agent

### Anthropic Engineering Articles

- [Equipping Agents with Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Building Agents with Claude SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Writing Tools for Agents](https://www.anthropic.com/engineering/writing-tools-for-agents)

### TDD Resources

- Kent Beck - "Test-Driven Development: By Example"
- Martin Fowler - "Refactoring"
- Robert C. Martin - "Clean Code"

---

## Appendix A: Spec File Format

```markdown
# [Capability Name] Specification

## Overview
[Brief description]

## User Stories

### US-001: [Story Title]
**As a** [role]
**I want** [feature]
**So that** [benefit]

## Requirements

### Requirement: [Requirement Name]

The system SHALL [behavioral requirement].

The system MUST NOT [prohibited behavior].

#### Scenario: [Scenario Name]

- **GIVEN** [precondition]
- **WHEN** [trigger condition]
- **THEN** the system SHALL [expected outcome]
- **AND** [additional expectation]

#### Scenario: [Error Scenario]

- **GIVEN** [precondition]
- **WHEN** [invalid input or error condition]
- **THEN** the system SHALL [error handling behavior]
```

---

## Appendix B: Generated Test Format

```typescript
// tests/unit/[capability].spec.test.ts
import { describe, it, expect } from 'vitest';

describe('[Capability Name]', () => {
  describe('[Requirement Name]', () => {
    // From: Scenario: [Scenario Name]
    it.skip('should [expected outcome] when [trigger condition]', async () => {
      // GIVEN: [precondition]
      // Arrange

      // WHEN: [trigger condition]
      // Act

      // THEN: [expected outcome]
      // Assert
      expect(true).toBe(true); // TODO: Implement
    });

    // From: Scenario: [Error Scenario]
    it.skip('should [error handling] when [error condition]', async () => {
      // TODO: Implement
    });
  });
});
```

---

*This PRD is a living document. Update as requirements evolve.*
