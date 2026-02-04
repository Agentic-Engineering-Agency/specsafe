import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow } from '@specsafe/core';

export const qaCommand = new Command('qa')
  .description('Run QA validation (CODE → QA)')
  .argument('<id>', 'Spec ID')
  .action(async (id: string) => {
    const spinner = ora(`Running QA for ${id}...`).start();
    
    try {
      const workflow = new Workflow();
      workflow.moveToQA(id);
      
      spinner.succeed(chalk.green(`Moved ${id} to QA stage`));
      console.log(chalk.blue('Run full test suite and generate QA report'));
      console.log(chalk.blue('Then: Run specsafe complete <id> when QA passes'));
    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      process.exit(1);
    }
  });