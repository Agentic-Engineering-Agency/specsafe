import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { DEFAULT_CONFIG } from '../types.js';
import { logger } from '../utils/logger.js';

/**
 * Initializes a SpecSafe project
 */
export class ProjectInitializer {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Initialize a new SpecSafe project
   */
  async initialize(options: {
    projectName?: string;
    force?: boolean;
  } = {}): Promise<void> {
    const configPath = path.join(this.projectRoot, '.specsafe');

    logger.header('Initializing SpecSafe Project');

    // Check if already initialized
    try {
      await fs.access(configPath);
      if (!options.force) {
        logger.error('SpecSafe is already initialized in this directory');
        logger.info('Use --force to reinitialize');
        return;
      }
    } catch {
      // Doesn't exist, that's fine
    }

    // Create directory structure
    await this.createDirectories();

    // Create config file
    await this.createConfig(options.projectName);

    // Create templates
    await this.createTemplates();

    // Create PROJECT_STATE.md
    await this.createProjectState();

    // Create hooks directory and example hooks
    await this.createHooks();

    logger.success(`SpecSafe initialized successfully!`);
    logger.info('');
    logger.info('Next steps:');
    logger.info('  1. Create a spec: specsafe spec create <name>');
    logger.info('  2. Generate tests: specsafe test create <spec>');
    logger.info('  3. Start development: specsafe dev <spec>');
    logger.info('');
  }

  private async createDirectories(): Promise<void> {
    const dirs = [
      '.specsafe',
      '.specsafe/hooks',
      '.specsafe/mcp',
      '.specsafe/mcp/tools',
      '.specsafe/mcp/resources',
      '.specsafe/skills',
      '.specsafe/subagents',
      '.specsafe/subagents/spec-reviewer',
      '.specsafe/subagents/test-generator',
      '.specsafe/subagents/code-implementer',
      '.specsafe/subagents/qa-reviewer',
      '.specsafe/tasks',
      '.specsafe/tasks/templates',
      'specs/active',
      'specs/completed',
      'specs/archive',
      'specs/templates',
      'tests/unit',
      'tests/integration',
      'tests/e2e',
      'src',
      'tracking',
    ];

    logger.step(1, 6, 'Creating directory structure...');

    for (const dir of dirs) {
      const dirPath = path.join(this.projectRoot, dir);
      await fs.mkdir(dirPath, { recursive: true });
    }

    logger.success(`Created ${dirs.length} directories`);
  }

  private async createConfig(projectName?: string): Promise<void> {
    const configPath = path.join(this.projectRoot, '.specsafe', 'config.yaml');

    logger.step(2, 6, 'Creating configuration file...');

    const config = { ...DEFAULT_CONFIG };

    if (projectName) {
      config.specsafe.projectName = projectName;
    } else {
      // Try to infer from package.json
      try {
        const packagePath = path.join(this.projectRoot, 'package.json');
        const packageContent = await fs.readFile(packagePath, 'utf-8');
        const pkg = JSON.parse(packageContent);
        config.specsafe.projectName = pkg.name || 'My Project';
      } catch {
        // Use package.json name or default
        config.specsafe.projectName = projectName || 'My Project';
      }
    }

    const yamlContent = yaml.dump(config, { indent: 2 });
    await fs.writeFile(configPath, yamlContent, 'utf-8');

    logger.success('Created .specsafe/config.yaml');
  }

  private async createTemplates(): Promise<void> {
    logger.step(3, 6, 'Creating spec templates...');

    // Spec template
    const specTemplate = `# [Capability Name] Specification

## Overview
[Brief description of this capability]

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
`;

    const specPath = path.join(this.projectRoot, 'specs', 'templates', 'spec-template.md');
    await fs.writeFile(specPath, specTemplate, 'utf-8');

    logger.success('Created spec templates');
  }

  private async createProjectState(): Promise<void> {
    logger.step(4, 6, 'Creating PROJECT_STATE.md...');

    const content = `# Project State - ${await this.getProjectName()}

**Last Updated:** ${new Date().toISOString()}
**Current Phase:** SPEC
**Active Spec:** None

## Spec Status Summary

| Spec | Location | Phase | Tests | Pass Rate | Coverage | QA Status |
|------|----------|-------|-------|-----------|----------|-----------|

**Legend:**
- \`active/\` - Currently in development workflow
- \`completed/\` - Production-ready, human-approved
- \`archive/\` - Deprecated/removed (trashcan)

## Current Work

No active work in progress.

## Pending Human Approvals

| Spec | QA Date | Pass Rate | Coverage | Recommendation |
|------|---------|-----------|----------|----------------|
| (none pending) | - | - | - | - |

## Change Log

| Date | Time | Action | Spec | Files | Agent | Notes |
|------|------|--------|------|-------|-------|-------|

## Metrics

| Metric | Value | Target |
|--------|-------|--------|
| Specs in Development | 0 | - |
| Specs Completed | 0 | - |
| Specs Archived | 0 | - |
| Overall Test Coverage | N/A | 80% |

---

*Generated by SpecSafe*
`;

    const statePath = path.join(this.projectRoot, 'PROJECT_STATE.md');
    await fs.writeFile(statePath, content, 'utf-8');

    logger.success('Created PROJECT_STATE.md');
  }

  private async createHooks(): Promise<void> {
    logger.step(5, 6, 'Creating git hooks...');

    // Pre-commit hook
    const preCommit = `#!/bin/bash
# SpecSafe pre-commit hook
# Validates before allowing git commit

echo "Running SpecSafe pre-commit checks..."

# Check if tests pass
if npm test -- --run --reporter=basic 2>/dev/null; then
  echo "✓ Tests passing"
else
  echo "❌ Tests failing. Commit blocked."
  exit 1
fi

# Check if tracking is updated
LAST_UPDATE=\$(grep "Last Updated" PROJECT_STATE.md | cut -d' ' -f3)
TODAY=\$(date +"%Y-%m-%d")

if [[ "\$LAST_UPDATE" != "\$TODAY" ]]; then
  echo "⚠️  PROJECT_STATE.md not updated today."
fi

echo "✓ Pre-commit checks passed"
exit 0
`;

    const preCommitPath = path.join(this.projectRoot, '.specsafe', 'hooks', 'pre-commit.sh');
    await fs.writeFile(preCommitPath, preCommit, 'utf-8');

    // Make executable
    await fs.chmod(preCommitPath, 0o755);

    logger.success('Created git hooks');

    // Instructions for installing the hook
    logger.step(6, 6, 'Setup complete');
    logger.info('');
    logger.info('To install the git pre-commit hook, run:');
    logger.info('  ln -sf ../../.specsafe/hooks/pre-commit.sh .git/hooks/pre-commit');
    logger.info('');
  }

  private async getProjectName(): Promise<string> {
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(packageContent);
      return pkg.name || 'My Project';
    } catch {
      return 'My Project';
    }
  }
}
