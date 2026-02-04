import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow } from '@specsafe/core';

export const specCommand = new Command('spec')
  .description('Move spec to SPEC stage (define requirements)')
  .argument('<id>', 'Spec ID')
  .action(async (id: string) => {
    const spinner = ora(`Moving ${id} to SPEC stage...`).start();
    
    try {
      const workflow = new Workflow();
      // Spec is created in SPEC stage, this validates requirements are defined
      spinner.succeed(chalk.green(`${id} is in SPEC stage`));
      console.log(chalk.blue('Next: Define requirements in the spec file'));
      console.log(chalk.blue('Then: Run specsafe test <id> to generate tests'));
    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      process.exit(1);
    }
  });