import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow } from '@specsafe/core';

export const testCommand = new Command('test')
  .description('Generate tests from spec (SPEC → TEST)')
  .argument('<id>', 'Spec ID')
  .action(async (id: string) => {
    const spinner = ora(`Generating tests for ${id}...`).start();
    
    try {
      const workflow = new Workflow();
      workflow.moveToTest(id);
      
      spinner.succeed(chalk.green(`Generated tests for ${id}`));
      console.log(chalk.blue('Tests created in tests/ directory'));
      console.log(chalk.blue('Next: Run specsafe code <id> to start implementation'));
    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      process.exit(1);
    }
  });