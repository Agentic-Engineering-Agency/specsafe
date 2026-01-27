import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { ProjectStateManager } from '../core/ProjectState.js';
import { logger } from '../utils/logger.js';

/**
 * Spec management commands
 */
export const specCommand = new Command('spec')
  .description('Manage specifications');

specCommand
  .command('create')
  .description('Create a new specification')
  .argument('<name>', 'Name of the specification/capability')
  .option('-t, --template <template>', 'Use a template', 'spec-template.md')
  .action(async (name, options) => {
    const projectRoot = process.cwd();
    const configPath = path.join(projectRoot, '.specsafe', 'config.yaml');

    try {
      await fs.access(configPath);
    } catch {
      logger.error('Not a SpecSafe project. Run: specsafe init');
      process.exit(1);
    }

    const specDir = path.join(projectRoot, 'specs', 'active', name);

    // Check if spec already exists
    try {
      await fs.access(specDir);
      logger.error(`Spec already exists: ${name}`);
      process.exit(1);
    } catch {
      // Doesn't exist, continue
    }

    try {
      // Create spec directory
      await fs.mkdir(specDir, { recursive: true });

      // Copy template or create empty spec
      const templatePath = path.join(projectRoot, 'specs', 'templates', options.template);
      const specPath = path.join(specDir, 'spec.md');

      try {
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        const specContent = templateContent.replace(/\[Capability Name\]/g, name);
        await fs.writeFile(specPath, specContent, 'utf-8');
      } catch {
        // Template doesn't exist, create empty spec
        const emptySpec = `# ${name} Specification

## Overview
[Brief description]

## User Stories
### US-001: [Title]
**As a** [role]
**I want** [feature]
**So that** [benefit]

## Requirements
### Requirement: [Name]
The system SHALL [requirement].

#### Scenario: [Name]
- **GIVEN** [precondition]
- **WHEN** [trigger]
- **THEN** [expected outcome]
`;
        await fs.writeFile(specPath, emptySpec, 'utf-8');
      }

      // Update PROJECT_STATE.md
      const manager = new ProjectStateManager(projectRoot);
      await manager.load();
      await manager.addSpec(name, 'SPEC');
      await manager.addChangeLog({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        action: 'SPEC_CREATE',
        spec: name,
        files: `specs/active/${name}/spec.md`,
        agent: 'human',
        notes: 'Specification created',
      });

      logger.success(`Created spec: ${name}`);
      logger.info(`Location: ${specPath}`);
      logger.info('');
      logger.info('Next steps:');
      logger.info('  1. Edit the specification');
      logger.info('  2. Generate tests: specsafe test create ' + name);
    } catch (error) {
      logger.error('Failed to create spec:', (error as Error).message);
      process.exit(1);
    }
  });

specCommand
  .command('list')
  .description('List all specifications')
  .action(async () => {
    const projectRoot = process.cwd();
    const manager = new ProjectStateManager(projectRoot);

    try {
      const state = await manager.load();

      if (state.specs.length === 0) {
        logger.info('No specifications found.');
        return;
      }

      logger.header(`Specifications (${state.specs.length})`);

      for (const spec of state.specs) {
        const icon =
          spec.location === 'active'
            ? '🔄'
            : spec.location === 'completed'
            ? '✅'
            : '🗑️';
        logger.spec(spec.name, `${spec.phase} | ${spec.location}/`);
      }
    } catch (error) {
      logger.error('Failed to load specifications');
    }
  });

specCommand
  .command('show')
  .description('Display specification details')
  .argument('<name>', 'Name of the specification')
  .action(async (name) => {
    const projectRoot = process.cwd();
    const specPath = path.join(projectRoot, 'specs', 'active', name, 'spec.md');

    try {
      const content = await fs.readFile(specPath, 'utf-8');
      console.log(content);
    } catch {
      logger.error(`Spec not found: ${name}`);
      logger.info('Try: specsafe spec list');
    }
  });

specCommand
  .command('validate')
  .description('Validate specification format')
  .argument('<name>', 'Name of the specification')
  .action(async (name) => {
    const projectRoot = process.cwd();
    const specPath = path.join(projectRoot, 'specs', 'active', name, 'spec.md');

    try {
      const content = await fs.readFile(specPath, 'utf-8');

      // Validate spec format
      let hasRequirements = false;
      let hasScenarios = false;
      let hasUserStories = false;

      if (content.includes('## Requirements')) hasRequirements = true;
      if (content.includes('#### Scenario:')) hasScenarios = true;
      if (content.includes('## User Stories')) hasUserStories = true;

      logger.header(`Spec Validation: ${name}`);

      if (hasRequirements) logger.success('✓ Requirements section found');
      else logger.error('✗ Missing Requirements section');

      if (hasUserStories) logger.success('✓ User Stories section found');
      else logger.warning('⚠ Missing User Stories section');

      if (hasScenarios) logger.success('✓ Scenarios found');
      else logger.error('✗ No scenarios defined');

      console.log();

      if (hasRequirements && hasScenarios) {
        logger.success('Specification is valid!');
      } else {
        logger.error('Specification needs fixes before generating tests.');
      }
    } catch {
      logger.error(`Spec not found: ${name}`);
    }
  });
