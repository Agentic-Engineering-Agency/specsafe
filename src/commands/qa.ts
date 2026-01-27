import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { ProjectStateManager } from '../core/ProjectState.js';
import { logger } from '../utils/logger.js';
import type { QAResult } from '../types.js';

/**
 * QA validation and reporting
 */
export const qaCommand = new Command('qa')
  .description('Run QA validation and generate reports');

qaCommand
  .command('run')
  .description('Run tests and generate QA report for a specification')
  .argument('<name>', 'Name of specification')
  .action(async (name) => {
    const projectRoot = process.cwd();
    const specPath = path.join(projectRoot, 'specs', 'active', name);
    const reportPath = path.join(specPath, 'qa-report.md');

    try {
      const manager = new ProjectStateManager(projectRoot);
      const state = await manager.load();
      const spec = state.specs.find((s) => s.name === name);

      if (!spec) {
        logger.error(`Spec not found: ${name}`);
        process.exit(1);
      }

      logger.header(`QA Validation: ${name}`);

      // Load config for thresholds
      const configPath = path.join(projectRoot, '.specsafe', 'config.yaml');
      const config = yaml.load(await fs.readFile(configPath, 'utf-8')) as any;
      const passThreshold = config.qa.passThreshold || 80;

      // Simulate test results (in real implementation, this would run actual tests)
      const mockResults = await runTests(projectRoot, name);

      // Generate QA report
      const qaResult: QAResult = {
        spec: name,
        generated: new Date().toISOString(),
        testResults: mockResults,
        coverage: {
          statements: 0, // Would be extracted from actual coverage
          branches: 0,
          functions: 0,
          lines: 0,
        },
        failedTests: [],
        cornerCases: [],
        recommendation:
          mockResults.passRate >= passThreshold ? 'GO' : 'NO-GO',
        rationale:
          mockResults.passRate >= passThreshold
            ? `Test pass rate (${mockResults.passRate}%) meets threshold (${passThreshold}%)`
            : `Test pass rate (${mockResults.passRate}%) below threshold (${passThreshold}%)`,
        actionItems:
          mockResults.passRate < passThreshold
            ? ['Fix failing tests', 'Improve test coverage']
            : [],
      };

      // Write QA report
      const reportContent = generateQAReport(qaResult);
      await fs.writeFile(reportPath, reportContent, 'utf-8');

      // Update PROJECT_STATE.md
      await manager.updateSpec(name, {
        phase: 'QA',
        passing: mockResults.passed,
        qaStatus: qaResult.recommendation,
      });
      await manager.addChangeLog({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        action: 'QA_REPORT',
        spec: name,
        files: 'qa-report.md',
        agent: 'qa-reviewer',
        notes: `Recommendation: ${qaResult.recommendation}`,
      });

      logger.success('QA report generated');
      logger.info(`Location: ${reportPath}`);
      logger.info('');
      logger.info(`Recommendation: ${qaResult.recommendation}`);
      logger.info(`Pass Rate: ${mockResults.passRate}%`);
      logger.info('');
      logger.info('Review the report and approve: specsafe complete ' + name);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.error(`Spec not found: ${name}`);
      } else {
        logger.error('Failed to run QA:', (error as Error).message);
      }
      process.exit(1);
    }
  });

qaCommand
  .command('report')
  .description('View existing QA report')
  .argument('<name>', 'Name of specification')
  .action(async (name) => {
    const projectRoot = process.cwd();
    const reportPath = path.join(projectRoot, 'specs', 'active', name, 'qa-report.md');

    try {
      const content = await fs.readFile(reportPath, 'utf-8');
      console.log(content);
    } catch {
      logger.error(`QA report not found: ${name}`);
      logger.info('Run QA first: specsafe qa run ' + name);
    }
  });

qaCommand
  .command('threshold')
  .description('Set or view QA pass threshold')
  .argument('[percent]', 'Pass threshold percentage (0-100)')
  .action(async (percent) => {
    if (!percent) {
      // View current threshold
      const projectRoot = process.cwd();
      const configPath = path.join(projectRoot, '.specsafe', 'config.yaml');
      const config = yaml.load(await fs.readFile(configPath, 'utf-8')) as any;
      logger.info(`Current pass threshold: ${config.qa.passThreshold}%`);
      return;
    }

    const value = parseInt(percent);
    if (isNaN(value) || value < 0 || value > 100) {
      logger.error('Invalid threshold. Must be between 0 and 100.');
      process.exit(1);
    }

    const projectRoot = process.cwd();
    const configPath = path.join(projectRoot, '.specsafe', 'config.yaml');
    const config = yaml.load(await fs.readFile(configPath, 'utf-8')) as any;
    config.qa.passThreshold = value;

    await fs.writeFile(configPath, yaml.dump(config, { indent: 2 }), 'utf-8');

    logger.success(`Pass threshold set to ${value}%`);
  });

/**
 * Run tests and get results (mock implementation)
 * In production, this would execute the actual test framework
 */
async function runTests(
  projectRoot: string,
  name: string
): Promise<{
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  passRate: number;
}> {
  // TODO: Integrate with actual test framework (vitest, jest, pytest)
  // For now, return mock results

  logger.info('Running tests...');
  logger.info('(Full test integration coming in Phase 2)');

  // Simulate running tests
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock results - would be parsed from actual test output
  return {
    passed: 8,
    failed: 2,
    skipped: 2,
    total: 12,
    passRate: 80,
  };
}

/**
 * Generate QA report markdown
 */
function generateQAReport(result: QAResult): string {
  return `# QA Report: ${result.spec}

**Generated:** ${new Date(result.generated).toLocaleString()}
**Spec:** specs/active/${result.spec}/spec.md

## Test Results

| Status | Count | Percentage |
|--------|-------|------------|
| Passed | ${result.testResults.passed} | ${Math.round(
    (result.testResults.passed / result.testResults.total) * 100
  )}% |
| Failed | ${result.testResults.failed} | ${Math.round(
    (result.testResults.failed / result.testResults.total) * 100
  )}% |
| Skipped | ${result.testResults.skipped} | ${Math.round(
    (result.testResults.skipped / result.testResults.total) * 100
  )}% |
| Total | ${result.testResults.total} | 100% |

**Pass Rate:** ${result.testResults.passRate}%

## Coverage

| Metric | Value |
|--------|-------|
| Statements | ${result.coverage.statements}% |
| Branches | ${result.coverage.branches}% |
| Functions | ${result.coverage.functions}% |
| Lines | ${result.coverage.lines}% |

## Failed Tests

${result.failedTests.length > 0 ? result.failedTests.map((t) => `1. ${t}`).join('\n') : 'No test failures'}

## Corner Cases

${result.cornerCases.length > 0 ? result.cornerCases.map((c) => `- ${c}`).join('\n') : 'No corner case issues identified'}

## Recommendation

# ${result.recommendation}

**Rationale:** ${result.rationale}

${
  result.actionItems.length > 0
    ? `## Action Items

${result.actionItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}`
    : ''
}

---

*Generated by SpecSafe QA Reviewer*
`;
}
