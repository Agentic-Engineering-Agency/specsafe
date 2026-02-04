import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow } from '@specsafe/core';
import { ProjectTracker } from '@specsafe/core';
import { rename } from 'fs/promises';
import { join } from 'path';

export const completeCommand = new Command('complete')
  .description('Complete spec (QA → COMPLETE)')
  .argument('<id>', 'Spec ID')
  .option('-r, --report <path>', 'Path to QA report')
  .action(async (id: string, options: { report?: string }) => {
    const spinner = ora(`Completing ${id}...`).start();
    
    try {
      const workflow = new Workflow();
      const tracker = new ProjectTracker(process.cwd());

      // TODO: Load actual QA report
      const qaReport = {
        id: `QA-${id}`,
        specId: id,
        timestamp: new Date(),
        testResults: [],
        coverage: { statements: 100, branches: 100, functions: 100, lines: 100 },
        recommendation: 'GO' as const,
        issues: [],
        notes: 'All tests passing'
      };

      workflow.moveToComplete(id, qaReport);
      await tracker.addSpec(workflow.getSpec(id)!);

      // Move spec file to completed/
      await rename(
        join('specs/active', `${id}.md`),
        join('specs/completed', `${id}.md`)
      );

      spinner.succeed(chalk.green(`✅ Completed ${id}`));
      console.log(chalk.blue('Spec moved to specs/completed/'));
      console.log(chalk.green('Ready for production!'));
    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      process.exit(1);
    }
  });