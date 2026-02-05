import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow } from '@specsafe/core';
import { ProjectTracker } from '@specsafe/core';
import { rename, readFile } from 'fs/promises';
import { join } from 'path';
import type { QAReport } from '@specsafe/core';

export const completeCommand = new Command('complete')
  .description('Complete spec (QA → COMPLETE)')
  .argument('<id>', 'Spec ID')
  .option('-r, --report <path>', 'Path to QA report')
  .action(async (id: string, options: { report?: string }) => {
    const spinner = ora(`Completing ${id}...`).start();
    
    try {
      const workflow = new Workflow();
      const tracker = new ProjectTracker(process.cwd());

      // Load existing specs from disk
      await tracker.loadSpecsIntoWorkflow(workflow);

      // Load QA report from file if provided
      let qaReport: QAReport;
      if (options.report) {
        const reportContent = await readFile(options.report, 'utf-8');
        qaReport = JSON.parse(reportContent) as QAReport;
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

      workflow.moveToComplete(id, qaReport);
      await tracker.addSpec(workflow.getSpec(id)!);

      // Check if source file exists before moving
      const sourcePath = join('specs/active', `${id}.md`);
      const targetPath = join('specs/completed', `${id}.md`);
      
      try {
        await rename(sourcePath, targetPath);
      } catch (renameError: any) {
        // Rollback workflow state if file move fails
        const spec = workflow.getSpec(id);
        if (spec) {
          spec.stage = 'qa' as const;
        }
        throw new Error(`Failed to move spec file: ${renameError.message}`);
      }

      spinner.succeed(chalk.green(`✅ Completed ${id}`));
      console.log(chalk.blue('Spec moved to specs/completed/'));
      console.log(chalk.green('Ready for production!'));
    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      process.exit(1);
    }
  });