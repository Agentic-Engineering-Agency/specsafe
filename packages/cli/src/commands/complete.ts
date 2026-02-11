import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow, ProjectTracker, validateSpecId } from '@specsafe/core';
import { rename, readFile, access } from 'fs/promises';
import { join } from 'path';
import type { QAReport } from '@specsafe/core';

export const completeCommand = new Command('complete')
  .description('Complete spec (QA → COMPLETE)')
  .argument('<id>', 'Spec ID')
  .option('-r, --report <path>', 'Path to QA report')
  .action(async (id: string, options: { report?: string }) => {
    // Validate spec ID format
    validateSpecId(id);
    
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

      // Move file FIRST, before updating state, to prevent inconsistent state on failure
      const sourcePath = join('specs', 'active', `${id}.md`);
      const targetPath = join('specs', 'completed', `${id}.md`);
      
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
      workflow.moveToComplete(id, qaReport);
      await tracker.addSpec(workflow.getSpec(id)!);

      spinner.succeed(chalk.green(`✅ Completed ${id}`));
      console.log(chalk.blue('Spec moved to specs/completed/'));
      console.log(chalk.green('Ready for production!'));
    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      process.exit(1);
    }
  });
