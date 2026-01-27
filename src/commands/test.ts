import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { ProjectStateManager } from '../core/ProjectState.js';
import { logger } from '../utils/logger.js';

/**
 * Test generation and running commands
 */
export const testCommand = new Command('test')
  .description('Test generation and execution');

testCommand
  .command('create')
  .description('Generate test skeletons from specification')
  .argument('<name>', 'Name of specification')
  .option('-f, --framework <framework>', 'Test framework (vitest, jest)', 'vitest')
  .action(async (name, options) => {
    const projectRoot = process.cwd();
    const specPath = path.join(projectRoot, 'specs', 'active', name, 'spec.md');

    try {
      const specContent = await fs.readFile(specPath, 'utf-8');

      // Parse scenarios from spec
      const scenarios = extractScenarios(specContent);

      if (scenarios.length === 0) {
        logger.error('No scenarios found in specification');
        logger.info('Add scenarios using the format: "#### Scenario: [Name]"');
        process.exit(1);
      }

      logger.header('Generating Tests for: ' + name);
      logger.info('Found ' + scenarios.length + ' scenarios');

      // Generate test file based on framework
      const testContent = generateTestFile(name, scenarios, options.framework);

      // Determine test path
      const testDir = path.join(projectRoot, 'tests', 'unit');
      await fs.mkdir(testDir, { recursive: true });

      let testPath: string;
      if (options.framework === 'vitest' || options.framework === 'jest') {
        testPath = path.join(testDir, name + '.spec.test.ts');
      } else if (options.framework === 'pytest') {
        testPath = path.join(testDir, 'test_' + name + '.py');
      } else {
        logger.error('Unsupported framework: ' + options.framework);
        process.exit(1);
      }

      await fs.writeFile(testPath, testContent, 'utf-8');

      // Update PROJECT_STATE.md
      const manager = new ProjectStateManager(projectRoot);
      await manager.load();
      await manager.updateSpec(name, {
        phase: 'TEST',
        tests: scenarios.length,
        passing: 0,
      });
      await manager.addChangeLog({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        action: 'TEST_CREATE',
        spec: name,
        files: path.relative(projectRoot, testPath),
        agent: 'test-generator',
        notes: 'Generated ' + scenarios.length + ' tests',
      });

      logger.success('Generated ' + scenarios.length + ' tests');
      logger.info('Location: ' + testPath);
      logger.info('');
      logger.info('All tests are skipped (.skip) - implement to pass them');
      logger.info('Next: specsafe dev ' + name);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.error('Spec not found: ' + name);
      } else {
        logger.error('Failed to generate tests: ' + (error as Error).message);
      }
      process.exit(1);
    }
  });

testCommand
  .command('run')
  .description('Run tests (all or for a specific spec)')
  .argument('[name]', 'Name of specification (optional)')
  .action(async (name) => {
    logger.info('Running tests...');
    logger.info(
      'Test execution is implemented via npm test or your test framework'
    );
    logger.info('Example: npm test -- ' + (name ? name : ''));
  });

testCommand
  .command('watch')
  .description('Run tests in watch mode')
  .argument('[name]', 'Name of specification (optional)')
  .action(async (name) => {
    logger.info('Starting test watch mode...');
    logger.info('Test watch is implemented via your test framework');
    logger.info('Example: npm test -- --watch' + (name ? ' --run ' + name : ''));
  });

testCommand
  .command('coverage')
  .description('Show test coverage report')
  .action(async () => {
    logger.info('Generating coverage report...');
    logger.info('Run: npm test -- --coverage');
  });

/**
 * Extract scenarios from spec content
 */
function extractScenarios(
  content: string
): Array<{ name: string; given: string[]; when: string; then: string }> {
  const scenarios: Array<{
    name: string;
    given: string[];
    when: string;
    then: string;
  }> = [];

  const scenarioRegex =
    /#### Scenario: ([^\n]+)([\s\S]*?)(?=#### Scenario:|####\n|### Requirement:|##|\Z)/g;
  let match;

  while ((match = scenarioRegex.exec(content)) !== null) {
    const scenarioContent = match[2];
    const given = (
      scenarioContent.match(/\*\*GIVEN\*\*\s*([^\n]+)/g) || []
    ).map((m) => m.replace(/\*\*GIVEN\*\*\s*/, ''));
    const whenMatch = scenarioContent.match(/\*\*WHEN\*\*\s*([^\n]+)/);
    const thenMatch = scenarioContent.match(/\*\*THEN\*\*\s*([^\n]+)/);

    if (whenMatch && thenMatch) {
      scenarios.push({
        name: match[1].trim(),
        given,
        when: whenMatch[1].trim(),
        then: thenMatch[1].trim(),
      });
    }
  }

  return scenarios;
}

/**
 * Generate test file based on framework
 */
function generateTestFile(
  name: string,
  scenarios: Array<{ name: string; given: string[]; when: string; then: string }>,
  framework: string
): string {
  if (framework === 'vitest' || framework === 'jest') {
    return generateVitestFile(name, scenarios);
  } else if (framework === 'pytest') {
    return generatePytestFile(name, scenarios);
  }

  throw new Error('Unsupported framework: ' + framework);
}

function generateVitestFile(
  name: string,
  scenarios: Array<{ name: string; given: string[]; when: string; then: string }>
): string {
  const titleCase = name
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  let content = "import { describe, it, expect } from 'vitest';\n\n";
  content += "describe('" + titleCase + "', () => {\n";

  for (const scenario of scenarios) {
    const testName = scenario.then.replace(/[^\w\s]/g, '').trim();
    const whenClause = scenario.when.replace(/[^\w\s]/g, '').trim();

    content += '  // From: Scenario: ' + scenario.name + '\n';
    content +=
      '  it.skip(\'should ' +
      testName.toLowerCase() +
      ' when ' +
      whenClause.toLowerCase() +
      "', async () => {\n";

    if (scenario.given.length > 0) {
      for (const given of scenario.given) {
        content += '    // GIVEN: ' + given + '\n';
      }
    }

    content += '    // WHEN: ' + scenario.when + '\n';
    content += '    // THEN: ' + scenario.then + '\n';
    content += '\n';
    content += '    // Arrange\n';
    content += '\n';
    content += '    // Act\n';
    content += '\n';
    content += '    // Assert\n';
    content += '    expect(true).toBe(true);\n';
    content += '  });\n\n';
  }

  content += '});\n';

  return content;
}

function generatePytestFile(
  name: string,
  scenarios: Array<{ name: string; given: string[]; when: string; then: string }>
): string {
  const titleCase = name
    .replace(/-/g, '_')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  let content = 'import pytest\n\n';
  content += 'class Test' + titleCase.replace(/_/g, '') + ':\n';

  for (const scenario of scenarios) {
    const testName = scenario.then
      .replace(/[^\w\s]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');

    content += '    # From: Scenario: ' + scenario.name + '\n';
    content += '    @pytest.mark.skip(reason="Not implemented")\n';
    content += '    def test_' + testName + '(self):\n';

    if (scenario.given.length > 0) {
      for (const given of scenario.given) {
        content += '        # GIVEN: ' + given + '\n';
      }
    }

    content += '        # WHEN: ' + scenario.when + '\n';
    content += '        # THEN: ' + scenario.then + '\n';
    content += '\n';
    content += '        # Arrange\n';
    content += '\n';
    content += '        # Act\n';
    content += '\n';
    content += '        # Assert\n';
    content += '        assert True\n';
    content += '\n';
  }

  return content;
}
