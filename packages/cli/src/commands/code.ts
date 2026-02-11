import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow, ProjectTracker, validateSpecId } from '@specsafe/core';

export const codeCommand = new Command('code')
  .description('Start implementation (TEST → CODE)')
  .argument('<id>', 'Spec ID')
  .action(async (id: string) => {
    // Validate spec ID format
    validateSpecId(id);
    
    const spinner = ora(`Starting implementation for ${id}...`).start();
    
    try {
      const workflow = new Workflow();
      const tracker = new ProjectTracker(process.cwd());
      
      // Load existing specs from disk
      await tracker.loadSpecsIntoWorkflow(workflow);
      
      workflow.moveToCode(id);
      
      // Persist updated state
      await tracker.addSpec(workflow.getSpec(id)!);
      
      spinner.succeed(chalk.green(`Moved ${id} to CODE stage`));
      console.log(chalk.blue('Implement the functionality to pass all tests'));
      console.log(chalk.blue('Then: Run specsafe qa <id> when tests pass'));
    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      process.exit(1);
    }
  });
