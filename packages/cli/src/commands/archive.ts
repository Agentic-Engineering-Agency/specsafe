import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow, ProjectTracker, validateSpecId } from '@specsafe/core';
import { access, rename, mkdir } from 'fs/promises';
import { join } from 'path';

export const archiveCommand = new Command('archive')
  .description('Move a COMPLETE spec to ARCHIVED stage')
  .argument('<id>', 'Spec ID to archive')
  .action(async (id: string) => {
    // Validate spec ID format
    validateSpecId(id);
    
    const spinner = ora(`Archiving ${id}...`).start();
    
    try {
      const workflow = new Workflow();
      const tracker = new ProjectTracker(process.cwd());
      
      // Load existing specs from disk
      await tracker.loadSpecsIntoWorkflow(workflow);
      
      // Check if spec exists
      const spec = workflow.getSpec(id);
      if (!spec) {
        spinner.fail(chalk.red(`Spec '${id}' not found in project state.`));
        process.exit(1);
      }
      
      // Validate spec is in COMPLETE stage
      if (spec.stage !== 'complete') {
        spinner.fail(chalk.red(`Cannot archive spec in ${spec.stage.toUpperCase()} stage. Must be COMPLETE.`));
        console.log(chalk.gray(`Current stage: ${spec.stage.toUpperCase()}`));
        console.log(chalk.gray('Use specsafe complete <id> to move to COMPLETE stage first.'));
        process.exit(1);
      }
      
      // Move spec file from specs/completed/ to specs/archive/
      const completedDir = join(process.cwd(), 'specs', 'completed');
      const archiveDir = join(process.cwd(), 'specs', 'archive');
      const sourcePath = join(completedDir, `${id}.md`);
      const destPath = join(archiveDir, `${id}.md`);
      
      // Check if source file exists
      try {
        await access(sourcePath);
      } catch {
        spinner.warn(chalk.yellow(`Spec file not found at ${sourcePath}`));
        console.log(chalk.gray('Continuing with workflow archive...'));
      }
      
      // Ensure archive directory exists
      await mkdir(archiveDir, { recursive: true });
      
      // Move the file (if it exists)
      try {
        await rename(sourcePath, destPath);
      } catch {
        // File might not exist, that's okay
      }
      
      // Use workflow to archive the spec
      workflow.archiveSpec(id);
      
      // Update PROJECT_STATE.md
      const archivedSpec = workflow.getSpec(id);
      if (archivedSpec) {
        await tracker.addSpec(archivedSpec);
      }
      
      spinner.succeed(chalk.green(`Archived ${id}`));
      console.log(chalk.blue(`  Stage: ${spec.stage.toUpperCase()} → ARCHIVED`));
      console.log(chalk.gray(`  File moved to: specs/archive/${id}.md`));
      
    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      process.exit(1);
    }
  });
