import { writeFile, mkdir, chmod } from 'fs/promises';
import { existsSync } from 'fs';
import chalk from 'chalk';

/**
 * Generates configuration files for AI coding tools — v0.4.0
 * Supports all 7 OpenSpec-style commands:
 *   explore, new, spec, test-create, test-apply, verify, done
 */

// ---------------------------------------------------------------------------
// Cursor
// ---------------------------------------------------------------------------
const cursorRulesContent = [
  '# SpecSafe Rules for Cursor v0.4.0',
  '# OpenSpec-Style Workflow Configuration',
  '',
  '## Always Check PROJECT_STATE.md',
  'Before making changes, read PROJECT_STATE.md to understand:',
  '- Current active specs and their stages',
  '- Which spec is being worked on',
  '- Requirements that must be satisfied',
  '',
  '## Spec-Driven Development (SDD) Workflow',
  '',
  'EXPLORE → NEW → SPEC → TEST-CREATE → TEST-APPLY → VERIFY → DONE',
  '',
  '## The 7 OpenSpec-Style Commands',
  '',
  '### /specsafe:explore — Pre-Spec Exploration',
  'Research ideas, evaluate approaches, estimate effort.',
  'Output: specs/exploration/FEATURE-NAME.md',
  '',
  '### /specsafe:new — Initialize Spec with PRD',
  'Generate SPEC-YYYYMMDD-NNN, create PRD, recommend tech stack.',
  'Output: specs/drafts/SPEC-ID.md',
  '',
  '### /specsafe:spec — Generate Detailed Spec',
  'Read PRD, create FR-XXX/TR-XXX requirements, Given/When/Then scenarios.',
  'Move to specs/active/SPEC-ID.md',
  '',
  '### /specsafe:test-create — Create Tests from Spec',
  'Generate test files in src/__tests__/SPEC-ID/.',
  'Map scenarios to test cases with edge cases.',
  '',
  '### /specsafe:test-apply — Apply Tests (Development Mode)',
  'Implement code to pass tests. Plan → Implement → Test → Commit.',
  'Never modify tests to pass — fix the code.',
  '',
  '### /specsafe:verify — Verify & Iterate',
  'Run test suite, analyze failures, fix code, iterate.',
  'Check coverage and run full regression suite.',
  '',
  '### /specsafe:done — Complete & Archive',
  'Verify checklist, run final tests, archive spec.',
  'Generate completion summary.',
  '',
  '## Critical Rules',
  '',
  '### ALWAYS',
  '- Read PROJECT_STATE.md before making changes',
  '- Ensure implementation satisfies tests',
  '- Reference spec ID in commit messages: feat(SPEC-001): description',
  '- Run tests before marking work complete',
  '',
  '### NEVER',
  '- Skip tests to implement faster',
  '- Modify specs without updating PROJECT_STATE.md',
  '- Break the verify loop by ignoring test failures',
  '- Modify tests to make them pass without discussion',
  '',
  '---',
  '*Version: 0.4.0 — OpenSpec-Style Workflow*',
].join('\n');

// ---------------------------------------------------------------------------
// Continue.dev
// ---------------------------------------------------------------------------
const continueConfigContent = {
  customCommands: [
    {
      name: 'specsafe',
      description: 'Show current SpecSafe status',
      prompt: 'Read PROJECT_STATE.md and show active specs, stages, and next steps.',
    },
    {
      name: 'specsafe-explore',
      description: 'Pre-spec exploration and research',
      prompt: 'Guide pre-spec research: define problem, evaluate tech options, estimate effort. Output: specs/exploration/FEATURE-NAME.md',
    },
    {
      name: 'specsafe-new',
      description: 'Initialize spec with PRD',
      prompt: 'Create SPEC-YYYYMMDD-NNN with PRD: problem statement, requirements, scenarios, tech stack. Output: specs/drafts/SPEC-ID.md',
    },
    {
      name: 'specsafe-spec',
      description: 'Generate detailed spec from PRD',
      prompt: 'Read PRD, create spec with FR-XXX, TR-XXX, Given/When/Then scenarios, acceptance criteria. Move to specs/active/.',
    },
    {
      name: 'specsafe-test-create',
      description: 'Create tests from spec scenarios',
      prompt: 'Generate test suite from spec scenarios. Create src/__tests__/SPEC-ID/*.test.ts mapping Given/When/Then to test cases.',
    },
    {
      name: 'specsafe-test-apply',
      description: 'Apply tests — development mode',
      prompt: 'Guide implementation: Plan → Implement → Test → Commit. Map changes to requirement IDs. Never modify tests to pass.',
    },
    {
      name: 'specsafe-verify',
      description: 'Run tests and iterate until pass',
      prompt: 'Run test suite, analyze failures, fix code (not tests), iterate. Report pass rate, coverage %, issues.',
    },
    {
      name: 'specsafe-done',
      description: 'Complete and archive spec',
      prompt: 'Verify checklist, run final tests, archive spec from active to archive. Generate completion summary.',
    },
    {
      name: 'spec',
      description: 'Show details for a specific spec',
      prompt: 'Read the spec file for {{input}} from specs/active/ and show requirements, scenarios, and current stage.',
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

// ---------------------------------------------------------------------------
// Aider
// ---------------------------------------------------------------------------
const aiderConfigContent = [
  '# Aider configuration for SpecSafe v0.4.0',
  '# OpenSpec-Style Workflow Configuration',
  '',
  '# Always read PROJECT_STATE.md for context',
  'read:',
  '  - PROJECT_STATE.md',
  '  - README.md',
  '  - CONVENTIONS.md',
  '',
  'aiderignore: .aiderignore',
  'add-gitignore-files: false',
  '',
  '# AI Assistant Instructions for SpecSafe Workflow',
  'assistant_prompt: |',
  '  You are working on a SpecSafe project using spec-driven development (SDD).',
  '  ',
  '  ## The 7 OpenSpec-Style Commands',
  '  ',
  '  /specsafe:explore — Pre-spec research and ideation',
  '  /specsafe:new — Initialize spec with PRD',
  '  /specsafe:spec — Generate detailed spec from PRD',
  '  /specsafe:test-create — Create tests from spec scenarios',
  '  /specsafe:test-apply — Implement code to pass tests',
  '  /specsafe:verify — Run tests and iterate until pass',
  '  /specsafe:done — Complete and archive spec',
  '  ',
  '  ## Critical Rules',
  '  - Always check PROJECT_STATE.md before changes',
  '  - Fix code, not tests (unless test is confirmed wrong)',
  '  - Reference spec ID in commit messages',
  '  - Workflow: EXPLORE → NEW → SPEC → TEST-CREATE → TEST-APPLY → VERIFY → DONE',
  '',
  '# Commit message conventions',
  'commit-prompt: |',
  '  Format: type(SPEC-ID): brief description',
  '  Types: feat, fix, test, docs, refactor, chore',
  '  Always reference the spec ID in commits.',
].join('\n');

// ---------------------------------------------------------------------------
// Zed
// ---------------------------------------------------------------------------
const zedSettingsContent = {
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
    name: 'SpecSafe',
    description: 'Spec-driven development assistant for OpenSpec-style workflow',
    context: {
      files: ['PROJECT_STATE.md', 'specsafe.config.json'],
      directories: ['specs/active', 'specs/drafts'],
    },
    commands: {
      'specsafe:explore': {
        description: 'Pre-spec exploration and research',
        prompt: 'Conduct preliminary exploration. Guide problem definition, research technology options, estimate effort, document findings in specs/exploration/.',
        context: ['PROJECT_STATE.md'],
      },
      'specsafe:new': {
        description: 'Initialize spec with PRD',
        prompt: 'Create a new spec with PRD. Generate SPEC-YYYYMMDD-NNN, create PRD, recommend tech stack. Output to specs/drafts/.',
        context: ['PROJECT_STATE.md'],
      },
      'specsafe:spec': {
        description: 'Generate detailed spec from PRD',
        prompt: 'Read PRD and create comprehensive spec with FR-XXX, TR-XXX, Given/When/Then scenarios. Move to specs/active/.',
        context: ['PROJECT_STATE.md', 'specs/drafts/*.md'],
      },
      'specsafe:test-create': {
        description: 'Create tests from spec scenarios',
        prompt: 'Generate test suite from spec. Create test files mapping scenarios to test cases.',
        context: ['PROJECT_STATE.md', 'specs/active/*.md'],
      },
      'specsafe:test-apply': {
        description: 'Apply tests — development mode',
        prompt: 'Guide implementation following Plan → Implement → Test → Commit. Never modify tests to pass.',
        context: ['PROJECT_STATE.md', 'specs/active/*.md', 'src/__tests__/**/*.test.ts'],
      },
      'specsafe:verify': {
        description: 'Run tests and iterate until pass',
        prompt: 'Run test suite, analyze failures, fix code (not tests), iterate. Report pass rate and coverage.',
        context: ['PROJECT_STATE.md', 'specs/active/*.md', 'src/__tests__/**/*.test.ts'],
      },
      'specsafe:done': {
        description: 'Complete and archive spec',
        prompt: 'Verify checklist, run final tests, archive spec. Generate completion summary.',
        context: ['PROJECT_STATE.md', 'specs/active/*.md'],
      },
      specsafe: {
        description: 'Show project status',
        prompt: 'Read PROJECT_STATE.md and show active specs, stages, and recommended next actions.',
        context: ['PROJECT_STATE.md'],
      },
    },
    workflow: {
      stages: ['EXPLORE', 'NEW', 'SPEC', 'TEST-CREATE', 'TEST-APPLY', 'VERIFY', 'DONE'],
      transitions: {
        EXPLORE: ['NEW'],
        NEW: ['SPEC'],
        SPEC: ['TEST-CREATE'],
        'TEST-CREATE': ['TEST-APPLY'],
        'TEST-APPLY': ['VERIFY'],
        VERIFY: ['DONE', 'TEST-APPLY'],
        DONE: [],
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Claude Code skills
// ---------------------------------------------------------------------------
const claudeSkillSpecsafeContent = [
  '---',
  'name: specsafe',
  'description: Show SpecSafe project status and workflow guidance',
  'disable-model-invocation: true',
  '---',
  '',
  'You are in a SpecSafe project using spec-driven development.',
  '',
  'Read PROJECT_STATE.md and provide:',
  '1. Summary of active specs and their current stages',
  '2. Which specs need attention',
  '3. Recommended next actions',
  '4. Brief reminder of the SDD workflow (EXPLORE → NEW → SPEC → TEST-CREATE → TEST-APPLY → VERIFY → DONE)',
].join('\n');

const claudeSkillSpecContent = [
  '---',
  'name: specsafe-spec',
  'description: Show details for a specific spec by ID',
  'argument-hint: "[spec-id]"',
  'disable-model-invocation: true',
  '---',
  '',
  'Read the spec file from specs/active/$ARGUMENTS.md and show:',
  '- Requirements',
  '- Scenarios/acceptance criteria',
  '- Current stage',
  '- Implementation files referenced',
  '',
  'If no argument provided, list available specs.',
].join('\n');

const claudeSkillValidateContent = [
  '---',
  'name: specsafe-validate',
  'description: Validate current implementation against active spec',
  'disable-model-invocation: true',
  '---',
  '',
  'Check if the current code changes satisfy the requirements in the active spec.',
  'Point out any gaps or issues that need to be addressed before completing.',
].join('\n');

const claudeSkillExploreContent = [
  '---',
  'name: specsafe-explore',
  'description: Pre-spec exploration and research mode',
  'argument-hint: "[feature-name]"',
  'disable-model-invocation: true',
  '---',
  '',
  'Guide pre-spec research: define problem, evaluate options, estimate effort.',
  'Output: specs/exploration/{feature-name}.md',
].join('\n');

const claudeSkillNewContent = [
  '---',
  'name: specsafe-new',
  'description: Initialize spec with PRD',
  'argument-hint: "[feature-name]"',
  'disable-model-invocation: true',
  '---',
  '',
  'Create a new spec with PRD. Generate SPEC-YYYYMMDD-NNN.',
  'Output to specs/drafts/SPEC-ID.md. Update PROJECT_STATE.md.',
].join('\n');

const claudeSkillTestCreateContent = [
  '---',
  'name: specsafe-test-create',
  'description: Create tests from spec scenarios',
  'argument-hint: "[spec-id]"',
  'disable-model-invocation: true',
  '---',
  '',
  'Generate test suite from specs/active/$ARGUMENTS.md.',
  'Create test files in src/__tests__/$ARGUMENTS/.',
  'Map Given/When/Then to test cases.',
].join('\n');

const claudeSkillTestApplyContent = [
  '---',
  'name: specsafe-test-apply',
  'description: Apply tests — development mode to pass tests',
  'argument-hint: "[spec-id]"',
  'disable-model-invocation: true',
  '---',
  '',
  'Guide implementation: Plan → Implement → Test → Commit.',
  'Never modify tests to pass — fix the code.',
].join('\n');

const claudeSkillVerifyContent = [
  '---',
  'name: specsafe-verify',
  'description: Verify implementation by running tests',
  'argument-hint: "[spec-id]"',
  'disable-model-invocation: true',
  '---',
  '',
  'Run tests and iterate. Fix code, not tests.',
  'Report pass rate, coverage %, issues.',
].join('\n');

const claudeSkillDoneContent = [
  '---',
  'name: specsafe-done',
  'description: Complete and archive spec',
  'argument-hint: "[spec-id]"',
  'disable-model-invocation: true',
  '---',
  '',
  'Verify checklist, run final tests, archive spec.',
  'Generate completion summary.',
].join('\n');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

async function generateCursorConfig(projectDir: string): Promise<void> {
  const configPath = `${projectDir}/.cursorrules`;
  if (existsSync(configPath)) {
    console.log(chalk.yellow('\u26a0 .cursorrules already exists, skipping'));
    return;
  }
  await writeFile(configPath, cursorRulesContent);
  console.log(chalk.green('\u2713 Created .cursorrules'));
}

async function generateContinueConfig(projectDir: string): Promise<void> {
  const configDir = `${projectDir}/.continue`;
  const configPath = `${configDir}/config.json`;
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
  }
  if (existsSync(configPath)) {
    console.log(chalk.yellow('\u26a0 .continue/config.json already exists, skipping'));
    return;
  }
  await writeFile(configPath, JSON.stringify(continueConfigContent, null, 2));
  console.log(chalk.green('\u2713 Created .continue/config.json'));
}

async function generateAiderConfig(projectDir: string): Promise<void> {
  const configPath = `${projectDir}/.aider.conf.yml`;
  if (existsSync(configPath)) {
    console.log(chalk.yellow('\u26a0 .aider.conf.yml already exists, skipping'));
    return;
  }
  await writeFile(configPath, aiderConfigContent);
  console.log(chalk.green('\u2713 Created .aider.conf.yml'));
}

async function generateZedConfig(projectDir: string): Promise<void> {
  const configDir = `${projectDir}/.zed`;
  const configPath = `${configDir}/settings.json`;
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
  }
  if (existsSync(configPath)) {
    console.log(chalk.yellow('\u26a0 .zed/settings.json already exists, skipping'));
    return;
  }
  await writeFile(configPath, JSON.stringify(zedSettingsContent, null, 2));
  console.log(chalk.green('\u2713 Created .zed/settings.json'));
}

async function generateClaudeCodeConfig(projectDir: string): Promise<void> {
  // CLAUDE.md
  const configPath = `${projectDir}/CLAUDE.md`;
  if (!existsSync(configPath)) {
    const claudeContent = [
      '# SpecSafe Project \u2014 Claude Code Configuration',
      '',
      'You are working on a SpecSafe project using spec-driven development (SDD).',
      '',
      '## Workflow',
      '',
      'EXPLORE \u2192 NEW \u2192 SPEC \u2192 TEST-CREATE \u2192 TEST-APPLY \u2192 VERIFY \u2192 DONE',
      '',
      '## CLI Commands',
      '',
      '- specsafe explore <name>',
      '- specsafe new <name>',
      '- specsafe spec <id>',
      '- specsafe test-create <id>',
      '- specsafe test-apply <id>',
      '- specsafe verify <id>',
      '- specsafe done <id>',
      '',
      '## Rules',
      '',
      'ALWAYS read PROJECT_STATE.md before making changes.',
      'ALWAYS reference spec ID in commit messages.',
      'NEVER modify tests to pass \u2014 fix the code.',
    ].join('\n');
    await writeFile(configPath, claudeContent);
    console.log(chalk.green('\u2713 Created CLAUDE.md'));
  } else {
    console.log(chalk.yellow('\u26a0 CLAUDE.md already exists, skipping'));
  }

  // Skills
  const skillsDir = `${projectDir}/.claude/skills`;
  if (!existsSync(skillsDir)) {
    await mkdir(skillsDir, { recursive: true });
  }

  const skills = [
    { name: 'specsafe', content: claudeSkillSpecsafeContent },
    { name: 'specsafe-spec', content: claudeSkillSpecContent },
    { name: 'specsafe-validate', content: claudeSkillValidateContent },
    { name: 'specsafe-explore', content: claudeSkillExploreContent },
    { name: 'specsafe-new', content: claudeSkillNewContent },
    { name: 'specsafe-test-create', content: claudeSkillTestCreateContent },
    { name: 'specsafe-test-apply', content: claudeSkillTestApplyContent },
    { name: 'specsafe-verify', content: claudeSkillVerifyContent },
    { name: 'specsafe-done', content: claudeSkillDoneContent },
  ];

  for (const skill of skills) {
    const skillDir = `${skillsDir}/${skill.name}`;
    const skillPath = `${skillDir}/SKILL.md`;
    if (!existsSync(skillPath)) {
      if (!existsSync(skillDir)) {
        await mkdir(skillDir, { recursive: true });
      }
      await writeFile(skillPath, skill.content);
      console.log(chalk.green(`\u2713 Created .claude/skills/${skill.name}/SKILL.md`));
    } else {
      console.log(chalk.yellow(`\u26a0 .claude/skills/${skill.name}/SKILL.md already exists, skipping`));
    }
  }
}

async function generateCrushConfig(projectDir: string): Promise<void> {
  const commandsDir = `${projectDir}/.opencode/commands`;
  if (!existsSync(commandsDir)) {
    await mkdir(commandsDir, { recursive: true });
  }

  const commands: Record<string, string> = {
    'specsafe.md': 'Show SpecSafe project status\n\nRead PROJECT_STATE.md and provide a summary of active specs, stages, and next actions.',
    'spec.md': 'Show details for a specific spec\n\nRead specs/active/$SPEC_ID.md and show requirements, scenarios, and current stage.',
    'validate.md': 'Validate implementation against active spec\n\nCheck if current code satisfies active spec requirements.',
    'specsafe-explore.md': 'Pre-spec exploration\n\nGuide research: define problem, evaluate tech options, estimate effort. Output: specs/exploration/FEATURE-NAME.md',
    'specsafe-new.md': 'Initialize spec with PRD\n\nCreate SPEC-YYYYMMDD-NNN with PRD. Output: specs/drafts/SPEC-ID.md',
    'specsafe-spec.md': 'Generate detailed spec\n\nConvert PRD to spec with FR-XXX, TR-XXX, Given/When/Then. Move to specs/active/.',
    'specsafe-test-create.md': 'Create tests from spec\n\nGenerate src/__tests__/SPEC-ID/*.test.ts mapping scenarios to test cases.',
    'specsafe-test-apply.md': 'Apply tests — development mode\n\nGuide implementation: Plan → Implement → Test → Commit. Never modify tests to pass.',
    'specsafe-verify.md': 'Verify implementation\n\nRun tests, analyze failures, fix code. Iterate until all pass.',
    'specsafe-done.md': 'Complete and archive\n\nVerify checklist, run final tests, archive spec. Generate summary.',
  };

  for (const [filename, content] of Object.entries(commands)) {
    const targetPath = `${commandsDir}/${filename}`;
    if (!existsSync(targetPath)) {
      await writeFile(targetPath, content);
      console.log(chalk.green(`\u2713 Created .opencode/commands/${filename}`));
    } else {
      console.log(chalk.yellow(`\u26a0 .opencode/commands/${filename} already exists, skipping`));
    }
  }
}

/**
 * Generate git hooks configuration
 */
export async function generateGitHooks(projectDir: string): Promise<void> {
  const hooksDir = `${projectDir}/.githooks`;
  const preCommitPath = `${hooksDir}/pre-commit`;

  if (!existsSync(hooksDir)) {
    await mkdir(hooksDir, { recursive: true });
  }

  if (existsSync(preCommitPath)) {
    console.log(chalk.yellow('\u26a0 .githooks/pre-commit already exists, skipping'));
    return;
  }

  const preCommitContent = [
    '#!/bin/bash',
    '# SpecSafe pre-commit hook v0.4.0',
    '# Enhanced verification for OpenSpec-style workflow',
    '',
    'set -e',
    '',
    'echo "Running SpecSafe pre-commit checks..."',
    '',
    'FAILED=0',
    '',
    '# Check 1: Validate PROJECT_STATE.md exists',
    'if [ ! -f "PROJECT_STATE.md" ]; then',
    '    echo "ERROR: PROJECT_STATE.md not found. Run specsafe init first."',
    '    FAILED=1',
    'fi',
    '',
    '# Check 2: Verify specs directory structure',
    'if [ -d "specs" ]; then',
    '    for subdir in drafts active archive exploration; do',
    '        if [ ! -d "specs/$subdir" ]; then',
    '            mkdir -p "specs/$subdir"',
    '        fi',
    '    done',
    'fi',
    '',
    '# Check 3: Run specsafe doctor if available',
    'if command -v specsafe >/dev/null 2>&1; then',
    '    specsafe doctor --silent 2>/dev/null || echo "Warning: specsafe doctor found issues"',
    'fi',
    '',
    'if [ $FAILED -eq 0 ]; then',
    '    echo "All pre-commit checks passed"',
    '    exit 0',
    'else',
    '    echo "Some pre-commit checks failed"',
    '    exit 1',
    'fi',
  ].join('\n');

  await writeFile(preCommitPath, preCommitContent);

  try {
    await chmod(preCommitPath, 0o755);
    console.log(chalk.green('\u2713 Created .githooks/pre-commit'));
  } catch {
    console.log(chalk.yellow('\u26a0 Could not make pre-commit executable'));
  }
}
