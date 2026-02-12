import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generates configuration files for AI coding tools
 */

const cursorRulesContent = `# SpecSafe Rules for Cursor v0.4.0
# OpenSpec-Style Workflow Configuration
# https://github.com/luci-efe/specsafe

## Always Check PROJECT_STATE.md
Before making changes, read PROJECT_STATE.md to understand:
- Current active specs and their stages
- Which spec is being worked on
- Requirements that must be satisfied

## Spec-Driven Development (SDD) Workflow

\`\`\`
EXPLORE → NEW → SPEC → TEST-CREATE → TEST-APPLY → VERIFY → DONE
   │       │      │          │           │          │       │
   │       │      │          │           │          │       └── Archive spec
   │       │      │          │           │          └── Run tests, loop if fail
   │       │      │          │           └── Implement code
   │       │      │          └── Generate tests
   │       │      └── Detailed requirements
   │       └── Create PRD + tech stack
   └── Research & ideation
\`\`\`

## Stage-Aware Development

| Stage | Description | Your Role |
|-------|-------------|-----------|
| EXPLORE | Research & validate ideas | Help evaluate approaches |
| NEW | PRD with requirements | Create PRD, tech stack, rules |
| SPEC | Detailed specification | Generate scenarios & acceptance criteria |
| TEST-CREATE | Test generation | Create tests from Given/When/Then |
| TEST-APPLY | Implementation | Write code to pass tests |
| VERIFY | Test validation | Run tests, fix failures, loop |
| DONE | Completion | Archive, summarize, celebrate |

## The 7 OpenSpec-Style Commands

### /specsafe:explore — Pre-Spec Exploration
**When to use:** Before committing to a spec, explore ideas and validate approaches.

**Your responsibilities:**
- Guide problem definition and user identification
- Research existing solutions and competitors
- Evaluate technology options with pros/cons
- Estimate effort (S/M/L/XL)
- Output: \`specs/exploration/FEATURE-NAME.md\` with findings

**Decision gate:** Recommend proceed to \`/specsafe:new\` or need more research.

---

### /specsafe:new — Initialize Spec with PRD
**When to use:** Starting a new feature with validated concept.

**Your responsibilities:**
1. Generate spec ID: \`SPEC-YYYYMMDD-NNN\`
2. Create PRD with:
   - Problem statement and target users
   - 3-5 key requirements
   - 2-3 user scenarios/stories
   - Constraints and assumptions
3. Recommend tech stack (language, framework, testing)
4. Define project-specific rules
5. Output: \`specs/drafts/SPEC-ID.md\` + update PROJECT_STATE.md

**Always confirm with user before writing files.**

---

### /specsafe:spec — Generate Detailed Spec
**When to use:** PRD exists, need implementation-ready specification.

**Your responsibilities:**
1. Read PRD from \`specs/drafts/SPEC-ID.md\`
2. Create comprehensive spec with:
   - **Overview:** Executive summary, goals, non-goals
   - **Requirements:** FR-001, FR-002... (functional)
   - **Technical Requirements:** TR-001, TR-002... (performance, security)
   - **Scenarios:** Given/When/Then format
   - **Acceptance Criteria:** Checklist for completion
   - **Architecture Notes:** Components, data flow, APIs
   - **Open Questions:** Document unresolved decisions
3. Move to \`specs/active/SPEC-ID.md\`
4. Update PROJECT_STATE.md: DRAFT → SPEC stage

**Validate:** Every requirement must be testable.

---

### /specsafe:test-create — Create Tests from Spec
**When to use:** Spec is ready, time to define verification.

**Your responsibilities:**
1. Read spec scenarios from \`specs/active/SPEC-ID.md\`
2. Determine test strategy:
   - Unit tests (functions/components)
   - Integration tests (APIs, services)
   - E2E tests (user workflows)
   - Performance tests (if benchmarks specified)
3. Generate test files: \`src/__tests__/SPEC-ID/*.test.ts\`
4. Map each scenario to test cases
5. Update PROJECT_STATE.md: SPEC → TEST-CREATE stage
6. Output: Test count, coverage expectations

---

### /specsafe:test-apply — Apply Tests (Development Mode)
**When to use:** Tests exist, implement to make them pass.

**Your responsibilities:**
1. Read spec requirements and test expectations
2. Guide iterative development:
   - **Plan:** Smallest slice of functionality
   - **Implement:** One requirement at a time
   - **Test:** Run tests, fix failures
   - **Commit:** Small commits with spec reference
3. Enforce rules:
   - Every change maps to a requirement
   - Never modify tests to pass (fix code instead)
   - Keep functions small and focused
   - Document public APIs with JSDoc
4. Update PROJECT_STATE.md: TEST-CREATE → TEST-APPLY stage
5. After each checkpoint: verify against acceptance criteria

**Ask:** "Which requirement should we tackle next?"

---

### /specsafe:verify — Verify & Iterate
**When to use:** Implementation complete, need validation.

**Your responsibilities:**
1. Read spec for expected behavior
2. Run test suite: \`npm test -- SPEC-ID\`
3. For each failure:
   - Identify failing assertion
   - Map to specific requirement
   - Determine: bug vs. test expectation issue
   - **Fix the code, not the test** (unless confirmed wrong)
4. Iterate: \`Run → Analyze → Fix → Run\` until all pass
5. Check coverage meets spec requirements
6. Run full suite for regressions
7. Update PROJECT_STATE.md: TEST-APPLY → VERIFY stage

**Output:** Pass rate, coverage %, remaining issues

---

### /specsafe:done — Complete & Archive
**When to use:** All tests pass, ready to finalize.

**Your responsibilities:**
1. Verify completion checklist:
   - [ ] All requirements implemented
   - [ ] All tests passing
   - [ ] Code reviewed (if required)
   - [ ] Documentation updated
   - [ ] No TODO/debug code
2. Run final test suite
3. Archive process:
   - Move: \`specs/active/SPEC-ID.md\` → \`specs/archive/SPEC-ID.md\`
   - Update PROJECT_STATE.md: move to COMPLETED
4. Generate summary: date, files, tests, LOC, notes
5. Suggest next spec from active list

**Ask for confirmation before archiving.**

---

## Critical Rules

### ✅ ALWAYS
- Read PROJECT_STATE.md before making changes
- Ensure implementation satisfies tests
- Use \`specsafe\` CLI commands to advance stages
- Reference spec ID in commit messages: \`feat(SPEC-001): add user auth\`
- Run tests before marking work complete

### ❌ NEVER
- Skip tests to implement faster
- Modify specs without updating PROJECT_STATE.md
- Commit code without corresponding spec entry
- Break the verify loop by ignoring test failures
- Modify tests to make them pass without discussion

## File Organization

\`\`\`
my-project/
├── specs/
│   ├── drafts/          # PRD stage specs
│   ├── active/          # In-progress specs
│   ├── archive/         # Completed specs
│   └── exploration/     # Research notes
├── src/
│   └── __tests__/       # Test files organized by spec
├── PROJECT_STATE.md     # Central status tracker
└── specsafe.config.json # Tool configuration
\`\`\`

## Commit Message Format

\`\`\`
type(SPEC-ID): brief description

- Detailed change 1
- Detailed change 2

Refs: SPEC-ID
\`\`\`

Types: \`feat\`, \`fix\`, \`test\`, \`docs\`, \`refactor\`, \`chore\`

---
*Version: 0.4.0*  
*OpenSpec-Style Workflow Enabled*
`;

const aiderConfigContent = `# Aider configuration for SpecSafe v0.4.0
# OpenSpec-Style Workflow Configuration
# https://aider.chat/docs/config/aider_conf.html

# Always read PROJECT_STATE.md for context
read:
  - PROJECT_STATE.md
  - README.md
  - CONVENTIONS.md

# Use .aiderignore for file exclusions (gitignore syntax)
aiderignore: .aiderignore

# Don't add .gitignore'd files to aider's scope
add-gitignore-files: false

# AI Assistant Instructions for SpecSafe Workflow
assistant_prompt: |
  You are working on a SpecSafe project using spec-driven development (SDD).

  ## The 7 OpenSpec-Style Commands

  When the user invokes a command, follow the corresponding workflow:

  ### /specsafe:explore — Pre-Spec Exploration
  - Guide problem definition and user research
  - Evaluate technology options with pros/cons
  - Estimate effort (S/M/L/XL)
  - Document in specs/exploration/FEATURE-NAME.md
  - Recommend proceed, research more, or park idea

  ### /specsafe:new — Initialize Spec with PRD
  - Generate spec ID: SPEC-YYYYMMDD-NNN format
  - Create PRD with problem statement, requirements, scenarios
  - Recommend tech stack and define rules
  - Output to specs/drafts/SPEC-ID.md
  - Update PROJECT_STATE.md (status: DRAFT)
  - Confirm details with user before writing

  ### /specsafe:spec — Generate Detailed Spec
  - Read PRD from specs/drafts/SPEC-ID.md
  - Create comprehensive spec:
    * Functional Requirements (FR-001, FR-002...)
    * Technical Requirements (TR-001, TR-002...)
    * Scenarios (Given/When/Then)
    * Acceptance Criteria
    * Architecture Notes
  - Write to specs/active/SPEC-ID.md
  - Update PROJECT_STATE.md: DRAFT → SPEC
  - Ensure every requirement is testable

  ### /specsafe:test-create — Create Tests from Spec
  - Read spec scenarios from specs/active/SPEC-ID.md
  - Generate test files: src/__tests__/SPEC-ID/*.test.ts
  - Map Given/When/Then to test cases
  - Include happy path and edge cases
  - Update PROJECT_STATE.md: SPEC → TEST-CREATE
  - Report test count and coverage expectations

  ### /specsafe:test-apply — Apply Tests (Development Mode)
  - Read spec requirements and test expectations
  - Implement one requirement at a time
  - Follow cycle: Plan → Implement → Test → Commit
  - Map every code change to requirement ID
  - Never modify tests to make them pass
  - Update PROJECT_STATE.md: TEST-CREATE → TEST-APPLY
  - Ask: "Which requirement next?"

  ### /specsafe:verify — Verify and Iterate
  - Run test suite: npm test -- SPEC-ID
  - For each failure: identify, map to requirement, fix
  - Golden rule: Fix code, not tests (unless confirmed wrong)
  - Iterate until all tests pass
  - Check coverage meets requirements
  - Run full suite for regressions
  - Update PROJECT_STATE.md: TEST-APPLY → VERIFY
  - Report: pass rate, coverage %, issues

  ### /specsafe:done — Complete and Archive
  - Verify completion checklist
  - Run final test suite
  - Move specs/active/SPEC-ID.md → specs/archive/SPEC-ID.md
  - Update PROJECT_STATE.md: move to COMPLETED
  - Generate completion summary
  - Suggest next spec from active list
  - Ask for confirmation before archiving

  ## Critical Rules

  ✅ ALWAYS:
  - Check PROJECT_STATE.md before making changes
  - Ensure implementation satisfies tests
  - Use spec ID in commit messages: feat(SPEC-001): description
  - Run tests before marking work complete
  - Fix the code, not the test

  ❌ NEVER:
  - Skip tests to implement faster
  - Modify PROJECT_STATE.md directly (use workflow commands)
  - Break the verify loop by ignoring failures
  - Modify tests without discussion
  - Commit code without spec reference

  ## Workflow Diagram

  EXPLORE → NEW → SPEC → TEST-CREATE → TEST-APPLY → VERIFY → DONE

# Commit message conventions
commit-prompt: |
  Format: type(SPEC-ID): brief description
  
  Types: feat, fix, test, docs, refactor, chore
  Example: feat(SPEC-001): add user authentication
  
  Always reference the spec ID in commits.
`;

const aiderIgnoreContent = `# Aider ignore patterns for SpecSafe projects

# Spec archives (read-only reference)
specs/archive/

# Dependencies
node_modules/
vendor/

# Build outputs
dist/
build/
*.min.js
*.min.css

# Generated files
*.generated.ts
*.generated.js

# Logs
*.log
logs/

# Coverage reports
coverage/
.nyc_output/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Test outputs
test-results/
playwright-report/
`;

const zedSettingsContent = {
  name: "specsafe-zed",
  version: "0.4.0",
  description: "SpecSafe v0.4.0 OpenSpec-Style Workflow for Zed Editor",
  
  assistant: {
    default_model: {
      provider: "anthropic",
      model: "claude-3-5-sonnet-latest"
    },
    version: "2"
  },
  
  context_servers: {
    specsafe: {
      command: "cat",
      args: ["PROJECT_STATE.md"]
    }
  },
  
  lsp: {
    specsafe: {
      command: "specsafe",
      args: ["status", "--json"]
    }
  },
  
  agent: {
    name: "SpecSafe",
    description: "Spec-driven development assistant for OpenSpec-style workflow",
    
    context: {
      files: [
        "PROJECT_STATE.md",
        "specsafe.config.json"
      ],
      directories: [
        "specs/active",
        "specs/drafts"
      ]
    },
    
    commands: {
      "specsafe:explore": {
        description: "Pre-spec exploration and research",
        prompt: "Conduct preliminary exploration before committing to a full spec. Guide problem definition, research technology options, estimate effort, and document findings in specs/exploration/FEATURE-NAME.md. Recommend proceed to spec creation or need more research.",
        context: ["PROJECT_STATE.md"]
      },
      
      "specsafe:new": {
        description: "Initialize spec with PRD",
        prompt: "Create a new spec with Product Requirements Document. Generate spec ID (SPEC-YYYYMMDD-NNN), create PRD with problem statement, requirements, scenarios, recommend tech stack, and define rules. Output to specs/drafts/SPEC-ID.md and update PROJECT_STATE.md (status: DRAFT). Confirm with user before writing.",
        context: ["PROJECT_STATE.md"]
      },
      
      "specsafe:spec": {
        description: "Generate detailed spec from PRD",
        prompt: "Read PRD from specs/drafts/SPEC-ID.md and create comprehensive implementation-ready specification. Include functional requirements (FR-XXX), technical requirements (TR-XXX), Given/When/Then scenarios, acceptance criteria, and architecture notes. Write to specs/active/SPEC-ID.md and update PROJECT_STATE.md (DRAFT → SPEC).",
        context: ["PROJECT_STATE.md", "specs/drafts/*.md"]
      },
      
      "specsafe:test-create": {
        description: "Create tests from spec scenarios",
        prompt: "Read spec from specs/active/SPEC-ID.md and generate comprehensive test suite. Create test files in src/__tests__/SPEC-ID/ mapping Given/When/Then to test cases. Include happy path and edge cases. Update PROJECT_STATE.md (SPEC → TEST-CREATE) and report test count.",
        context: ["PROJECT_STATE.md", "specs/active/*.md"]
      },
      
      "specsafe:test-apply": {
        description: "Apply tests (development mode for active spec)",
        prompt: "Guide implementation for active spec. Read requirements and tests, implement one requirement at a time following Plan → Implement → Test → Commit cycle. Map changes to requirement IDs. Never modify tests to make them pass. Update PROJECT_STATE.md (TEST-CREATE → TEST-APPLY). Ask which requirement to tackle next.",
        context: ["PROJECT_STATE.md", "specs/active/*.md", "src/__tests__/**/*.test.ts"]
      },
      
      "specsafe:verify": {
        description: "Run tests and iterate until pass",
        prompt: "Verify implementation by running test suite. Execute npm test -- SPEC-ID, analyze failures, map to requirements, and fix code (not tests). Iterate until all pass. Check coverage, run full suite for regressions. Update PROJECT_STATE.md (TEST-APPLY → VERIFY). Report pass rate, coverage %, and any issues.",
        context: ["PROJECT_STATE.md", "specs/active/*.md", "src/__tests__/**/*.test.ts"]
      },
      
      "specsafe:done": {
        description: "Complete and archive spec",
        prompt: "Finalize spec after all tests pass. Verify completion checklist, run final test suite, move specs/active/SPEC-ID.md to specs/archive/SPEC-ID.md. Update PROJECT_STATE.md (VERIFY → COMPLETE). Generate completion summary and suggest next spec. Ask for confirmation before archiving.",
        context: ["PROJECT_STATE.md", "specs/active/*.md"]
      },
      
      specsafe: {
        description: "Show project status",
        prompt: "Read PROJECT_STATE.md and show current active specs, their stages, what needs attention, and recommended next actions. Provide brief SDD workflow reminder (EXPLORE → NEW → SPEC → TEST-CREATE → TEST-APPLY → VERIFY → DONE).",
        context: ["PROJECT_STATE.md"]
      }
    },
    
    rules: {
      always: [
        "Read PROJECT_STATE.md before making changes",
        "Ensure implementation satisfies tests",
        "Use spec ID in commit messages: type(SPEC-XXX): description",
        "Run tests before marking work complete"
      ],
      never: [
        "Skip tests to implement faster",
        "Modify PROJECT_STATE.md directly (use commands)",
        "Break verify loop by ignoring failures",
        "Modify tests without discussion",
        "Commit code without spec reference"
      ]
    },
    
    workflow: {
      stages: ["EXPLORE", "NEW", "SPEC", "TEST-CREATE", "TEST-APPLY", "VERIFY", "COMPLETE"],
      transitions: {
        EXPLORE: ["NEW"],
        NEW: ["SPEC"],
        SPEC: ["TEST-CREATE"],
        "TEST-CREATE": ["TEST-APPLY"],
        "TEST-APPLY": ["VERIFY"],
        VERIFY: ["COMPLETE", "TEST-APPLY"],
        COMPLETE: []
      }
    }
  },
  
  file_types: {
    "SpecSafe Spec": {
      path_suffixes: [".specsafe.md"],
      grammar: "markdown"
    }
  }
};

const preCommitHookContent = `#!/bin/bash
# SpecSafe pre-commit hook v0.4.0
# Enhanced verification for OpenSpec-style workflow

set -e

echo "🔍 Running SpecSafe pre-commit checks..."

# Color codes for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# Track if any checks fail
FAILED=0

# Check 1: Validate PROJECT_STATE.md exists
echo "📋 Checking PROJECT_STATE.md..."
if [ ! -f "PROJECT_STATE.md" ]; then
    echo -e "\${RED}❌ PROJECT_STATE.md not found\${NC}"
    echo "   Run 'specsafe init' to initialize your project"
    FAILED=1
else
    echo -e "\${GREEN}✓ PROJECT_STATE.md exists\${NC}"
fi

# Check 2: Validate specsafe config exists
echo "⚙️  Checking SpecSafe configuration..."
if [ ! -f "specsafe.config.json" ] && [ ! -f "specsafe.config.yaml" ] && [ ! -f "specsafe.config.yml" ]; then
    echo -e "\${YELLOW}⚠️  No specsafe.config.{json,yaml,yml} found\${NC}"
    echo "   Using default configuration"
else
    echo -e "\${GREEN}✓ SpecSafe configuration found\${NC}"
fi

# Check 3: Verify specs directory structure
echo "📁 Checking specs directory structure..."
if [ -d "specs" ]; then
    for subdir in drafts active archive exploration; do
        if [ ! -d "specs/\$subdir" ]; then
            echo -e "\${YELLOW}⚠️  Missing specs/\$subdir directory\${NC}"
            mkdir -p "specs/\$subdir"
            echo "   Created specs/\$subdir"
        fi
    done
    echo -e "\${GREEN}✓ Specs directory structure valid\${NC}"
else
    echo -e "\${YELLOW}⚠️  No specs directory found\${NC}"
    echo "   Run 'specsafe init' to create directory structure"
fi

# Check 4: Validate active specs have implementation
if [ -d "specs/active" ]; then
    echo "🔎 Checking active specs for implementation..."
    ACTIVE_SPECS=\$(find specs/active -name "*.md" -type f 2>/dev/null || true)
    
    if [ -n "\$ACTIVE_SPECS" ]; then
        for spec in \$ACTIVE_SPECS; do
            SPEC_ID=\$(basename "\$spec" .md)
            # Check if there's corresponding test or implementation
            if [ -d "src/__tests__/\$SPEC_ID" ] || [ -d "tests/\$SPEC_ID" ]; then
                echo -e "\${GREEN}✓ \$SPEC_ID has tests\${NC}"
            else
                echo -e "\${YELLOW}⚠️  \$SPEC_ID has no tests yet (expected in TEST-CREATE stage)\${NC}"
            fi
        done
    else
        echo "   No active specs found"
    fi
fi

# Check 5: Check for TODO/FIXME in staged files
echo "📝 Checking for TODO/FIXME markers..."
STAGED_FILES=\$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)

if [ -n "\$STAGED_FILES" ]; then
    TODO_FOUND=0
    for file in \$STAGED_FILES; do
        # Only check source files
        if [[ "\$file" =~ \\.(ts|tsx|js|jsx|py|java|go|rs|cpp|c|h|php|rb)\$ ]]; then
            if git diff --cached "\$file" | grep -i "TODO\\|FIXME\\|XXX\\|HACK" > /dev/null 2>&1; then
                echo -e "\${YELLOW}⚠️  \$file contains TODO/FIXME markers\${NC}"
                TODO_FOUND=1
            fi
        fi
    done
    
    if [ \$TODO_FOUND -eq 1 ]; then
        echo -e "\${YELLOW}   Consider resolving these before committing\${NC}"
    fi
fi

# Check 6: Run tests for modified specs (if specsafe CLI is available)
if command -v specsafe &> /dev/null; then
    echo "🧪 Running SpecSafe validation..."
    if specsafe doctor --silent 2>/dev/null; then
        echo -e "\${GREEN}✓ SpecSafe doctor passed\${NC}"
    else
        echo -e "\${YELLOW}⚠️  SpecSafe doctor found issues\${NC}"
        echo "   Run 'specsafe doctor' for details"
    fi
fi

# Final status
echo ""
if [ \$FAILED -eq 0 ]; then
    echo -e "\${GREEN}✅ All pre-commit checks passed\${NC}"
    exit 0
else
    echo -e "\${RED}❌ Some pre-commit checks failed\${NC}"
    exit 1
fi
`;

// Skill content for Claude Code slash commands
const claudeSkillSpecsafeContent = `---
name: specsafe
description: Show SpecSafe project status and workflow guidance
disable-model-invocation: true
---

You are in a SpecSafe project using spec-driven development.

Read PROJECT_STATE.md and provide:
1. Summary of active specs and their current stages
2. Which specs need attention
3. Recommended next actions based on the project state
4. Brief reminder of the SDD workflow (EXPLORE → NEW → SPEC → TEST-CREATE → TEST-APPLY → VERIFY → DONE)
`;

const claudeSkillExploreContent = `---
name: specsafe-explore
description: Pre-spec exploration and research mode
argument-hint: "[feature-name]"
disable-model-invocation: true
---

You are in exploration mode. Guide the user through pre-spec research.

**Activities:**
- Define the problem and identify target users
- Research existing solutions and competitors
- Evaluate technology options with pros/cons
- Estimate effort (S/M/L/XL)
- Document risks and constraints

**Output:** Create \`specs/exploration/{feature-name}.md\` with findings.

**Decision Gate:** Recommend proceeding to \`/specsafe:new\` or gathering more information.
`;

const claudeSkillNewContent = `---
name: specsafe-new
description: Initialize spec with PRD
argument-hint: "[feature-name]"
disable-model-invocation: true
---

Create a new spec with Product Requirements Document.

**Steps:**
1. Generate spec ID: SPEC-YYYYMMDD-NNN
2. Create PRD with problem statement, requirements, scenarios
3. Recommend tech stack and define rules
4. Output to \`specs/drafts/SPEC-ID.md\`
5. Update PROJECT_STATE.md (status: DRAFT)

Always confirm with user before writing files.
`;

const claudeSkillSpecContent = `---
name: specsafe-spec
description: Generate detailed spec from PRD
argument-hint: "[spec-id]"
disable-model-invocation: true
---

Read PRD from \`specs/drafts/\$ARGUMENTS.md\` and create comprehensive specification.

**Include:**
- Functional Requirements (FR-001, FR-002...)
- Technical Requirements (TR-001, TR-002...)
- Scenarios (Given/When/Then)
- Acceptance Criteria
- Architecture Notes

Move to \`specs/active/SPEC-ID.md\` and update PROJECT_STATE.md (DRAFT → SPEC).

If no argument provided, list available drafts.
`;

const claudeSkillTestCreateContent = `---
name: specsafe-test-create
description: Create tests from spec scenarios
argument-hint: "[spec-id]"
disable-model-invocation: true
---

Generate comprehensive test suite from the active spec.

**Process:**
1. Read spec from \`specs/active/\$ARGUMENTS.md\`
2. Generate test files in \`src/__tests__/\$ARGUMENTS/\`
3. Map Given/When/Then to test cases
4. Include happy path and edge cases
5. Update PROJECT_STATE.md (SPEC → TEST-CREATE)

Report test count and coverage expectations.
`;

const claudeSkillTestApplyContent = `---
name: specsafe-test-apply
description: Apply tests - development mode to pass tests
argument-hint: "[spec-id]"
disable-model-invocation: true
---

Guide implementation for active spec.

**Development Cycle:**
1. Plan - Identify smallest slice of functionality
2. Implement - Write code for one requirement at a time
3. Test - Run tests, fix failures
4. Commit - Small commits with spec reference

**Rules:**
- Never modify tests to make them pass (fix the code)
- Map every change to a requirement ID
- Update PROJECT_STATE.md (TEST-CREATE → TEST-APPLY)

Ask: "Which requirement should we tackle next?"
`;

const claudeSkillVerifyContent = `---
name: specsafe-verify
description: Verify implementation by running tests
argument-hint: "[spec-id]"
disable-model-invocation: true
---

Run tests and iterate until implementation is correct.

**Process:**
1. Execute test suite: \`npm test -- \$ARGUMENTS\`
2. Analyze failures and map to requirements
3. Fix code (not tests) and re-run
4. Iterate until all pass
5. Check coverage and run full suite for regressions

Update PROJECT_STATE.md (TEST-APPLY → VERIFY).
Report pass rate, coverage %, and any issues.
`;

const claudeSkillDoneContent = `---
name: specsafe-done
description: Complete and archive spec
argument-hint: "[spec-id]"
disable-model-invocation: true
---

Finalize spec after all tests pass.

**Completion Checklist:**
- [ ] All requirements implemented
- [ ] All tests passing
- [ ] Code reviewed (if required)
- [ ] Documentation updated
- [ ] No TODO/debug code

**Archive:**
- Move \`specs/active/\$ARGUMENTS.md\` → \`specs/archive/\$ARGUMENTS.md\`
- Update PROJECT_STATE.md (VERIFY → COMPLETE)
- Generate completion summary

Ask for confirmation before archiving.
`;

const claudeSkillValidateContent = `---
name: specsafe-validate
description: Validate current implementation against active spec
disable-model-invocation: true
---

Check if the current code changes satisfy the requirements in the active spec.
Point out any gaps or issues that need to be addressed before completing.
`;

/**
 * Generate configuration for a specific tool
 * @param tool - The tool name (cursor, continue, aider, zed, claude-code, crush, git-hooks)
 * @param projectDir - The project directory path
 */
export async function generateToolConfig(tool: string, projectDir: string = '.'): Promise<void> {
  switch (tool) {
    case 'cursor':
      await generateCursorConfig(projectDir);
      break;
    case 'continue':
      await generateContinueConfig(projectDir);
      break;
    case 'aider':
      await generateAiderConfig(projectDir);
      break;
    case 'zed':
      await generateZedConfig(projectDir);
      break;
    case 'claude-code':
      await generateClaudeCodeConfig(projectDir);
      break;
    case 'crush':
      await generateCrushConfig(projectDir);
      break;
    case 'git-hooks':
      await generateGitHooks(projectDir);
      break;
    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}

async function generateCursorConfig(projectDir: string): Promise<void> {
  const configPath = \`${projectDir}/.cursorrules\`;
  
  if (existsSync(configPath)) {
    console.log(chalk.yellow('⚠ .cursorrules already exists, skipping'));
    return;
  }
  
  await writeFile(configPath, cursorRulesContent);
  console.log(chalk.green('✓ Created .cursorrules'));
}

async function generateContinueConfig(projectDir: string): Promise<void> {
  const configDir = \`${projectDir}/.continue\`;
  const promptsDir = \`${configDir}/prompts\`;
  
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
  }
  if (!existsSync(promptsDir)) {
    await mkdir(promptsDir, { recursive: true });
  }
  
  // Create config.yaml
  const configPath = \`${configDir}/config.yaml\`;
  if (!existsSync(configPath)) {
    const continueConfigContent = `# Continue.dev configuration for SpecSafe v0.4.0
# Generated by SpecSafe

name: SpecSafe
version: 0.4.0
schema: v1

prompts:
  - uses: file://prompts/specsafe.md
  - uses: file://prompts/spec.md
  - uses: file://prompts/validate.md
  - uses: file://prompts/specsafe-explore.md
  - uses: file://prompts/specsafe-new.md
  - uses: file://prompts/specsafe-spec.md
  - uses: file://prompts/specsafe-test-create.md
  - uses: file://prompts/specsafe-test-apply.md
  - uses: file://prompts/specsafe-verify.md
  - uses: file://prompts/specsafe-done.md

context:
  include:
    - PROJECT_STATE.md
    - specs/active/*.md
    - specs/drafts/*.md
`;
    await writeFile(configPath, continueConfigContent);
    console.log(chalk.green('✓ Created .continue/config.yaml'));
  } else {
    console.log(chalk.yellow('⚠ .continue/config.yaml already exists, skipping'));
  }
  
  // Copy prompt files from rules/continue/prompts/
  const promptFiles = [
    'specsafe.md',
    'spec.md',
    'validate.md',
    'specsafe-explore.md',
    'specsafe-new.md',
    'specsafe-spec.md',
    'specsafe-test-create.md',
    'specsafe-test-apply.md',
    'specsafe-verify.md',
    'specsafe-done.md'
  ];
  
  for (const filename of promptFiles) {
    const targetPath = \`${promptsDir}/\${filename}\`;
    if (!existsSync(targetPath)) {
      try {
        const sourcePath = join(__dirname, '../../../../rules/continue/prompts', filename);
        const content = await readFile(sourcePath, 'utf-8');
        await writeFile(targetPath, content);
        console.log(chalk.green(\`✓ Created .continue/prompts/\${filename}\`));
      } catch (error) {
        // If source file doesn't exist, create a basic version
        const basicContent = `---
name: \${filename.replace('.md', '')}
description: SpecSafe command
invokable: true
---

See SpecSafe documentation for usage.
`;
        await writeFile(targetPath, basicContent);
        console.log(chalk.yellow(\`⚠ Created basic .continue/prompts/\${filename}\`));
      }
    } else {
      console.log(chalk.yellow(\`⚠ .continue/prompts/\${filename} already exists, skipping\`));
    }
  }
}

async function generateAiderConfig(projectDir: string): Promise<void> {
  const configPath = \`${projectDir}/.aider.conf.yml\`;
  const ignorePath = \`${projectDir}/.aiderignore\`;
  
  if (existsSync(configPath)) {
    console.log(chalk.yellow('⚠ .aider.conf.yml already exists, skipping'));
  } else {
    await writeFile(configPath, aiderConfigContent);
    console.log(chalk.green('✓ Created .aider.conf.yml'));
  }
  
  if (existsSync(ignorePath)) {
    console.log(chalk.yellow('⚠ .aiderignore already exists, skipping'));
  } else {
    await writeFile(ignorePath, aiderIgnoreContent);
    console.log(chalk.green('✓ Created .aiderignore'));
  }
}

async function generateZedConfig(projectDir: string): Promise<void> {
  const configDir = \`${projectDir}/.zed\`;
  const configPath = \`${configDir}/settings.json\`;
  
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
  }
  
  if (existsSync(configPath)) {
    console.log(chalk.yellow('⚠ .zed/settings.json already exists, skipping'));
    return;
  }
  
  await writeFile(configPath, JSON.stringify(zedSettingsContent, null, 2));
  console.log(chalk.green('✓ Created .zed/settings.json'));
}

async function generateClaudeCodeConfig(projectDir: string): Promise<void> {
  // Create CLAUDE.md project context file
  const configPath = \`${projectDir}/CLAUDE.md\`;
  
  if (!existsSync(configPath)) {
    const claudeContent = `# SpecSafe Project — Claude Code Configuration

You are working on a SpecSafe project using spec-driven development (SDD).

## Project Context

**PROJECT_STATE.md** — Always read this file first. It contains:
- Active specs and their current stages
- Which spec is being worked on
- Overall project status

**Specs directory** — \\`specs/active/*.md\\` contains detailed spec files with:
- Requirements (must be satisfied)
- Scenarios (acceptance criteria)
- Current stage (EXPLORE → NEW → SPEC → TEST-CREATE → TEST-APPLY → VERIFY → DONE)

## Spec-Driven Development Workflow

1. **EXPLORE**: Research & validate ideas
2. **NEW**: PRD with requirements
3. **SPEC**: Detailed specification
4. **TEST-CREATE**: Generate tests from spec
5. **TEST-APPLY**: Implement to pass tests
6. **VERIFY**: Validate all tests pass
7. **DONE**: Complete & archive

## Critical Rules

✅ **ALWAYS** read PROJECT_STATE.md before making changes  
✅ **ALWAYS** ensure implementation satisfies tests  
✅ **ALWAYS** use \\`specsafe\\` CLI commands to advance stages  
✅ **ALWAYS** reference spec ID in commit messages  

❌ **NEVER** modify PROJECT_STATE.md directly (use CLI)  
❌ **NEVER** skip tests to implement faster  
❌ **NEVER** modify tests to make them pass without discussion

## SpecSafe CLI Reference

- \\`specsafe status\\` — Show current project status
- \\`specsafe explore <name>\\` — Start exploration
- \\`specsafe new <name>\\` — Create PRD
- \\`specsafe spec <id>\\` — Generate detailed spec
- \\`specsafe test-create <id>\\` — Create tests
- \\`specsafe test-apply <id>\\` — Start implementation
- \\`specsafe verify <id>\\` — Run validation
- \\`specsafe done <id>\\` — Complete spec

## Claude Code Skills

This project includes Claude Code skills for slash commands:
- \\`/specsafe\\` — Show project status
- \\`/specsafe-explore\\` — Pre-spec exploration
- \\`/specsafe-new\\` — Initialize spec with PRD
- \\`/specsafe-spec\\` — Generate detailed spec
- \\`/specsafe-test-create\\` — Create tests
- \\`/specsafe-test-apply\\` — Development mode
- \\`/specsafe-verify\\` — Run verification
- \\`/specsafe-done\\` — Complete & archive
`;
    
    await writeFile(configPath, claudeContent);
    console.log(chalk.green('✓ Created CLAUDE.md'));
  } else {
    console.log(chalk.yellow('⚠ CLAUDE.md already exists, skipping'));
  }

  // Create .claude/skills/ directory with SKILL.md files for slash commands
  const skillsDir = \`${projectDir}/.claude/skills\`;
  
  if (!existsSync(skillsDir)) {
    await mkdir(skillsDir, { recursive: true });
  }

  const skills = [
    { name: 'specsafe', content: claudeSkillSpecsafeContent },
    { name: 'specsafe-explore', content: claudeSkillExploreContent },
    { name: 'specsafe-new', content: claudeSkillNewContent },
    { name: 'specsafe-spec', content: claudeSkillSpecContent },
    { name: 'specsafe-test-create', content: claudeSkillTestCreateContent },
    { name: 'specsafe-test-apply', content: claudeSkillTestApplyContent },
    { name: 'specsafe-verify', content: claudeSkillVerifyContent },
    { name: 'specsafe-done', content: claudeSkillDoneContent },
    { name: 'specsafe-validate', content: claudeSkillValidateContent },
  ];

  for (const skill of skills) {
    const skillDir = \`\${skillsDir}/\${skill.name}\`;
    const skillPath = \`\${skillDir}/SKILL.md\`;
    
    if (!existsSync(skillPath)) {
      if (!existsSync(skillDir)) {
        await mkdir(skillDir, { recursive: true });
      }
      await writeFile(skillPath, skill.content);
      console.log(chalk.green(\`✓ Created .claude/skills/\${skill.name}/SKILL.md\`));
    } else {
      console.log(chalk.yellow(\`⚠ .claude/skills/\${skill.name}/SKILL.md already exists, skipping\`));
    }
  }
}

async function generateCrushConfig(projectDir: string): Promise<void> {
  // OpenCode/Crush uses .opencode/commands/ for custom commands
  const commandsDir = \`${projectDir}/.opencode/commands\`;
  
  if (!existsSync(commandsDir)) {
    await mkdir(commandsDir, { recursive: true });
  }

  // Copy all command files from rules/crush/ to .opencode/commands/
  const commandFiles = [
    'specsafe.md',
    'spec.md',
    'specsafe-explore.md',
    'specsafe-new.md',
    'specsafe-spec.md',
    'specsafe-test-create.md',
    'specsafe-test-apply.md',
    'specsafe-verify.md',
    'specsafe-done.md',
    'validate.md'
  ];

  for (const filename of commandFiles) {
    const targetPath = \`\${commandsDir}/\${filename}\`;
    
    if (!existsSync(targetPath)) {
      try {
        const sourcePath = join(__dirname, '../../../../rules/crush', filename);
        const content = await readFile(sourcePath, 'utf-8');
        await writeFile(targetPath, content);
        console.log(chalk.green(\`✓ Created .opencode/commands/\${filename}\`));
      } catch (error) {
        // If source file doesn't exist, skip
        console.log(chalk.yellow(\`⚠ Source file \${filename} not found, skipping\`));
      }
    } else {
      console.log(chalk.yellow(\`⚠ .opencode/commands/\${filename} already exists, skipping\`));
    }
  }
}

/**
 * Generate git hooks configuration
 * @param projectDir - The project directory path
 */
export async function generateGitHooks(projectDir: string): Promise<void> {
  const hooksDir = \`\${projectDir}/.githooks\`;
  const preCommitPath = \`\${hooksDir}/pre-commit\`;
  
  if (!existsSync(hooksDir)) {
    await mkdir(hooksDir, { recursive: true });
  }
  
  if (existsSync(preCommitPath)) {
    console.log(chalk.yellow('⚠ .githooks/pre-commit already exists, skipping'));
    return;
  }
  
  await writeFile(preCommitPath, preCommitHookContent);
  
  // Make the hook executable (this won't work on Windows without special handling)
  try {
    const { exec } = await import('child_process');
    exec(\`chmod +x \${preCommitPath}\`);
    console.log(chalk.green('✓ Created .githooks/pre-commit'));
  } catch {
    console.log(chalk.yellow('⚠ Could not make pre-commit executable (Windows may require manual step)'));
  }
}
