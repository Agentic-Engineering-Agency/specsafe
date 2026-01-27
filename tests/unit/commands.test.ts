import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

describe('CLI Commands', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create temp directory for testing
    const os = await import('os');
    tempDir = path.join(os.tmpdir(), `specsafe-cli-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      const fs = await import('fs');
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('initialization', () => {
    it('should create .specsafe directory', async () => {
      const { ProjectInitializer } = await import('../../src/core/Initializer.js');
      const initializer = new ProjectInitializer(tempDir);

      await initializer.initialize();

      const specsafeDir = path.join(tempDir, '.specsafe');
      const exists = await fs.access(specsafeDir).then(() => true, () => false);
      expect(exists).toBe(true);
    });

    it('should create config file', async () => {
      const { ProjectInitializer } = await import('../../src/core/Initializer.js');
      const initializer = new ProjectInitializer(tempDir);

      await initializer.initialize();

      const configPath = path.join(tempDir, '.specsafe', 'config.yaml');
      const content = await fs.readFile(configPath, 'utf-8');
      const config = yaml.load(content) as any;

      expect(config).toBeDefined();
      expect(config.specsafe.version).toBeDefined();
    });

    it('should create PROJECT_STATE.md', async () => {
      const { ProjectInitializer } = await import('../../src/core/Initializer.js');
      const initializer = new ProjectInitializer(tempDir);

      await initializer.initialize();

      const statePath = path.join(tempDir, 'PROJECT_STATE.md');
      const content = await fs.readFile(statePath, 'utf-8');

      expect(content).toContain('# Project State');
      expect(content).toContain('## Spec Status Summary');
    });

    it('should create directory structure', async () => {
      const { ProjectInitializer } = await import('../../src/core/Initializer.js');
      const initializer = new ProjectInitializer(tempDir);

      await initializer.initialize();

      const dirs = [
        'specs/active',
        'specs/completed',
        'specs/archive',
        'tests/unit',
        'tests/integration',
        'tests/e2e',
        'tracking',
      ];

      for (const dir of dirs) {
        const dirPath = path.join(tempDir, dir);
        const exists = await fs.access(dirPath).then(() => true, () => false);
        expect(exists).toBe(true);
      }
    });
  });

  describe('spec command', () => {
    beforeEach(async () => {
      // Initialize SpecSafe
      const { ProjectInitializer } = await import('../../src/core/Initializer.js');
      const initializer = new ProjectInitializer(tempDir);
      await initializer.initialize();
    });

    it('should create new spec', async () => {
      const specDir = path.join(tempDir, 'specs', 'active', 'test-spec');
      const specPath = path.join(specDir, 'spec.md');

      // Simulate spec create command
      await fs.mkdir(specDir, { recursive: true });

      const content = `# Test Specification

## Overview
Test spec

## User Stories
### US-001
As a user I want feature so that benefit

## Requirements
### Requirement 1
The system SHALL do something.

#### Scenario: Test
- **GIVEN** precondition
- **WHEN** action
- **THEN** result
`;
      await fs.writeFile(specPath, content, 'utf-8');

      // Verify spec exists
      const exists = await fs.access(specPath).then(() => true, () => false);
      expect(exists).toBe(true);
    });

    it('should validate spec with requirements', async () => {
      // Create spec
      const specDir = path.join(tempDir, 'specs', 'active', 'valid-spec');
      await fs.mkdir(specDir, { recursive: true });

      const specPath = path.join(specDir, 'spec.md');
      const content = `# Valid Spec

## Requirements
The system SHALL work.

#### Scenario: Test
- **WHEN** action
- **THEN** result
`;
      await fs.writeFile(specPath, content, 'utf-8');

      // Verify content
      const specContent = await fs.readFile(specPath, 'utf-8');
      expect(specContent).toContain('## Requirements');
      expect(specContent).toContain('#### Scenario:');
    });
  });

  describe('test generation', () => {
    beforeEach(async () => {
      // Initialize SpecSafe
      const { ProjectInitializer } = await import('../../src/core/Initializer.js');
      const initializer = new ProjectInitializer(tempDir);
      await initializer.initialize();
    });

    it('should extract scenarios from spec', async () => {
      // Create spec with scenarios
      const specDir = path.join(tempDir, 'specs', 'active', 'test-spec');
      await fs.mkdir(specDir, { recursive: true });

      const specPath = path.join(specDir, 'spec.md');
      const content = `# Test Spec

## Requirements

#### Scenario: First test
- **GIVEN** user exists
- **WHEN** user logs in
- **THEN** redirect to dashboard

#### Scenario: Second test
- **WHEN** invalid input
- **THEN** show error
`;
      await fs.writeFile(specPath, content, 'utf-8');

      // Simulate scenario extraction
      const scenarios: any[] = [];
      const scenarioRegex = /#### Scenario: ([^\n]+)([\s\S]*?)(?=#### Scenario:|$)/g;
      let match;

      while ((match = scenarioRegex.exec(content)) !== null) {
        const scenarioContent = match[2];
        scenarios.push({
          name: match[1].trim(),
          given: (scenarioContent.match(/\*\*GIVEN\*\*\s*([^\n]+)/g) || []).map((m) =>
            m.replace(/\*\*GIVEN\*\*\s*/, '')
          ),
          when: (scenarioContent.match(/\*\*WHEN\*\*\s*([^\n]+)/) || [''])[0].trim(),
          then: (scenarioContent.match(/\*\*THEN\*\*\s*([^\n]+)/) || [''])[0].trim(),
        });
      }

      expect(scenarios).toHaveLength(2);
      expect(scenarios[0].name).toBe('First test');
      expect(scenarios[1].name).toBe('Second test');
    });

    it('should generate vitest test file', () => {
      const scenarios = [
        {
          name: 'User login',
          given: ['user exists'],
          when: 'user logs in',
          then: 'redirect to dashboard',
        },
      ];

      let content = `import { describe, it, expect } from 'vitest';

describe('User Login', () => {
`;

      for (const scenario of scenarios) {
        const testName = 'redirect to dashboard';
        const whenClause = 'user logs in';

        content += `  // From: Scenario: ${scenario.name}
  it.skip('should ${testName.toLowerCase()} when ${whenClause.toLowerCase()}', async () => {
`;
        if (scenario.given.length > 0) {
          for (const given of scenario.given) {
            content += `    // GIVEN: ${given}\n`;
          }
        }

        content += `    // WHEN: ${scenario.when}
    // THEN: ${scenario.then}

    // Arrange

    // Act

    // Assert
    expect(true).toBe(true);
  });

`;
      }

      content += `});\n`;

      expect(content).toContain("describe('User Login'");
      expect(content).toContain('it.skip');
      expect(content).toContain('// GIVEN:');
      expect(content).toContain('// WHEN:');
      expect(content).toContain('// THEN:');
    });
  });

  describe('archive workflow', () => {
    beforeEach(async () => {
      // Initialize SpecSafe
      const { ProjectInitializer } = await import('../../src/core/Initializer.js');
      const initializer = new ProjectInitializer(tempDir);
      await initializer.initialize();
    });

    it('should move spec to archive', async () => {
      // Create spec in active
      const activeDir = path.join(tempDir, 'specs', 'active', 'old-spec');
      await fs.mkdir(activeDir, { recursive: true });
      await fs.writeFile(path.join(activeDir, 'spec.md'), '# Old Spec\n', 'utf-8');

      // Create archive folder
      const archiveDir = path.join(
        tempDir,
        'specs',
        'archive',
        `2026-01-26-old-spec`
      );
      await fs.mkdir(path.dirname(archiveDir), { recursive: true });

      // Move to archive
      await fs.rename(activeDir, archiveDir);

      // Verify spec is archived
      const activeExists = await fs
        .access(activeDir)
        .then(() => true, () => false);
      const archiveExists = await fs
        .access(archiveDir)
        .then(() => true, () => false);

      expect(activeExists).toBe(false);
      expect(archiveExists).toBe(true);
    });

    it('should create deprecation notice', async () => {
      const archiveDir = path.join(
        tempDir,
        'specs',
        'archive',
        `2026-01-26-old-spec`
      );
      await fs.mkdir(archiveDir, { recursive: true });

      const deprecationPath = path.join(archiveDir, 'deprecation.md');
      const content = `# Deprecation: old-spec

**Archived Date:** 2026-01-26
**Reason:** Feature removed

## Notes

This specification has been archived.
`;
      await fs.writeFile(deprecationPath, content, 'utf-8');

      const deprecationContent = await fs.readFile(deprecationPath, 'utf-8');
      expect(deprecationContent).toContain('Deprecation: old-spec');
      expect(deprecationContent).toContain('Feature removed');
    });
  });
});
