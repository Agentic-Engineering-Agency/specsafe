import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import chalk from 'chalk';

/**
 * Generates configuration files for AI coding tools
 * Updated for v0.4.0 OpenSpec workflow
 */

// v0.4.0: All 7 OpenSpec commands
const cursorRulesContentV040 = `# SpecSafe Rules for Cursor (v0.4.0)

You are working on a SpecSafe project with OpenSpec workflow.

## 7 OpenSpec Commands (MUST use these names)

1. **specsafe:new** — Create spec with PRD + BRD
2. **specsafe:spec** — Flesh out detailed spec
3. **specsafe:test-create** — Generate tests from scenarios
4. **specsafe:test-apply** — Run tests, loop on failure
5. **specsafe:verify** — Verify implementation completeness
6. **specsafe:done** — Mark complete, archive
7. **specsafe:explore** — Pre-spec spike/research

## Always Check PROJECT_STATE.md
Before making changes, read PROJECT_STATE.md to understand:
- Current active specs and their stages
- Which spec is being worked on
- Requirements that must be satisfied

## OpenSpec Workflow
1. **explore** → Pre-spec research and spike
2. **new** → Create spec with PRD + BRD documents
3. **spec** → Flesh out detailed requirements
4. **test-create** → Generate tests from scenarios
5. **test-apply** → Run tests against implementation, loop on failure
6. **verify** → Verify implementation completeness
7. **done** → Mark complete, archive

## Critical Rules
- NEVER use 'test' or 'dev' — use 'test-create' and 'test-apply'
- PRD sections: Problem Statement, User Stories, Acceptance Criteria, Technical Requirements
- BRD sections: Business Justification, Success Metrics, Stakeholders, Timeline
- Always run tests before marking work complete
- Update spec stage using specsafe commands (not manual edits)
`;

// v0.4.0: Continue config with all 7 commands
const continueConfigContentV040 = {
  customCommands: [
    {
      name: 'specsafe-new',
      description: 'Create spec with PRD + BRD',
      prompt: 'Create a new spec with ID SPEC-{YYYYMMDD}-{NNN}. Generate PRD (Problem Statement, User Stories, Acceptance Criteria, Technical Requirements) and BRD (Business Justification, Success Metrics, Stakeholders, Timeline) sections.',
    },
    {
      name: 'specsafe-spec',
      description: 'Flesh out detailed spec',
      prompt: 'Read the spec file and expand it with detailed requirements, scenarios, and technical approach.',
    },
    {
      name: 'specsafe-test-create',
      description: 'Generate tests from scenarios',
      prompt: 'Read the spec and generate test files from the scenarios defined in the spec.',
    },
    {
      name: 'specsafe-test-apply',
      description: 'Run tests, loop on failure',
      prompt: 'Run the tests against the implementation. If tests fail, analyze failures and fix the implementation. Loop until all tests pass.',
    },
    {
      name: 'specsafe-verify',
      description: 'Verify implementation completeness',
      prompt: 'Verify that the implementation satisfies all requirements in the spec. Check for any gaps or missing functionality.',
    },
    {
      name: 'specsafe-done',
      description: 'Mark complete, archive',
      prompt: 'Mark the spec as complete and move it to the archive. Update PROJECT_STATE.md.',
    },
    {
      name: 'specsafe-explore',
      description: 'Pre-spec spike/research',
      prompt: 'Explore ideas before committing to a spec. Research approaches, estimate effort, document findings.',
    },
  ],
  contextProviders: [
    {
      name: 'specsafe-state',
      params: {
        file: 'PROJECT_STATE.md',
      },
    },
  ],
};

// v0.4.0: Aider config with new commands
const aiderConfigContentV040 = `# Aider configuration for SpecSafe v0.4.0

# Always read PROJECT_STATE.md for context
read:
  - PROJECT_STATE.md

# Instructions for the AI
assistant_prompt: |
  You are working on a SpecSafe v0.4.0 project with OpenSpec workflow.
  
  ## 7 OpenSpec Commands (use these exact names)
  - specsafe:new — Create spec with PRD + BRD
  - specsafe:spec — Flesh out detailed spec  
  - specsafe:test-create — Generate tests from scenarios
  - specsafe:test-apply — Run tests, loop on failure
  - specsafe:verify — Verify implementation completeness
  - specsafe:done — Mark complete, archive
  - specsafe:explore — Pre-spec spike/research
  
  ## PRD Sections Required
  - Problem Statement
  - User Stories
  - Acceptance Criteria
  - Technical Requirements
  
  ## BRD Sections Required
  - Business Justification
  - Success Metrics
  - Stakeholders
  - Timeline
  
  Always:
  1. Check PROJECT_STATE.md for current specs and stages
  2. Ensure implementation satisfies test requirements
  3. Update spec stage using specsafe commands when complete
  4. NEVER use 'test' or 'dev' — use 'test-create' and 'test-apply'

# Files to ignore
ignore:
  - specs/archive/
  - node_modules/
  - dist/
  - .git/
`;

// v0.4.0: Zed config with all 7 commands
const zedSettingsContentV040 = {
  assistant: {
    default_model: {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-latest',
    },
    version: '2',
  },
  context_servers: {
    specsafe: {
      command: 'cat',
      args: ['PROJECT_STATE.md'],
    },
  },
  agent: {
    default_profile: 'specsafe',
    profiles: {
      specsafe: {
        name: 'SpecSafe OpenSpec',
        prompt: `You are a SpecSafe v0.4.0 assistant. Use these 7 commands:
- specsafe:new — Create spec with PRD + BRD
- specsafe:spec — Flesh out detailed spec
- specsafe:test-create — Generate tests from scenarios
- specsafe:test-apply — Run tests, loop on failure
- specsafe:verify — Verify implementation completeness
- specsafe:done — Mark complete, archive
- specsafe:explore — Pre-spec spike/research

PRD Sections: Problem Statement, User Stories, Acceptance Criteria, Technical Requirements
BRD Sections: Business Justification, Success Metrics, Stakeholders, Timeline`,
      },
    },
  },
};

// Claude Code skills content for v0.4.0
const claudeSkillSpecsafeContentV040 = `---
name: specsafe
description: Show SpecSafe project status and workflow guidance
disable-model-invocation: true
---

You are in a SpecSafe v0.4.0 project using OpenSpec workflow.

Read PROJECT_STATE.md and provide:
1. Summary of active specs and their current stages
2. Which specs need attention
3. Recommended next actions based on the project state
4. Brief reminder of the 7 OpenSpec commands:
   - specsafe:new — Create spec with PRD + BRD
   - specsafe:spec — Flesh out detailed spec
   - specsafe:test-create — Generate tests from scenarios
   - specsafe:test-apply — Run tests, loop on failure
   - specsafe:verify — Verify implementation completeness
   - specsafe:done — Mark complete, archive
   - specsafe:explore — Pre-spec spike/research
`;

const claudeSkillExploreContentV040 = `---
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

**Output:** Create specs/exploration/{feature-name}.md with findings.

**Decision Gate:** Recommend proceeding to /specsafe:new or gathering more information.
`;

const claudeSkillNewContentV040 = `---
name: specsafe-new
description: Initialize spec with PRD + BRD
argument-hint: "[feature-name]"
disable-model-invocation: true
---

Create a new spec with PRD and BRD sections.

**PRD (Product Requirements Document):**
- Problem Statement
- User Stories
- Acceptance Criteria
- Technical Requirements

**BRD (Business Requirements Document):**
- Business Justification
- Success Metrics
- Stakeholders
- Timeline

**Steps:**
1. Generate spec ID: SPEC-YYYYMMDD-NNN
2. Create PRD and BRD sections
3. Output to specs/active/SPEC-ID.md
4. Update PROJECT_STATE.md (status: SPEC)

Always confirm with user before writing files.
`;

const claudeSkillSpecContentV040 = `---
name: specsafe-spec
description: Generate detailed spec from PRD
argument-hint: "[spec-id]"
disable-model-invocation: true
---

Read the PRD from specs/active/{spec-id}.md and generate detailed spec:

1. Expand requirements with IDs (FR-1, FR-2, etc.)
2. Add Given/When/Then scenarios
3. Define technical approach
4. Add test strategy
5. Create implementation plan
6. Document risks

Move spec to SPEC stage in PROJECT_STATE.md.
`;

const claudeSkillTestCreateContentV040 = `---
name: specsafe-test-create
description: Generate tests from scenarios
argument-hint: "[spec-id]"
disable-model-invocation: true
---

Generate test files from the scenarios in specs/active/{spec-id}.md:

1. Parse Given/When/Then scenarios
2. Generate TypeScript test code (Vitest/Jest)
3. Write to tests/{spec-id}.test.ts
4. Update PROJECT_STATE.md (status: TEST)

NEVER use old 'test' command name — this is test-create.
`;

const claudeSkillTestApplyContentV040 = `---
name: specsafe-test-apply
description: Run tests, loop on failure
argument-hint: "[spec-id]"
disable-model-invocation: true
---

Run tests against implementation and loop on failure:

1. Run tests: npx vitest run tests/{spec-id}.test.ts
2. If tests pass: ✅ Move to VERIFY stage
3. If tests fail: 🔧 Analyze failures and fix implementation
4. Repeat until all tests pass

Update PROJECT_STATE.md (status: CODE → VERIFY).

NEVER use old 'dev' command name — this is test-apply.
`;

const claudeSkillVerifyContentV040 = `---
name: specsafe-verify
description: Verify implementation completeness
disable-model-invocation: true
---

Verify that implementation satisfies all spec requirements:

1. Check all P0 requirements are implemented
2. Verify acceptance criteria are met
3. Run full test suite
4. Check code quality and documentation
5. Confirm success metrics from BRD

Update PROJECT_STATE.md (status: QA → COMPLETE).
`;

const claudeSkillDoneContentV040 = `---
name: specsafe-done
description: Mark complete and archive
disable-model-invocation: true
---

Complete the spec and archive it:

1. Move specs/active/{spec-id}.md to specs/completed/
2. Update PROJECT_STATE.md (status: DONE, archive)
3. Generate completion report
4. Suggest next spec to work on
`;

/**
 * Generate configuration for a specific tool
 * @param tool - The tool name (cursor, continue, aider, zed, claude-code, crush)
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
    case 'opencode':
      await generateCrushConfig(projectDir);
      break;
    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}

async function generateCursorConfig(projectDir: string): Promise<void> {
  const configPath = `${projectDir}/.cursorrules`;
  
  if (existsSync(configPath)) {
    console.log(chalk.yellow('⚠ .cursorrules already exists, skipping'));
    return;
  }
  
  await writeFile(configPath, cursorRulesContentV040);
  console.log(chalk.green('✓ Created .cursorrules'));
}

async function generateContinueConfig(projectDir: string): Promise<void> {
  const configDir = `${projectDir}/.continue`;
  const configPath = `${configDir}/config.json`;
  
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
  }
  
  if (existsSync(configPath)) {
    console.log(chalk.yellow('⚠ .continue/config.json already exists, skipping'));
    return;
  }
  
  await writeFile(configPath, JSON.stringify(continueConfigContentV040, null, 2));
  console.log(chalk.green('✓ Created .continue/config.json'));
}

async function generateAiderConfig(projectDir: string): Promise<void> {
  const configPath = `${projectDir}/.aider.conf.yml`;
  
  if (existsSync(configPath)) {
    console.log(chalk.yellow('⚠ .aider.conf.yml already exists, skipping'));
    return;
  }
  
  await writeFile(configPath, aiderConfigContentV040);
  console.log(chalk.green('✓ Created .aider.conf.yml'));
}

async function generateZedConfig(projectDir: string): Promise<void> {
  const configDir = `${projectDir}/.zed`;
  const configPath = `${configDir}/settings.json`;
  
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
  }
  
  if (existsSync(configPath)) {
    console.log(chalk.yellow('⚠ .zed/settings.json already exists, skipping'));
    return;
  }
  
  await writeFile(configPath, JSON.stringify(zedSettingsContentV040, null, 2));
  console.log(chalk.green('✓ Created .zed/settings.json'));
}

async function generateClaudeCodeConfig(projectDir: string): Promise<void> {
  // Create CLAUDE.md project context file
  const configPath = `${projectDir}/CLAUDE.md`;
  
  if (!existsSync(configPath)) {
    const claudeContent = `# SpecSafe Project — Claude Code Configuration (v0.4.0)

You are working on a SpecSafe v0.4.0 project using OpenSpec workflow.

## Project Context

**PROJECT_STATE.md** — Always read this file first. It contains:
- Active specs and their current stages
- Which spec is being worked on
- Overall project status

**Specs directory** — \`specs/active/*.md\` contains detailed spec files with:
- PRD: Problem Statement, User Stories, Acceptance Criteria, Technical Requirements
- BRD: Business Justification, Success Metrics, Stakeholders, Timeline
- Requirements (must be satisfied)
- Scenarios (acceptance criteria)

## 7 OpenSpec Commands

1. **specsafe:new** — Create spec with PRD + BRD
2. **specsafe:spec** — Flesh out detailed spec
3. **specsafe:test-create** — Generate tests from scenarios
4. **specsafe:test-apply** — Run tests, loop on failure
5. **specsafe:verify** — Verify implementation completeness
6. **specsafe:done** — Mark complete, archive
7. **specsafe:explore** — Pre-spec spike/research

## Critical Rules

✅ **ALWAYS** read PROJECT_STATE.md before making changes  
✅ **ALWAYS** ensure implementation satisfies tests  
✅ **ALWAYS** use specsafe commands (NOT 'test' or 'dev')  
✅ **ALWAYS** reference spec ID in commit messages  

❌ **NEVER** modify PROJECT_STATE.md directly (use CLI)  
❌ **NEVER** skip tests to implement faster  
❌ **NEVER** use old command names ('test', 'code') — use 'test-create', 'test-apply'

## Claude Code Skills (v0.4.0)

This project includes Claude Code skills for slash commands:
- \`/specsafe\` — Show project status and workflow guidance
- \`/specsafe-explore\` — Pre-spec exploration
- \`/specsafe-new\` — Create spec with PRD + BRD
- \`/specsafe-spec\` — Flesh out detailed spec
- \`/specsafe-test-create\` — Generate tests from scenarios
- \`/specsafe-test-apply\` — Run tests, loop on failure
- \`/specsafe-verify\` — Verify implementation completeness
- \`/specsafe-done\` — Mark complete, archive
`;
    
    await writeFile(configPath, claudeContent);
    console.log(chalk.green('✓ Created CLAUDE.md'));
  } else {
    console.log(chalk.yellow('⚠ CLAUDE.md already exists, skipping'));
  }

  // Create .claude/skills/ directory with SKILL.md files for slash commands
  const skillsDir = `${projectDir}/.claude/skills`;
  
  if (!existsSync(skillsDir)) {
    await mkdir(skillsDir, { recursive: true });
  }

  // Create all 8 skills for v0.4.0
  const skills = [
    { name: 'specsafe', content: claudeSkillSpecsafeContentV040 },
    { name: 'specsafe-explore', content: claudeSkillExploreContentV040 },
    { name: 'specsafe-new', content: claudeSkillNewContentV040 },
    { name: 'specsafe-spec', content: claudeSkillSpecContentV040 },
    { name: 'specsafe-test-create', content: claudeSkillTestCreateContentV040 },
    { name: 'specsafe-test-apply', content: claudeSkillTestApplyContentV040 },
    { name: 'specsafe-verify', content: claudeSkillVerifyContentV040 },
    { name: 'specsafe-done', content: claudeSkillDoneContentV040 },
  ];

  for (const skill of skills) {
    const skillDir = `${skillsDir}/${skill.name}`;
    const skillPath = `${skillDir}/SKILL.md`;
    
    if (!existsSync(skillPath)) {
      if (!existsSync(skillDir)) {
        await mkdir(skillDir, { recursive: true });
      }
      await writeFile(skillPath, skill.content);
      console.log(chalk.green(`✓ Created .claude/skills/${skill.name}/SKILL.md`));
    } else {
      console.log(chalk.yellow(`⚠ .claude/skills/${skill.name}/SKILL.md already exists, skipping`));
    }
  }
}

async function generateCrushConfig(projectDir: string): Promise<void> {
  // OpenCode/Crush uses .opencode/commands/ for custom commands
  const commandsDir = `${projectDir}/.opencode/commands`;
  
  if (!existsSync(commandsDir)) {
    await mkdir(commandsDir, { recursive: true });
  }

  // v0.4.0 commands for OpenCode
  const commands = [
    {
      name: 'specsafe-new',
      content: `Create spec with PRD + BRD

Generate a new spec with:
- PRD: Problem Statement, User Stories, Acceptance Criteria, Technical Requirements
- BRD: Business Justification, Success Metrics, Stakeholders, Timeline

Usage: @specsafe-new [feature-name]`,
    },
    {
      name: 'specsafe-spec',
      content: `Flesh out detailed spec

Expand PRD into detailed spec with requirements, scenarios, and technical approach.`,
    },
    {
      name: 'specsafe-test-create',
      content: `Generate tests from scenarios

Parse Given/When/Then scenarios and generate test files.

NEVER use 'test' — this is test-create.`,
    },
    {
      name: 'specsafe-test-apply',
      content: `Run tests, loop on failure

Run tests against implementation. If tests fail, fix implementation and repeat.

NEVER use 'dev' — this is test-apply.`,
    },
    {
      name: 'specsafe-verify',
      content: `Verify implementation completeness

Verify all requirements are met and acceptance criteria satisfied.`,
    },
    {
      name: 'specsafe-done',
      content: `Mark complete, archive

Move spec to completed and update project state.`,
    },
    {
      name: 'specsafe-explore',
      content: `Pre-spec spike/research

Explore ideas before committing to a spec. Research and estimate.`,
    },
  ];

  for (const cmd of commands) {
    const cmdPath = `${commandsDir}/${cmd.name}.md`;
    
    if (!existsSync(cmdPath)) {
      await writeFile(cmdPath, cmd.content);
      console.log(chalk.green(`✓ Created .opencode/commands/${cmd.name}.md`));
    } else {
      console.log(chalk.yellow(`⚠ .opencode/commands/${cmd.name}.md already exists, skipping`));
    }
  }
}

/**
 * Generate git hooks configuration
 * @param projectDir - The project directory path
 */
export async function generateGitHooks(projectDir: string): Promise<void> {
  const hooksDir = `${projectDir}/.githooks`;
  const preCommitPath = `${hooksDir}/pre-commit`;
  
  if (!existsSync(hooksDir)) {
    await mkdir(hooksDir, { recursive: true });
  }
  
  const preCommitContent = `#!/bin/bash
# SpecSafe pre-commit hook

echo "🔍 Running SpecSafe pre-commit checks..."

# Validate PROJECT_STATE.md exists
if [ ! -f "PROJECT_STATE.md" ]; then
  echo "❌ PROJECT_STATE.md not found. Run 'specsafe init' first."
  exit 1
fi

# Run spec validation (if we add a validate command)
# specsafe validate --silent || exit 1

echo "✅ Pre-commit checks passed"
`;
  
  if (existsSync(preCommitPath)) {
    console.log(chalk.yellow('⚠ .githooks/pre-commit already exists, skipping'));
    return;
  }
  
  await writeFile(preCommitPath, preCommitContent);
  console.log(chalk.green('✓ Created .githooks/pre-commit'));
  
  // Make the hook executable (this won't work on Windows without special handling)
  try {
    const { exec } = await import('child_process');
    exec(`chmod +x ${preCommitPath}`);
  } catch {
    // Ignore chmod errors on Windows
  }
}
