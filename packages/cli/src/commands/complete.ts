import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow, ProjectTracker, validateSpecId } from '@specsafe/core';
import { rename, readFile, access } from 'fs/promises';
import { join } from 'path';
import type { QAReport } from '@specsafe/core';

export const completeCommand = new Command('complete')
  .description('Complete spec (QA → COMPLETE) [DEPRECATED: use "done" instead]')
  .argument('<id>', 'Spec ID')
  .option('-r, --report <path>', 'Path to QA report')
  .option('-n, --dry-run', 'Preview changes without writing files')
  .action(async (id: string, options: { report?: string; dryRun?: boolean }) => {
    // Show deprecation warning
    console.log(chalk.yellow('\n⚠️  DEPRECATION WARNING: "specsafe complete" is deprecated.'));
    console.log(chalk.yellow('   Use "specsafe done" instead for complete + archive functionality.\n'));
    
    const spinner = ora(`Completing ${id}...`).start();
    
    try {
      // Validate spec ID format
      validateSpecId(id);

      const workflow = new Workflow();
      const tracker = new ProjectTracker(process.cwd());

      // Load existing specs from disk
      await tracker.loadSpecsIntoWorkflow(workflow);

      // Load QA report from file if provided
      let qaReport: QAReport;
      if (options.report) {
        const reportContent = await readFile(options.report, 'utf-8');
        const parsedReport = JSON.parse(reportContent);
        
        // Validate required fields
        const requiredFields = ['id', 'specId', 'timestamp', 'recommendation', 'testResults', 'coverage', 'issues'];
        const missingFields = requiredFields.filter(field => !(field in parsedReport));
        if (missingFields.length > 0) {
          throw new Error(`Invalid QA report: missing required fields: ${missingFields.join(', ')}`);
        }
        
        // Validate recommendation value
        if (parsedReport.recommendation !== 'GO' && parsedReport.recommendation !== 'NO-GO') {
          throw new Error(`Invalid QA report: recommendation must be 'GO' or 'NO-GO', got '${parsedReport.recommendation}'`);
        }
        
        qaReport = parsedReport as QAReport;
        // Convert timestamp from ISO string to Date object (JSON.parse produces strings)
        if (typeof qaReport.timestamp === 'string') {
          qaReport.timestamp = new Date(qaReport.timestamp);
        }
      } else {
        // Default QA report
        qaReport = {
          id: `QA-${id}`,
          specId: id,
          timestamp: new Date(),
          testResults: [],
          coverage: { statements: 100, branches: 100, functions: 100, lines: 100 },
          recommendation: 'GO' as const,
          issues: [],
          notes: 'All tests passing'
        };
      }

      // Validate QA report
      if (qaReport.specId !== id) {
        throw new Error(`QA report spec ID (${qaReport.specId}) does not match target spec (${id})`);
      }
      if (qaReport.recommendation !== 'GO') {
        throw new Error('Cannot complete: QA report recommends NO-GO. Address issues first.');
      }

      // Validate required fields are present
      const requiredFields = ['id', 'specId', 'timestamp', 'recommendation', 'testResults', 'coverage', 'issues', 'notes'];
      const missingFields = requiredFields.filter(field => !(field in qaReport));
      if (missingFields.length > 0) {
        throw new Error(`QA report is missing required fields: ${missingFields.join(', ')}`);
      }

      const sourcePath = join('specs', 'active', `${id}.md`);
      const targetPath = join('specs', 'completed', `${id}.md`);

      // Handle dry-run mode
      if (options.dryRun) {
        spinner.stop();
        console.log(chalk.cyan('[DRY RUN] Would perform the following actions:\n'));
        console.log(chalk.cyan('  State transition:'));
        console.log(chalk.gray(`    QA → COMPLETE`));
        console.log(chalk.cyan(`\n  File move:`));
        console.log(chalk.gray(`    ${sourcePath} → ${targetPath}`));
        console.log(chalk.cyan(`\n  QA Report:`));
        console.log(chalk.gray(`    ID: ${qaReport.id}`));
        console.log(chalk.gray(`    Recommendation: ${qaReport.recommendation}`));
        console.log(chalk.gray(`    Coverage: ${JSON.stringify(qaReport.coverage)}`));
        console.log(chalk.cyan(`\n  Would update PROJECT_STATE.md for spec: ${id}`));
        process.exit(0);
      }

      // Move file FIRST, before updating state, to prevent inconsistent state on failure
      try {
        await access(sourcePath);
        await rename(sourcePath, targetPath);
      } catch (renameError: any) {
        if (renameError.code === 'ENOENT') {
          // Source file doesn't exist — skip the move (spec may have been created without a file)
          spinner.text = `Spec file not found at ${sourcePath}, skipping file move...`;
        } else {
          throw new Error(`Failed to move spec file: ${renameError.message}`);
        }
      }

      // Now update workflow state and persist
      try {
        workflow.moveToComplete(id, qaReport);
      } catch (moveError: any) {
        if (moveError.message.includes('not found')) {
          throw new Error(`Spec '${id}' not found. Run 'specsafe spec ${id}' to create it first.`);
        }
        if (moveError.message.includes('Must be in QA stage')) {
          throw new Error(`Spec '${id}' is not in QA stage. Run 'specsafe qa ${id}' first.`);
        }
        if (moveError.message.includes('NO-GO')) {
          throw new Error(`Cannot complete: QA report recommends NO-GO. Fix issues and re-run 'specsafe qa ${id}' first.`);
        }
        throw moveError;
      }
      await tracker.addSpec(workflow.getSpec(id)!);

      spinner.succeed(chalk.green(`✅ Completed ${id}`));
      console.log(chalk.blue('Spec moved to specs/completed/'));
      console.log(chalk.green('Ready for production!'));
    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      if (error.message.includes('not in QA stage') || error.message.includes('Run \'specsafe qa\'')) {
        console.log(chalk.gray(`💡 Tip: Run 'specsafe qa ${id}' to run QA validation first.`));
      } else if (error.message.includes('NO-GO')) {
        console.log(chalk.gray(`💡 Tip: Fix the failing tests and re-run 'specsafe qa ${id}' before completing.`));
      } else if (error.message.includes('not found')) {
        console.log(chalk.gray(`💡 Tip: Run 'specsafe new <name>' to create a spec first.`));
      } else if (error.message.includes('QA report')) {
        console.log(chalk.gray(`💡 Tip: Run 'specsafe qa ${id}' to generate a QA report first.`));
      }
      process.exit(1);
    }
  });
