import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { 
  Workflow, 
  ProjectTracker, 
  generateReport, 
  formatReportAsMarkdown,
  DEFAULT_ANALYSIS_CONFIG 
} from '@specsafe/core';
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join, basename, extname } from 'path';
import { existsSync } from 'fs';
import type { ScreenshotSubmission, ExpectedState } from '@specsafe/core';

export const testSubmitCommand = new Command('test-submit')
  .description('Submit screenshots for E2E test analysis')
  .argument('<spec>', 'Spec ID')
  .option('-s, --screenshots <dir>', 'Directory containing screenshots')
  .option('-n, --notes <notes>', 'Additional notes')
  .option('--auto', 'Run Playwright automatically (future feature)')
  .option('--no-analyze', 'Skip AI analysis, just organize submissions')
  .action(async (specId: string, options: { 
    screenshots?: string; 
    notes?: string;
    auto?: boolean;
    analyze?: boolean;
  }) => {
    const spinner = ora('Processing test submissions...').start();

    try {
      // Check for auto mode (future feature)
      if (options.auto) {
        spinner.stop();
        console.log(chalk.yellow('\n⚠️  Auto mode is not yet implemented.'));
        console.log(chalk.gray('   Use --screenshots to submit existing screenshots.'));
        return;
      }

      // Validate spec exists
      const tracker = new ProjectTracker(process.cwd());
      const workflow = new Workflow();
      await tracker.loadSpecsIntoWorkflow(workflow);

      const specPath = join('specs/active', `${specId}.md`);
      if (!existsSync(specPath)) {
        throw new Error(`Spec not found: ${specPath}`);
      }

      // Load spec content
      const specContent = await readFile(specPath, 'utf-8');

      spinner.text = 'Collecting screenshots...';

      // Determine screenshots directory
      let screenshotsDir: string;
      if (options.screenshots) {
        screenshotsDir = options.screenshots;
      } else {
        // Default to .specsafe/e2e/screenshots/
        screenshotsDir = join('.specsafe', 'e2e', 'screenshots', specId);
      }

      if (!existsSync(screenshotsDir)) {
        spinner.stop();
        console.log(chalk.yellow(`\n⚠️  Screenshots directory not found: ${screenshotsDir}`));
        console.log(chalk.gray('   Create the directory and add your test screenshots.'));
        console.log(chalk.gray(`   Expected naming: step-id.png (e.g., FR-1-SC-1-step-2.png)`));
        return;
      }

      // Read screenshots
      const files = await readdir(screenshotsDir);
      const imageFiles = files.filter(f => 
        ['.png', '.jpg', '.jpeg', '.webp'].includes(extname(f).toLowerCase())
      );

      if (imageFiles.length === 0) {
        spinner.stop();
        console.log(chalk.yellow(`\n⚠️  No screenshots found in: ${screenshotsDir}`));
        console.log(chalk.gray('   Add .png, .jpg, or .webp files to submit for analysis.'));
        return;
      }

      spinner.text = `Found ${imageFiles.length} screenshot(s). Analyzing...`;

      // Parse submissions from filenames
      const submissions: ScreenshotSubmission[] = imageFiles.map(filename => {
        // Try to parse scenario/step from filename
        // Expected format: scenario-id-step-id.png or just any-name.png
        const nameWithoutExt = basename(filename, extname(filename));
        const parts = nameWithoutExt.split('-');
        
        // Try to extract scenario and step IDs
        let scenarioId = 'unknown';
        let stepId = 'step-1';
        
        // Look for patterns like FR-1-SC-1-step-2 or SC-1-step-1
        const scenarioMatch = nameWithoutExt.match(/(FR-\d+-SC-\d+|SC-\d+)/);
        if (scenarioMatch) {
          scenarioId = scenarioMatch[1];
        }
        
        const stepMatch = nameWithoutExt.match(/step-(\d+)/);
        if (stepMatch) {
          stepId = `step-${stepMatch[1]}`;
        }

        return {
          scenarioId,
          stepId,
          imagePath: join(screenshotsDir, filename),
          timestamp: new Date(),
          notes: options.notes
        };
      });

      // Copy screenshots to organized directory
      const organizedDir = join('.specsafe', 'e2e', 'screenshots', specId);
      await mkdir(organizedDir, { recursive: true });

      for (const submission of submissions) {
        const filename = basename(submission.imagePath);
        const destPath = join(organizedDir, filename);
        const content = await readFile(submission.imagePath);
        await writeFile(destPath, content);
        // Update path to organized location
        submission.imagePath = destPath;
      }

      // Parse expected states from spec
      const expectedStates = parseExpectedStatesFromSpec(specContent);

      if (options.analyze !== false) {
        spinner.text = 'Running AI analysis...';

        // Generate report
        const report = await generateReport(
          specId,
          process.env.USER || 'anonymous',
          submissions,
          expectedStates,
          DEFAULT_ANALYSIS_CONFIG
        );

        spinner.stop();

        // Save report
        const reportsDir = join('.specsafe', 'e2e', 'reports');
        await mkdir(reportsDir, { recursive: true });

        // Save as JSON
        const jsonPath = join(reportsDir, `${specId}-report.json`);
        await writeFile(jsonPath, JSON.stringify(report, null, 2));

        // Save as Markdown
        const markdownPath = join(reportsDir, `${specId}-report.md`);
        const markdownReport = formatReportAsMarkdown(report);
        await writeFile(markdownPath, markdownReport);

        // Display results
        console.log(chalk.green(`\n✅ Analysis complete!`));
        console.log(chalk.blue('\nResults:'));
        console.log(`  Scenarios tested: ${report.summary.totalScenarios}`);
        console.log(`  Steps tested: ${report.summary.totalSteps}`);
        console.log(`  Passed: ${chalk.green(report.summary.passed)} ✅`);
        console.log(`  Failed: ${report.summary.failed > 0 ? chalk.red(report.summary.failed) : chalk.gray(report.summary.failed)} ${report.summary.failed > 0 ? '❌' : ''}`);
        console.log(`  Partial: ${report.summary.partial > 0 ? chalk.yellow(report.summary.partial) : chalk.gray(report.summary.partial)} ${report.summary.partial > 0 ? '⚠️' : ''}`);
        console.log(`  Pass rate: ${(report.summary.passRate * 100).toFixed(1)}%`);

        if (report.summary.criticalIssues > 0 || report.summary.highIssues > 0) {
          console.log(chalk.red('\n  Issues found:'));
          if (report.summary.criticalIssues > 0) {
            console.log(chalk.red(`    🔴 Critical: ${report.summary.criticalIssues}`));
          }
          if (report.summary.highIssues > 0) {
            console.log(chalk.red(`    🟠 High: ${report.summary.highIssues}`));
          }
        }

        console.log(chalk.blue('\nReports saved:'));
        console.log(chalk.gray(`  JSON: ${jsonPath}`));
        console.log(chalk.gray(`  Markdown: ${markdownPath}`));

        console.log(chalk.blue('\nNext steps:'));
        console.log(chalk.gray(`  View full report: specsafe test-report ${specId}`));
        if (report.summary.failed > 0 || report.summary.partial > 0) {
          console.log(chalk.gray('  Fix issues and re-test'));
        } else {
          console.log(chalk.gray('  All tests passed! Ready to proceed.'));
        }
      } else {
        spinner.stop();
        console.log(chalk.green(`\n✅ Screenshots organized: ${organizedDir}`));
        console.log(chalk.gray(`   Skipped analysis (--no-analyze)`));
      }

    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      process.exit(1);
    }
  });

/**
 * Parse expected states from spec content
 */
function parseExpectedStatesFromSpec(content: string): ExpectedState[] {
  const states: ExpectedState[] = [];

  // Find scenarios section
  const scenariosMatch = content.match(/## \d+\.\s*Scenarios\n+([\s\S]*?)(?=## \d+\.|$)/);
  if (!scenariosMatch) {
    return states;
  }

  const scenarioBlocks = scenariosMatch[1].split(/### Scenario \d+:/);
  
  for (let i = 0; i < scenarioBlocks.length; i++) {
    const block = scenarioBlocks[i];
    if (!block.trim()) continue;

    const givenMatch = block.match(/[-*]\s*\*\*Given\*\*\s*(.+)/i);
    const whenMatch = block.match(/[-*]\s*\*\*When\*\*\s*(.+)/i);
    const thenMatch = block.match(/[-*]\s*\*\*Then\*\*\s*(.+)/i);

    if (givenMatch && whenMatch && thenMatch) {
      const scenarioId = `SC-${i}`;
      
      // Create expected states for each step
      states.push({
        scenarioId,
        stepId: 'step-1',
        description: givenMatch[1].trim(),
        visualIndicators: ['Initial state']
      });
      
      states.push({
        scenarioId,
        stepId: 'step-2',
        description: whenMatch[1].trim(),
        visualIndicators: ['Action in progress']
      });
      
      states.push({
        scenarioId,
        stepId: 'step-3',
        description: thenMatch[1].trim(),
        visualIndicators: ['Expected outcome']
      });
    }
  }

  return states;
}
