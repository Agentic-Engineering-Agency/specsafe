import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow, ProjectTracker, validateSpecId } from '@specsafe/core';

export const codeCommand = new Command('code')
  .description('Start implementation (TEST → CODE)')
  .argument('<id>', 'Spec ID')
  .action(async (id: string) => {
    const spinner = ora(`Starting implementation for ${id}...`).start();
    
    try {
      // Validate spec ID format
      validateSpecId(id);

      const workflow = new Workflow();
      const tracker = new ProjectTracker(process.cwd());
      
      // Load existing specs from disk
      await tracker.loadSpecsIntoWorkflow(workflow);
      
      // Move to code stage (validates tests exist)
      try {
        workflow.moveToCode(id);
      } catch (moveError: any) {
        if (moveError.message.includes('not found')) {
          throw new Error(`Spec '${id}' not found. Run 'specsafe spec ${id}' to create it first.`);
        }
        if (moveError.message.includes('Must be in TEST stage')) {
          throw new Error(`Spec '${id}' is not in TEST stage. Run 'specsafe test ${id}' first.`);
        }
        if (moveError.message.includes('No test files generated')) {
          throw new Error(`Spec '${id}' has no test files. Run 'specsafe test ${id}' to generate tests first.`);
        }
        throw moveError;
      }
      
      // Persist updated state
      await tracker.addSpec(workflow.getSpec(id)!);
      
      spinner.succeed(chalk.green(`Moved ${id} to CODE stage`));
      console.log(chalk.blue('Implement the functionality to pass all tests'));
      console.log(chalk.blue('Then: Run specsafe qa <id> when tests pass'));
    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      if (error.message.includes('not in TEST stage') || error.message.includes('Run \'specsafe test\'')) {
        console.log(chalk.gray(`💡 Tip: Run 'specsafe test ${id}' to generate tests first.`));
      } else if (error.message.includes('not found')) {
        console.log(chalk.gray(`💡 Tip: Run 'specsafe new <name>' to create a spec first.`));
      } else if (error.message.includes('No test files')) {
        console.log(chalk.gray(`💡 Tip: Run 'specsafe test ${id}' to generate tests first.`));
      }
      process.exit(1);
    }
  });
